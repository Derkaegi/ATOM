#!/usr/bin/env bun
/**
 * Morning Briefing Formatter
 *
 * Takes JSON input from n8n and formats briefing for three channels:
 * - HTML for email
 * - Markdown for Telegram
 * - Plain text for ntfy
 *
 * NO CLAUDE API CALLS - pure template formatting
 */

interface BriefingData {
  date: string;
  weather: {
    temp: string;
    condition: string;
    high: string;
    low: string;
    precipitation?: string;
  };
  calendar: Array<{
    time: string;
    title: string;
    location?: string;
  }>;
  tasks: {
    pending: number;
    inProgress: number;
    urgent: Array<{ id: string; subject: string }>;
  };
  learnings: Array<{
    date: string;
    insight: string;
  }>;
}

function formatEmail(data: BriefingData): string {
  const calendarItems = data.calendar.length > 0
    ? data.calendar
        .map(
          (event) =>
            `<div class="event"><strong>${event.time}</strong> ${event.title}${event.location ? ` <span class="location">(${event.location})</span>` : ""}</div>`
        )
        .join("\n")
    : '<div class="event">No events scheduled</div>';

  const urgentTasks =
    data.tasks.urgent.length > 0
      ? data.tasks.urgent
          .map((task) => `<li>${task.subject}</li>`)
          .join("\n")
      : "<li>No urgent tasks</li>";

  const learningItems =
    data.learnings.length > 0
      ? data.learnings
          .map(
            (learning) =>
              `<div class="learning"><strong>${learning.date}:</strong> ${learning.insight}</div>`
          )
          .join("\n")
      : '<div class="learning">No recent learnings</div>';

  return `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #3B82F6; border-bottom: 3px solid #3B82F6; padding-bottom: 15px; margin-top: 0; }
        h2 { color: #1e40af; margin-top: 30px; margin-bottom: 15px; font-size: 1.3em; }
        .weather { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .weather h2 { color: white; margin-top: 0; }
        .temp { font-size: 2.5em; font-weight: bold; }
        .condition { font-size: 1.2em; opacity: 0.9; }
        .event { padding: 12px; margin: 8px 0; background: #f0f9ff; border-left: 4px solid #3B82F6; border-radius: 4px; }
        .event strong { color: #1e40af; }
        .location { color: #6b7280; font-size: 0.9em; }
        .task-summary { display: flex; gap: 20px; margin: 15px 0; }
        .task-count { background: #f0fdf4; padding: 15px; border-radius: 8px; flex: 1; border-left: 4px solid #22c55e; }
        .task-count.urgent { background: #fef2f2; border-left-color: #ef4444; }
        .task-count .number { font-size: 2em; font-weight: bold; color: #1e40af; }
        .task-count .label { color: #6b7280; font-size: 0.9em; }
        .learning { padding: 12px; margin: 8px 0; background: #fefce8; border-left: 4px solid #eab308; border-radius: 4px; }
        .learning strong { color: #92400e; }
        ul { list-style: none; padding-left: 0; }
        li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        li:last-child { border-bottom: none; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 0.9em; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>☀️ Good Morning, Herbert</h1>
        <p><strong>${data.date}</strong></p>

        <div class="weather">
            <h2>🌤️ Barcelona Weather</h2>
            <div class="temp">${data.weather.temp}</div>
            <div class="condition">${data.weather.condition}</div>
            <p>High: ${data.weather.high} | Low: ${data.weather.low}${data.weather.precipitation ? ` | ${data.weather.precipitation}` : ""}</p>
        </div>

        <h2>📅 Today's Schedule</h2>
        ${calendarItems}

        <h2>✅ Tasks Overview</h2>
        <div class="task-summary">
            <div class="task-count">
                <div class="number">${data.tasks.pending}</div>
                <div class="label">Pending</div>
            </div>
            <div class="task-count">
                <div class="number">${data.tasks.inProgress}</div>
                <div class="label">In Progress</div>
            </div>
        </div>

        <h3>🔥 Urgent Tasks</h3>
        <ul>
            ${urgentTasks}
        </ul>

        <h2>💡 Recent Learnings</h2>
        ${learningItems}

        <div class="footer">
            <p><strong>ATOM</strong> | PAI v3.0 | Algorithm v1.2.0</p>
            <p>Have a productive day!</p>
        </div>
    </div>
</body>
</html>`;
}

function formatTelegram(data: BriefingData): string {
  const calendarItems =
    data.calendar.length > 0
      ? data.calendar
          .map(
            (event) =>
              `• <b>${event.time}</b> ${event.title}${event.location ? ` <i>(${event.location})</i>` : ""}`
          )
          .join("\n")
      : "• No events scheduled";

  const urgentTasks =
    data.tasks.urgent.length > 0
      ? data.tasks.urgent.map((task) => `• ${task.subject}`).join("\n")
      : "• No urgent tasks";

  const learningItems =
    data.learnings.length > 0
      ? data.learnings
          .map((learning) => `• <b>${learning.date}:</b> ${learning.insight}`)
          .join("\n")
      : "• No recent learnings";

  return `☀️ <b>Good Morning, Herbert</b>

📅 <b>${data.date}</b>

🌤️ <b>Barcelona Weather</b>
${data.weather.temp} - ${data.weather.condition}
High: ${data.weather.high} | Low: ${data.weather.low}${data.weather.precipitation ? ` | ${data.weather.precipitation}` : ""}

📅 <b>Today's Schedule</b>
${calendarItems}

✅ <b>Tasks Overview</b>
${data.tasks.pending} pending | ${data.tasks.inProgress} in progress

🔥 <b>Urgent Tasks</b>
${urgentTasks}

💡 <b>Recent Learnings</b>
${learningItems}

──────────────
<b>ATOM</b> | Have a productive day!`;
}

function formatNtfy(data: BriefingData): string {
  const calendarSummary =
    data.calendar.length > 0
      ? `${data.calendar.length} events today`
      : "No events scheduled";

  const urgentSummary =
    data.tasks.urgent.length > 0
      ? `${data.tasks.urgent.length} urgent tasks`
      : "No urgent tasks";

  return `Good Morning! ${data.date}

Weather: ${data.weather.temp} ${data.weather.condition}

Schedule: ${calendarSummary}
Tasks: ${data.tasks.pending} pending, ${data.tasks.inProgress} in progress
${urgentSummary}

Have a productive day!`;
}

// Main execution
async function main() {
  // Read JSON from stdin
  const input = await Bun.stdin.text();
  const data: BriefingData = JSON.parse(input);

  // Format for all channels
  const output = {
    email: {
      subject: `Good Morning Herbert - ${data.date}`,
      html: formatEmail(data),
    },
    telegram: {
      text: formatTelegram(data),
      parse_mode: "HTML",
    },
    ntfy: {
      title: "Good Morning!",
      message: formatNtfy(data),
      priority: "default",
      tags: "sunny,coffee",
    },
  };

  // Output JSON for n8n to consume
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error("Error formatting briefing:", error);
  process.exit(1);
});
