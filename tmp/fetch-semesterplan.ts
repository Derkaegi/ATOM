#!/usr/bin/env bun
/**
 * Fetch Vorlesung dates from semester plan Google Sheet
 */
import { readFileSync } from "fs";

// Load env
const envContent = readFileSync(`${process.env.HOME}/.env`, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.+)$/);
  if (match) process.env[match[1]] = match[2].trim();
}

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;
const REFRESH_TOKEN = process.env.GOOGLE_SHEETS_REFRESH_TOKEN!;
const SPREADSHEET_ID = "1ZkQMGeK_PXGwhcKi9IyMBOEFTS8oK1wOzu12KjQv0YA";

// Get access token
const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type: "refresh_token",
  }),
});
const tokenData = await tokenRes.json();
if (!tokenData.access_token) {
  console.error("Token error:", JSON.stringify(tokenData));
  process.exit(1);
}
const accessToken = tokenData.access_token;

// Fetch sheet data
const range = "A:Z";
const sheetRes = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const sheetData = await sheetRes.json();

if (!sheetData.values) {
  console.error("Sheet error:", JSON.stringify(sheetData));
  process.exit(1);
}

const rows: string[][] = sheetData.values;
const headers = rows[0].map((h: string) => h.trim().toLowerCase());

console.error("Headers:", headers);

// Find relevant columns
const dateColIdx = headers.findIndex(
  (h) => h === "datum" || h === "date" || h.includes("datum") || h.includes("date")
);
const statusColIdx = headers.findIndex(
  (h) => h === "status" || h.includes("status")
);

console.error(`Date col: ${dateColIdx}, Status col: ${statusColIdx}`);

if (dateColIdx === -1 || statusColIdx === -1) {
  console.error("Could not find required columns. Headers:", headers);
  // Print all rows to debug
  console.error("First 5 rows:", rows.slice(0, 5));
  process.exit(1);
}

// Filter Vorlesung rows
const vorlesungDates: string[] = [];
for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  const status = row[statusColIdx]?.trim() || "";
  const date = row[dateColIdx]?.trim() || "";
  if (status === "Vorlesung" && date) {
    vorlesungDates.push(date);
  }
}

console.log(JSON.stringify(vorlesungDates));
