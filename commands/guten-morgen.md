#!/usr/bin/env bun

/**
 * Guten Morgen - Enhanced Morning Routine
 *
 * Based on Herbert's daily workflow with Fabric integration
 * Generates comprehensive morning briefing and saves to Obsidian
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';

// Load environment variables from .env file
const envPath = path.join(process.cwd(), '.env');
if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
}

interface MorningBriefingConfig {
    fabricPath: string;
    obsidianPath: string;
    projectRoot: string;
}

interface TutorialContent {
  title: string;
  description: string;
  practicalGuide: string[];
  quickWins: string[];
  tomorrowPreview: string;
  keyLearning: string;
  actionItems: string[];
  systemChanges: string[];
}

const CONFIG: MorningBriefingConfig = {
    fabricPath: 'C:\\Users\\herbo\\Documents\\GitHub\\Fabric',
    obsidianPath: 'C:\\Users\\herbo\\Documents\\Obsidian Vault\\05-JOURNAL\\Daily-Notes',
    projectRoot: 'C:\\Users\\herbo\\Documents\\GitHub\\PAI'
};

/**
 * Main morning routine execution
 */
export async function runMorningRoutine(): Promise<void> {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' });

    console.log(`🌅 Starting Morning Routine for ${dayName}, ${dateStr}`);
    console.log(`📍 Barcelona time: ${timeStr}`);

    try {
        // Step 1: Navigate to base directory
        process.chdir(CONFIG.projectRoot);
        console.log(`📂 Navigated to: ${CONFIG.projectRoot}`);

        // Step 2: Check Fabric availability
        const fabricAvailable = await checkFabricSetup();

        // Step 3: Check calendar for today's schedule
        const calendarData = await checkTodaysCalendar(dateStr);

        // Step 4: Generate streamlined briefing
        const briefingContent = await generateStreamlinedBriefing(dayName, dateStr, timeStr, {
            fabricAvailable,
            calendarData
        });

        // Step 5: Save to Obsidian
        await saveBriefingToObsidian(briefingContent, dateStr);

        // Step 6: Check Herbert patterns
        if (fabricAvailable) {
            await checkHerbertPatterns();
        }

        console.log('✅ Morning routine completed successfully!');

    } catch (error) {
        console.error('❌ Morning routine failed:', error);
        // Fallback to basic greeting
        const fallbackContent = generateFallbackBriefing(dayName, dateStr, timeStr);
        await saveBriefingToObsidian(fallbackContent, dateStr);
        console.log('🌅 Good morning! Fallback routine completed.');
    }
}

/**
 * Check if Fabric is properly set up
 */
async function checkFabricSetup(): Promise<boolean> {
    try {
        process.chdir(CONFIG.fabricPath);

        // Test if fabric executable exists and works
        const result = execSync(`"${CONFIG.fabricPath}\\fabric.exe" --listpatterns`, {
            encoding: 'utf8',
            timeout: 5000,
            stdio: 'pipe'
        });

        console.log('✅ Fabric is available');
        return true;

    } catch (error) {
        console.log('⚠️  Fabric setup issue:', error.message);
        return false;
    }
}

/**
 * Check today's calendar for all events
 */
async function checkTodaysCalendar(dateStr: string): Promise<any> {
    console.log('📅 Checking today\'s calendar...');

    try {
        // Load env variables
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost';
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

        if (!clientId || !clientSecret) {
            console.log('⚠️  Google credentials not in .env');
            return getEmptyCalendarData();
        }

        // Try to load Google Calendar API
        const { google } = await import('googleapis');

        // Set up OAuth client
        const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        // Check if we have a refresh token
        if (!refreshToken) {
            console.log('⚠️  No GOOGLE_REFRESH_TOKEN in .env');
            console.log('🔑 Run OAuth flow first to get refresh token');
            console.log('    Use: bun .claude/commands/google-auth-setup.ts');
            return getEmptyCalendarData();
        }

        // Set credentials with refresh token
        oAuth2Client.setCredentials({ refresh_token: refreshToken });

        // Get today's events
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
        const today = new Date(dateStr);
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 20,
        });

        const events = response.data.items || [];
        const learningEvents = events.filter(event => event.summary?.includes('Learning Session'));
        const meetings = events.filter(event => !event.summary?.includes('Learning Session'));

        console.log(`📅 Found ${events.length} calendar events for today`);
        console.log(`🎓 Learning sessions: ${learningEvents.length}`);
        console.log(`💼 Other meetings: ${meetings.length}`);

        return {
            hasEvents: events.length > 0,
            events: events,
            learningSession: learningEvents.length > 0 ? learningEvents[0] : null,
            meetings: meetings,
            blockedTime: events.map(event => ({
                start: event.start?.dateTime || event.start?.date,
                end: event.end?.dateTime || event.end?.date,
                title: event.summary
            })),
            freeSlots: calculateFreeSlots(events)
        };

    } catch (error: any) {
        console.warn('⚠️  Could not fetch calendar data:', error.message);

        // Check for expired/revoked token
        if (error.message?.includes('invalid_grant') || error.response?.data?.error === 'invalid_grant') {
            console.log('🔑 Your Google refresh token has expired or been revoked.');
            console.log('   Run: bun .claude/commands/google-calendar-reauth.md');
        }

        return getEmptyCalendarData();
    }
}

