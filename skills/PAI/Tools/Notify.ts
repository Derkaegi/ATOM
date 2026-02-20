#!/usr/bin/env bun
/**
 * Notify.ts — Send to all PAI notification channels
 *
 * Usage:
 *   bun Notify.ts --title "Title" --message "Body"
 *   bun Notify.ts --title "Title" -m "Body"
 *   echo "Body" | bun Notify.ts --title "Title"
 *
 * Channels: Email (Gmail SMTP) + ntfy + Telegram
 * Credentials: auto-loaded from ~/.env
 */

import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { homedir, tmpdir } from "os";
import { join } from "path";
import { spawnSync } from "child_process";

// ─── Load ~/.env ────────────────────────────────────────────────────────────
function loadEnv(): Record<string, string> {
  try {
    const content = readFileSync(join(homedir(), ".env"), "utf-8");
    const env: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const eqIdx = trimmed.indexOf("=");
        env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
      }
    }
    return env;
  } catch {
    return {};
  }
}

// ─── Parse args ─────────────────────────────────────────────────────────────
const args = Bun.argv.slice(2);
let title = "PAI Notification";
let message = "";

for (let i = 0; i < args.length; i++) {
  if ((args[i] === "--title" || args[i] === "-t") && args[i + 1]) {
    title = args[++i];
  } else if ((args[i] === "--message" || args[i] === "-m") && args[i + 1]) {
    message = args[++i];
  }
}

// Fallback: read from stdin if piped
if (!message) {
  try {
    const stdin = readFileSync("/dev/stdin", "utf-8").trim();
    if (stdin) message = stdin;
  } catch {}
}

if (!message) {
  console.error("❌ Usage: bun Notify.ts --title \"Title\" --message \"Body\"");
  process.exit(1);
}

const env = loadEnv();

// ─── Email via Gmail SMTP (Python subprocess — no deps needed) ───────────────
async function sendEmail(): Promise<string> {
  const tmpFile = join(tmpdir(), `pai-notify-${Date.now()}.py`);
  const pyScript = `
import smtplib, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

subject = os.environ['SUBJECT']
body    = os.environ['BODY']
frm     = os.environ['GMAIL_USER']
to      = os.environ['GMAIL_RECIPIENT']
pwd     = os.environ['GMAIL_APP_PASSWORD']

msg = MIMEMultipart()
msg['From'] = frm
msg['To']   = to
msg['Subject'] = subject
msg.attach(MIMEText(body, 'plain'))

with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
    server.login(frm, pwd)
    server.sendmail(frm, to, msg.as_string())
print('sent')
`;
  writeFileSync(tmpFile, pyScript);
  const result = spawnSync("python3", [tmpFile], {
    encoding: "utf-8",
    env: {
      ...process.env,
      SUBJECT: title,
      BODY: message,
      GMAIL_USER: env.GMAIL_USER ?? "",
      GMAIL_APP_PASSWORD: env.GMAIL_APP_PASSWORD ?? "",
      GMAIL_RECIPIENT: env.GMAIL_RECIPIENT ?? "",
    },
  });
  try { unlinkSync(tmpFile); } catch {}
  if (result.status === 0) return `✅ Email → ${env.GMAIL_RECIPIENT}`;
  return `❌ Email failed: ${result.stderr?.trim()}`;
}

// ─── ntfy push notification ──────────────────────────────────────────────────
async function sendNtfy(): Promise<string> {
  try {
    // ntfy Title header only accepts ASCII — strip/replace non-ASCII chars
    const ntfyTitle = title.replace(/[^\x00-\x7F]/g, (c) => {
      const map: Record<string, string> = { "—": "-", "–": "-", "…": "...", "'": "'", "'": "'", '"': '"', '"': '"' };
      return map[c] ?? "";
    });
    const res = await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
      method: "POST",
      headers: {
        Title: ntfyTitle,
        Priority: "default",
        Tags: "bell",
      },
      body: message,
    });
    const data = (await res.json()) as { id?: string };
    return `✅ ntfy → ${env.NTFY_TOPIC} (id: ${data.id})`;
  } catch (e) {
    return `❌ ntfy failed: ${e}`;
  }
}

// ─── Telegram ────────────────────────────────────────────────────────────────
async function sendTelegram(): Promise<string> {
  try {
    const text = `*${title}*\n\n${message}`;
    const res = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: "Markdown",
        }),
      }
    );
    const data = (await res.json()) as { ok: boolean; result?: { message_id: number } };
    if (data.ok) return `✅ Telegram (msg_id: ${data.result?.message_id})`;
    return `❌ Telegram failed: ${JSON.stringify(data)}`;
  } catch (e) {
    return `❌ Telegram failed: ${e}`;
  }
}

// ─── Execute all in parallel ─────────────────────────────────────────────────
console.log(`📤 Sending: "${title}"`);

const [emailResult, ntfyResult, telegramResult] = await Promise.all([
  sendEmail(),
  sendNtfy(),
  sendTelegram(),
]);

console.log(emailResult);
console.log(ntfyResult);
console.log(telegramResult);
