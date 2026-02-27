#!/usr/bin/env bun
/**
 * CalendarAuth.ts — One-time OAuth flow for Google Calendar read access
 * Saves GOOGLE_OAUTH_REFRESH_TOKEN to ~/.env
 * Run: bun CalendarAuth.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

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
const REDIRECT_URI = env.GOOGLE_OAUTH_REDIRECT_URI ?? "http://localhost:3456";

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar.readonly");
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");
authUrl.searchParams.set("login_hint", "herboko@googlemail.com");

console.log("\n📅 Google Calendar OAuth Flow");
console.log("━".repeat(50));
console.log("📌 Open this URL in your browser and authorize as herboko@gmail.com:\n");
console.log(authUrl.toString());
console.log("\n⏳ Waiting for callback on " + REDIRECT_URI + " ...\n");

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

      if (tokens.error || !tokens.refresh_token) {
        console.error(`❌ Token error: ${tokens.error_description ?? "no refresh_token returned"}`);
        setTimeout(() => process.exit(1), 500);
        return new Response(`<h1>❌ Token Failed</h1>`, { headers: { "Content-Type": "text/html" } });
      }

      console.log("✅ Tokens received!");

      // Replace GOOGLE_OAUTH_REFRESH_TOKEN in ~/.env
      const envPath = join(homedir(), ".env");
      let envContent = readFileSync(envPath, "utf-8");
      if (envContent.includes("GOOGLE_OAUTH_REFRESH_TOKEN=")) {
        envContent = envContent.replace(/GOOGLE_OAUTH_REFRESH_TOKEN=.*/,
          `GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
        writeFileSync(envPath, envContent);
        console.log("✅ Updated GOOGLE_OAUTH_REFRESH_TOKEN in ~/.env");
      } else {
        const line = `\n# Calendar OAuth (herboko@gmail.com — calendar.readonly)\nGOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`;
        writeFileSync(envPath, envContent + line);
        console.log("✅ Added GOOGLE_OAUTH_REFRESH_TOKEN to ~/.env");
      }

      // Quick calendar test
      console.log("\n🧪 Testing Calendar access...");
      const calRes = await fetch(
        "https://www.googleapis.com/calendar/v3/calendarList?maxResults=5",
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );
      const calData = await calRes.json() as { items?: { summary: string }[]; error?: unknown };
      if (calData.items) {
        console.log(`✅ Calendar access works! Calendars: ${calData.items.map(c => c.summary).join(", ")}`);
      } else {
        console.log("⚠️  Calendar test response:", JSON.stringify(calData));
      }

      setTimeout(() => { server.stop(); process.exit(0); }, 1000);
      return new Response(
        `<h1>✅ Calendar Connected!</h1><p>herboko@gmail.com authorized. You can close this tab.</p>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    return new Response("Waiting...", { status: 200 });
  },
});