function getEmptyCalendarData() {
    return {
        hasEvents: false,
        events: [],
        learningSession: null,
        meetings: [],
        blockedTime: [],
        freeSlots: []
    };
}

function calculateFreeSlots(events: any[]): string[] {
    // Simple free slot calculation
    const workingHours = ['09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00', '20:00-21:00'];
    // TODO: Implement proper free slot calculation based on actual events
    return workingHours.filter((_, index) => index < 3); // Return first 3 as available
}


/**
 * Get tutorial day number
 */
function getTutorialDay(): number {
  const startDate = new Date('2025-09-01');
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return (diffDays % 30) + 1;
}

/**
 * Get tutorial content based on day
 */
function getTutorialContent(day: number): TutorialContent {
  const tutorials = [
    {
      title: "Content Research and Automation Workflows",
      description: "Today we're diving into PokerStories research automation - perfect for your narrative-driven content strategy. We'll focus on creating systematic research and writing workflows that leverage your PAI hooks and Fabric patterns.",
      practicalGuide: [
        "Navigate to research folder: `C:\\Users\\herbo\\Documents\\GitHub\\PokerStories\\research\\`",
        "Initialize new research pipeline: `pai-hook load poker-narrative-workflow`",
        "Configure Fabric pattern: `fabric-pattern create content-research-template`"
      ],
      quickWins: [
        "Map 5 potential poker industry narrative themes",
        "Create initial Fabric pattern for story structure extraction",
        "Document potential AI-assisted storytelling techniques"
      ],
      tomorrowPreview: "We'll expand on content generation techniques, focusing on Griffl.org's educational content strategies.",
      keyLearning: "Systematic research automation",
      actionItems: ["Configure PAI research hooks", "Design Fabric content templates", "Document workflow steps"],
      systemChanges: ["New research pipeline", "Enhanced content generation capabilities"]
    },
    {
      title: "AI Education Content Strategy",
      description: "Focusing on Griffl.org content optimization and educational workflow automation. We'll build systematic approaches to transform complex AI concepts into accessible educational content.",
      practicalGuide: [
        "Navigate to Griffl content folder: `C:\\Users\\herbo\\Documents\\GitHub\\Griffl.org\\content\\`",
        "Initialize content pipeline: `kai content-pipeline --project griffl`",
        "Set up SEO automation: `fabric --pattern griffl_seo_optimizer`"
      ],
      quickWins: [
        "Review and publish 2 LinkedIn posts from editorial calendar",
        "Optimize SEO metadata for 3 pending articles",
        "Create automated content distribution workflow"
      ],
      tomorrowPreview: "We'll focus on SetpieceTakers data automation and football analytics workflows.",
      keyLearning: "Educational content systematization",
      actionItems: ["Publish editorial calendar content", "Automate SEO workflows", "Optimize content distribution"],
      systemChanges: ["Griffl content pipeline", "SEO automation system"]
    },
    {
      title: "Data Analytics and Football Content Automation",
      description: "SetpieceTakers workflow optimization - we'll focus on automating football data collection, analysis, and content generation for your analytics platform.",
      practicalGuide: [
        "Navigate to analytics folder: `C:\\Users\\herbo\\Documents\\GitHub\\Setpiecetakers\\analytics\\`",
        "Initialize data pipeline: `kai data-pipeline --sport football`",
        "Configure automated reports: `fabric --pattern football_analytics`"
      ],
      quickWins: [
        "Set up automated Eredivisie data collection",
        "Create player performance summary templates",
        "Implement GDPR-compliant data processing"
      ],
      tomorrowPreview: "We'll integrate university teaching preparation with AI-assisted curriculum development.",
      keyLearning: "Sports data automation",
      actionItems: ["Configure data collection", "Create reporting templates", "Ensure GDPR compliance"],
      systemChanges: ["Football data pipeline", "Automated analytics system"]
    }
  ];

  return tutorials[(day - 1) % tutorials.length];
}

/**
 * Generate streamlined morning briefing without Notion integration
 */
