#!/usr/bin/env bun
/**
 * GmailAuth.ts — One-time OAuth flow for Gmail read access
 * Saves GOOGLE_GMAIL_REFRESH_TOKEN to ~/.env
 * Run: bun GmailAuth.ts
 */

import { readFileSync, appendFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// Load env
function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    for (const line of readFileSync(join(homedir(), ".env"), "utf-8").split("\n")) {
      const t = line.trim();
      if (t && !t.startsWith("#") && t.includes("=")) {
        const eq = t.indexOf("=");
        env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
      }
    }
  } catch {}
  return env;
}

const env = loadEnv();
const CLIENT_ID = env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3456"; // same port registered in Google Cloud Console
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
];

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPES.join(" "));
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");
authUrl.searchParams.set("login_hint", "herboko@googlemail.com");

console.log("\n📧 Gmail OAuth Flow");
console.log("━".repeat(50));
console.log("📌 Opening browser — authorize as herboko@gmail.com ...\n");

Bun.spawn(["xdg-open", authUrl.toString()]);

console.log("⏳ Waiting for callback on http://localhost:3456 ...\n");

const server = Bun.serve({
  port: 3456,
  async fetch(req) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      console.error(`❌ Auth error: ${error}`);
      setTimeout(() => process.exit(1), 500);
      return new Response(`<h1>❌ Failed: ${error}</h1>`, { headers: { "Content-Type": "text/html" } });
    }

    if (code) {
      console.log("✅ Auth code received — exchanging for tokens...");

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenRes.json() as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        error?: string;
        error_description?: string;
      };

      if (tokens.error) {
        console.error(`❌ Token error: ${tokens.error_description}`);
        setTimeout(() => process.exit(1), 500);
        return new Response(`<h1>❌ Token Failed</h1>`, { headers: { "Content-Type": "text/html" } });
      }

      console.log("✅ Tokens received!");

      // Save refresh token to ~/.env
      const envLine = `\n# Gmail OAuth (herboko@gmail.com — read access)\nGOOGLE_GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`;
      appendFileSync(join(homedir(), ".env"), envLine);
      console.log("✅ Saved GOOGLE_GMAIL_REFRESH_TOKEN to ~/.env");

      // Quick inbox test
      console.log("\n🧪 Testing Gmail access...");
      const gmailRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=3&q=is:unread",
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );
      const gmailData = await gmailRes.json() as { messages?: { id: string }[]; resultSizeEstimate?: number };
      const count = gmailData.resultSizeEstimate ?? 0;
      console.log(`✅ Gmail access works! ~${count} unread messages in inbox.`);

      setTimeout(() => { server.stop(); process.exit(0); }, 1000);
      return new Response(
        `<h1>✅ Gmail Connected!</h1><p>herboko@gmail.com authorized. You can close this tab.</p>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    return new Response("Waiting...", { status: 200 });
  },
});
