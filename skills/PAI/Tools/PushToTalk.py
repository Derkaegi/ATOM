#!/usr/bin/env python3
"""
PAI Push-to-Talk Voice Loop
----------------------------
Hold F4 → records mic → release → Whisper transcribes → xdotool types into active window

Usage:
    python3 PushToTalk.py

Requires: xdotool, openai-whisper, parecord (pulseaudio-utils)
"""

import subprocess
import sys
import os
import time
import tempfile
import threading
import signal
import json
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
HOME = Path.home()
ENV_FILE = HOME / ".env"
VOICE_SERVER = "http://localhost:8888/notify"
HOTKEY = "F4"
# Mic source — C920 webcam mic (best quality). Change if needed.
MIC_SOURCE = "alsa_input.usb-046d_HD_Pro_Webcam_C920_9EB43C1F-02.analog-stereo"
WHISPER_MODEL = "base.en"   # fast, good enough. Options: tiny.en, base.en, small.en, medium.en
WHISPER_BIN = str(Path.home() / ".claude/pai-venv/bin/whisper")
MIN_RECORD_SECS = 0.5       # ignore recordings shorter than this
BEEP_START = False          # disable beeps — they bleed into the mic and confuse Whisper
SUBMIT_ENTER = True         # press Enter after typing (auto-submit to Claude Code)
WHISPER_PROMPT = "Herbert talking to his AI assistant ATOM."  # primes Whisper context

# ── Load .env ─────────────────────────────────────────────────────────────────
env = {}
try:
    for line in ENV_FILE.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip('"').strip("'")
except Exception:
    pass

# ── State ─────────────────────────────────────────────────────────────────────
recording = False
record_proc = None
record_file = None
speaking = False   # True while voice server is playing audio
lock = threading.Lock()

# File-based IPC so --start and --stop can share state across separate processes
STATE_FILE = "/tmp/pai-ptt.state"   # JSON: {pid, wav_file}

# ── Helpers ───────────────────────────────────────────────────────────────────