async function generateStreamlinedBriefing(dayName: string, dateStr: string, timeStr: string, data: {
    fabricAvailable: boolean;
    calendarData: any;
}): Promise<string> {
    const tutorialDay = getTutorialDay();
    const tutorial = getTutorialContent(tutorialDay);

    let fabricBriefing = '';
    let grifflBriefing = '';

    if (data.fabricAvailable) {
        fabricBriefing = await generateFabricBriefing(dayName, dateStr, timeStr, data.calendarData);
    }

    // Generate Griffl content briefing
    try {
        const { generateGrifflBriefing } = await import('../hooks/griffl-morning-briefing.ts');
        grifflBriefing = await generateGrifflBriefing();
    } catch (error) {
        console.warn('⚠️ Could not generate Griffl briefing:', error.message);
    }

    return formatStreamlinedBriefingContent(dayName, dateStr, timeStr, {
        tutorial,
        tutorialDay,
        fabricBriefing,
        grifflBriefing,
        calendarData: data.calendarData
    });
}

/**
 * Generate Fabric briefing (original function)
 */
async function generateFabricBriefing(dayName: string, dateStr: string, timeStr: string, calendarData: any): Promise<string> {
    try {
        process.chdir(CONFIG.fabricPath);

        // First, check available patterns
        const patterns = execSync(`"${CONFIG.fabricPath}\\fabric.exe" --listpatterns`, { encoding: 'utf8' });

        let briefingContent: string;

        if (patterns.includes('herbert_morning_briefing')) {
            // Use Herbert-specific pattern with calendar integration
            const calendarSummary = calendarData.hasEvents ?
                `Today's schedule: ${calendarData.events.length} events scheduled. ` +
                `Free slots available: ${calendarData.freeSlots.join(', ')}. ` +
                `${calendarData.learningSession ? 'Learning session scheduled. ' : 'No learning session - consider scheduling one. '}` :
                'No calendar events scheduled - open day for focused work. ';

            const prompt = `Daily briefing for Herbert - ${dayName}, ${dateStr} at ${timeStr} Barcelona time. ` +
                          `Working on PAI (Personal AI Infrastructure), Telos goal management, and PokerStories writing. ` +
                          `Focus on productivity and AI system optimization. ` +
                          `${calendarSummary}` +
                          `Include calendar awareness and suggest optimal time usage.`;

            briefingContent = execSync(`echo "${prompt}" | "${CONFIG.fabricPath}\\fabric.exe" --pattern herbert_morning_briefing`, {
                encoding: 'utf8',
                stdio: 'pipe'
            });

        } else {
            // Fallback to general briefing patterns
            const availablePatterns = ['summarize', 'analyze', 'create_summary'];
            const pattern = availablePatterns.find(p => patterns.includes(p)) || 'summarize';

            const prompt = `Generate a morning briefing for Herbert on ${dayName}, ${dateStr}. ` +
                          `Key projects: PAI system development, Telos goal management, PokerStories writing. ` +
                          `Focus areas: AI productivity, system optimization, content creation.`;

            briefingContent = execSync(`echo "${prompt}" | "${CONFIG.fabricPath}\\fabric.exe" --pattern ${pattern}`, {
                encoding: 'utf8',
                stdio: 'pipe'
            });
        }

        return briefingContent;

    } catch (error) {
        console.error('Error generating Fabric briefing:', error);
        return generateFallbackBriefing(dayName, dateStr, timeStr);
    }
}

/**
 * Format streamlined briefing content without Notion integration
 */
function formatStreamlinedBriefingContent(dayName: string, dateStr: string, timeStr: string, data: {
    tutorial: TutorialContent;
    tutorialDay: number;
    fabricBriefing: string;
    grifflBriefing: string;
    calendarData: any;
}): string {
    const staticPriorities = generateStaticPriorities();

    return `# 🌅 GOOD MORNING, HERBERT!

Happy ${dayName}, ${dateStr}! Barcelona time: ${timeStr}

📚 KAI TUTORIAL DAY ${data.tutorialDay}: ${data.tutorial.title}

${data.tutorial.description}

📁 PRACTICAL STARTUP GUIDE
${data.tutorial.practicalGuide.map((item, index) => `${index + 1}. ${item}`).join('\n')}

🎯 TODAY'S FOCUS ALIGNMENT
${staticPriorities.map(priority => `- ${priority}`).join('\n')}

⚡ QUICK WINS FOR TODAY
${data.tutorial.quickWins.map(win => `- ${win}`).join('\n')}

🚀 TOMORROW'S PREVIEW
${data.tutorial.tomorrowPreview}

## KNOWLEDGE CAPTURE
- **Key Learning:** ${data.tutorial.keyLearning}
- **Action Items:**
${data.tutorial.actionItems.map(item => `  * ${item}`).join('\n')}
- **System Changes:**
${data.tutorial.systemChanges.map(change => `  * ${change}`).join('\n')}

${formatCalendarData(data.calendarData)}

${data.grifflBriefing ? data.grifflBriefing : ''}

---
*Generated by PAI Morning Routine*
*${new Date().toISOString()}*
`;
}

