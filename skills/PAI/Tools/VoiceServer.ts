#!/usr/bin/env bun
/**
 * PAI Voice Server — listens on :8888, speaks via ElevenLabs TTS
 * POST /notify  { message, voice_id?, title? }
 * POST /notify/personality  { message, voice_settings, title? }
 */

import { spawnSync } from "bun";

const PORT = 8888;
const ENV_FILE = `${process.env.HOME}/.env`;

// Load .env
const envText = await Bun.file(ENV_FILE).text().catch(() => "");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.+)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (!ELEVENLABS_API_KEY) {
  console.error("❌ ELEVENLABS_API_KEY not found in ~/.env");
  process.exit(1);
}

// Voice configs from settings.json
const SETTINGS_FILE = `${process.env.HOME}/.claude/settings.json`;
let voices: Record<string, any> = {};
try {
  const settings = JSON.parse(await Bun.file(SETTINGS_FILE).text());
  voices = settings?.daidentity?.voices ?? {};
} catch {}

const DEFAULT_VOICE = {
  voiceId: voices.main?.voiceId ?? "onwK4e9ZLuTAKqWW03F9",
  stability: voices.main?.stability ?? 0.85,
  similarity_boost: voices.main?.similarity_boost ?? 0.7,
  style: voices.main?.style ?? 0.3,
  speed: voices.main?.speed ?? 1.1,
  use_speaker_boost: voices.main?.use_speaker_boost ?? true,
};

const ALGORITHM_VOICE = {
  voiceId: voices.algorithm?.voiceId ?? "IKne3meq5aSn9XLyUdCD",
  stability: voices.algorithm?.stability ?? 0.3,
  similarity_boost: voices.algorithm?.similarity_boost ?? 0.75,
  style: voices.algorithm?.style ?? 0.8,
  speed: voices.algorithm?.speed ?? 1.2,
  use_speaker_boost: voices.algorithm?.use_speaker_boost ?? true,
};

async function speak(text: string, voiceCfg: typeof DEFAULT_VOICE) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceCfg.voiceId}/stream`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: {
        stability: voiceCfg.stability,
        similarity_boost: voiceCfg.similarity_boost,
        style: voiceCfg.style,
        speed: voiceCfg.speed,
        use_speaker_boost: voiceCfg.use_speaker_boost,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`ElevenLabs error ${res.status}: ${err}`);
    return;
  }

  // ElevenLabs returns MP3 — write to temp file, play with paplay
  const audioData = await res.arrayBuffer();
  const tmp = `/tmp/pai-voice-${Date.now()}.mp3`;
  await Bun.write(tmp, audioData);

  const result = spawnSync(["paplay", tmp], { stderr: "pipe" });
  if (result.exitCode !== 0) {
    // Fallback players
    for (const cmd of [["mpg123", "-q", tmp], ["ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet", tmp]]) {
      const r = spawnSync(cmd, { stderr: "pipe" });
      if (r.exitCode === 0) break;
    }
  }
  // Cleanup temp file
  spawnSync(["rm", "-f", tmp]);
}

// Queue to avoid overlapping speech
const queue: (() => Promise<void>)[] = [];
let speaking = false;

async function enqueue(fn: () => Promise<void>) {
  queue.push(fn);
  if (!speaking) processQueue();
}

async function processQueue() {
  speaking = true;
  while (queue.length > 0) {
    const fn = queue.shift()!;
    await fn().catch(console.error);
  }
  speaking = false;
}

// HTTP Server
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "POST" && (url.pathname === "/notify" || url.pathname === "/notify/personality")) {
      let body: any = {};
      try { body = await req.json(); } catch {}

      const message: string = body.message ?? body.text ?? "";
      if (!message) return new Response("ok", { status: 200 });

      // Determine voice
      let voiceCfg = DEFAULT_VOICE;

      if (url.pathname === "/notify/personality" && body.voice_settings) {
        // Caller provides full voice_settings
        voiceCfg = { ...DEFAULT_VOICE, ...body.voice_settings };
      } else if (body.voice_id) {
        // If caller specifies a known named voice
        if (body.voice_id === "algorithm" || body.voice_id === ALGORITHM_VOICE.voiceId) {
          voiceCfg = ALGORITHM_VOICE;
        } else if (body.voice_id !== "YOUR_VOICE_ID_HERE") {
          voiceCfg = { ...DEFAULT_VOICE, voiceId: body.voice_id };
        }
        // "YOUR_VOICE_ID_HERE" placeholder → use algorithm voice for phase announcements
        else {
          voiceCfg = ALGORITHM_VOICE;
        }
      }

      const label = body.title ?? "ATOM";
      console.log(`🔊 [${label}] ${message}`);
      enqueue(() => speak(message, voiceCfg));

      return new Response("ok", { status: 200 });
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", port: PORT }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`⚛ ATOM Voice Server running on http://localhost:${PORT}`);
console.log(`   Main voice:      ${DEFAULT_VOICE.voiceId}`);
console.log(`   Algorithm voice: ${ALGORITHM_VOICE.voiceId}`);
console.log(`   Audio player:    paplay (fallback: mpg123/aplay/ffplay)`);
console.log(`   Press Ctrl+C to stop.\n`);