def notify(message: str):
    """Send message to PAI voice server (non-blocking)."""
    try:
        subprocess.Popen(
            ["curl", "-s", "-X", "POST", VOICE_SERVER,
             "-H", "Content-Type: application/json",
             "-d", json.dumps({"message": message, "voice_id": "YOUR_VOICE_ID_HERE"})],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
    except Exception:
        pass

def beep(freq=880, duration_ms=80):
    """Short system beep via paplay sine wave."""
    try:
        subprocess.Popen(
            ["bash", "-c",
             f"python3 -c \"import struct,wave,tempfile,subprocess,math,os; "
             f"f=tempfile.mktemp(suffix='.wav'); "
             f"w=wave.open(f,'w'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(44100); "
             f"w.writeframes(bytes(struct.pack('<h', int(32767*math.sin(2*math.pi*{freq}*i/44100))) "
             f"for i in range(int(44100*{duration_ms}/1000)))); w.close(); "
             f"subprocess.run(['paplay',f]); os.unlink(f)\""],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
    except Exception:
        pass

def start_recording():
    """Called by xbindkeys on F4 press. Starts parecord, writes PID+path to STATE_FILE."""
    # Atomic exclusive create — prevents TOCTOU race when xbindkeys fires --start rapidly
    try:
        fd = os.open(STATE_FILE, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        print("⚠️  Already recording, ignoring duplicate start.", flush=True)
        return

    tmp = tempfile.mktemp(suffix=".wav")

    if BEEP_START:
        beep(880, 80)   # high beep = start

    print(f"🎙️  Recording... ({tmp})", flush=True)

    proc = subprocess.Popen(
        ["parecord", "--device", MIC_SOURCE,
         "--file-format=wav", "--rate=16000", "--channels=1",
         tmp],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )

    # Write state so --stop can find the process
    with os.fdopen(fd, "w") as f:
        json.dump({"pid": proc.pid, "wav": tmp}, f)


def stop_recording():
    """Called by xbindkeys on F4 release. Reads STATE_FILE, kills parecord, transcribes."""
    if not os.path.exists(STATE_FILE):
        print("⚠️  No active recording found.", flush=True)
        return

    try:
        with open(STATE_FILE) as f:
            state = json.load(f)
        os.unlink(STATE_FILE)
    except Exception as e:
        print(f"❌ Could not read state: {e}", flush=True)
        return

    pid = state.get("pid")
    wav_file = state.get("wav")

    beep(440, 80)   # low beep = stop
    print("⏹️  Stopped. Transcribing...", flush=True)

    # Kill the recorder BEFORE deleting state file to avoid race with --start
    try:
        os.kill(pid, 15)   # SIGTERM
        time.sleep(0.3)
    except ProcessLookupError:
        pass   # already dead

    if not wav_file or not os.path.exists(wav_file):
        print("❌ WAV file missing.", flush=True)
        return

    # Check duration
    size = os.path.getsize(wav_file)
    duration = max(0, (size - 44) / 32000)
    if duration < MIN_RECORD_SECS:
        print(f"⚠️  Too short ({duration:.1f}s), ignoring.", flush=True)
        os.unlink(wav_file)
        return

    transcribe_and_inject(wav_file)

def transcribe_and_inject(wav_file: str):
    global speaking
    try:
        print(f"🔤 Transcribing {wav_file}...", flush=True)
        notify("Transcribing...")

        # Use whisper Python API directly (avoids ffmpeg dependency for WAV files)
        import sys as _sys
        _sys.path.insert(0, str(Path.home() / ".claude/pai-venv/lib/python3.12/site-packages"))
        import whisper as _whisper
        import soundfile as _sf
        import numpy as _np

        # Load audio via soundfile (no ffmpeg needed for WAV)
        audio_data, sample_rate = _sf.read(wav_file, dtype="float32")
        if len(audio_data.shape) > 1:
            audio_data = audio_data.mean(axis=1)  # stereo → mono
        # Resample to 16kHz if needed
        if sample_rate != 16000:
            import scipy.signal as _sig
            audio_data = _sig.resample(audio_data, int(len(audio_data) * 16000 / sample_rate))

        model = _whisper.load_model(WHISPER_MODEL)
        result = model.transcribe(audio_data, language="en", fp16=False, verbose=False,
                                   initial_prompt=WHISPER_PROMPT)
        text = result.get("text", "").strip()

        if not text:
            print("⚠️  No transcription.", flush=True)
            beep(220, 150)
            return

        print(f"📝 Transcribed: {text}", flush=True)

        # Small delay to let any in-progress audio finish
        time.sleep(0.2)

        # Type into active window
        subprocess.run(
            ["xdotool", "type", "--clearmodifiers", "--delay", "20", text],
            timeout=10
        )

        if SUBMIT_ENTER:
            time.sleep(0.1)
            subprocess.run(["xdotool", "key", "Return"])

        print("✅ Submitted.", flush=True)

    except subprocess.TimeoutExpired:
        print("❌ Transcription timed out.", flush=True)
        notify("Transcription timed out, sorry.")
    except Exception as e:
        print(f"❌ Error: {e}", flush=True)
    finally:
        try:
            os.unlink(wav_file)
        except Exception:
            pass

# ── Hotkey listener (xbindkeys calls this script with args) ───────────────────
# OR: use xinput / evdev polling loop

def run_hotkey_daemon():
    """
    Uses xbindkeys to trigger this script.
    This function runs the POLLING loop as a fallback using xinput grab.
    We use a simpler approach: listen via subprocess to xinput events for F4.
    """
    print(f"🎙️  PAI Push-to-Talk ready. Hold {HOTKEY} to speak.", flush=True)
    print(f"   Mic: {MIC_SOURCE}", flush=True)
    print(f"   Whisper model: {WHISPER_MODEL}", flush=True)
    print(f"   Press Ctrl+C to stop.\n", flush=True)

    notify("Push to talk ready. Hold F4 to speak to me, Herbert.")

    # Use xinput to watch keyboard events
    # Get keyboard device ID
    result = subprocess.run(
        ["bash", "-c", "xinput list | grep -i 'keyboard\\|Virtual core keyboard' | grep -v 'pointer\\|XTEST\\|Virtual core keyboard' | head -5"],
        capture_output=True, text=True
    )
    print(f"Keyboard devices found:\n{result.stdout}", flush=True)

    # Use xbindkeys approach: write config and run it
    xbindkeys_config = HOME / ".xbindkeysrc.pai"
    xbindkeys_config.write_text(f'''# PAI Push-to-Talk
"{sys.executable} {__file__} --start"
    F4

"{sys.executable} {__file__} --stop"
    Release + F4
''')

    # Kill any existing xbindkeys
    subprocess.run(["pkill", "-f", "xbindkeys.*pai"], stderr=subprocess.DEVNULL)
    time.sleep(0.3)

    # Start xbindkeys with our config
    proc = subprocess.Popen(
        ["xbindkeys", "-f", str(xbindkeys_config), "-n"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )

    print(f"✅ xbindkeys started (PID {proc.pid})", flush=True)

    # Keep alive
    try:
        proc.wait()
    except KeyboardInterrupt:
        proc.terminate()
        print("\n👋 Push-to-Talk stopped.", flush=True)

# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if "--start" in sys.argv:
        start_recording()
    elif "--stop" in sys.argv:
        stop_recording()
    elif "--test" in sys.argv:
        # Quick mic test
        notify("Testing microphone. Speak now.")
        start_recording()
        time.sleep(3)
        stop_recording()
        time.sleep(10)
    else:
        # Daemon mode
        signal.signal(signal.SIGTERM, lambda s, f: sys.exit(0))
        run_hotkey_daemon()