/**
 * Generate static focus priorities for streamlined routine
 */
function generateStaticPriorities(): string[] {
  return [
    "Advance systematic workflow automation across all projects",
    "Optimize content creation and distribution processes",
    "Strengthen AI-education integration strategies",
    "Review and prioritize active tasks in Notion workspace"
  ];
}


/**
 * Format calendar data
 */
function formatCalendarData(calendarData: any): string {
  if (!calendarData.hasEvents) {
    return "📅 **TODAY'S CALENDAR**\n\nNo events scheduled - open day for focused work.\n\n";
  }

  let output = "📅 **TODAY'S CALENDAR**\n\n";
  output += `Events: ${calendarData.events.length}\n`;

  if (calendarData.freeSlots.length > 0) {
    output += `Free slots: ${calendarData.freeSlots.join(', ')}\n`;
  }

  if (calendarData.learningSession) {
    output += `Learning session scheduled\n`;
  }

  return output + "\n";
}

/**
 * Format briefing content with proper structure (legacy function for fallback)
 */
function formatBriefingContent(content: string, dayName: string, dateStr: string, timeStr: string): string {
    return `# 🌅 Morning Briefing - ${dayName}, ${dateStr}

**Generated:** ${timeStr} Barcelona Time
**System:** PAI Enhanced Morning Routine
**Focus:** Productivity & AI System Optimization

---

## 📋 AI-Generated Briefing

${content}

---

## 🎯 Today's Focus Areas

### PAI (Personal AI Infrastructure)
- System optimization and context management
- UFC architecture maintenance
- Command development and testing

### Telos Goal Management
- Personal goal alignment and tracking
- Priority assessment and planning
- Progress review and adjustments

### PokerStories Writing
- Content creation and collaboration
- Research and documentation
- Partnership coordination

---

## ⚡ Quick Actions
- [ ] Review Notion workspace updates
- [ ] Check project priorities in Telos
- [ ] Update PAI system context if needed
- [ ] Plan content creation pipeline

---

*Generated by Enhanced Morning Routine System*
*Location: ${CONFIG.projectRoot}*
`;
}

/**
 * Generate fallback briefing when Fabric isn't available
 */
function generateFallbackBriefing(dayName: string, dateStr: string, timeStr: string): string {
    return formatBriefingContent(
        `Good morning! Today is ${dayName}, ${dateStr}. Your PAI system is ready and optimized for productivity. ` +
        `Key focus areas include system development, goal management, and content creation. ` +
        `Remember to check your Notion workspace and align with your Telos framework priorities.`,
        dayName, dateStr, timeStr
    );
}

/**
 * Save briefing to Obsidian daily notes
 */
async function saveBriefingToObsidian(content: string, dateStr: string): Promise<void> {
    try {
        // Ensure directory exists
        if (!existsSync(CONFIG.obsidianPath)) {
            mkdirSync(CONFIG.obsidianPath, { recursive: true });
        }

        const filename = `Daily-Briefing-${dateStr}.md`;
        const filepath = path.join(CONFIG.obsidianPath, filename);

        writeFileSync(filepath, content, 'utf8');
        console.log(`📝 Briefing saved to: ${filepath}`);

    } catch (error) {
        console.error('Error saving to Obsidian:', error);
        // Fallback: save to PAI directory
        const fallbackPath = path.join(CONFIG.projectRoot, '.claude', 'temp', `morning-briefing-${dateStr}.md`);
        writeFileSync(fallbackPath, content, 'utf8');
        console.log(`📝 Briefing saved to fallback location: ${fallbackPath}`);
    }
}

/**
 * Check for Herbert-specific Fabric patterns
 */
async function checkHerbertPatterns(): Promise<void> {
    try {
        process.chdir(CONFIG.fabricPath);
        const patterns = execSync(`"${CONFIG.fabricPath}\\fabric.exe" --listpatterns | findstr /i Herbert`, {
            encoding: 'utf8',
            stdio: 'pipe'
        });

        if (patterns.trim()) {
            console.log('🎯 Herbert-specific patterns available:');
            console.log(patterns);
        } else {
            console.log('ℹ️  No Herbert-specific patterns found');
        }

    } catch (error) {
        console.log('ℹ️  Could not check Herbert patterns');
    }
}

/**
 * Simplified routine when Fabric is not available
 */
async function runSimplifiedRoutine(dayName: string, dateStr: string, timeStr: string): Promise<void> {
    const briefingContent = generateFallbackBriefing(dayName, dateStr, timeStr);
    await saveBriefingToObsidian(briefingContent, dateStr);
    console.log('✅ Simplified morning routine completed');
}

// Execute if run directly
if (import.meta.main) {
    await runMorningRoutine();
}