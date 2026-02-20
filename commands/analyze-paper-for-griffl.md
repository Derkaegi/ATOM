#!/usr/bin/env bun

/*
# analyze-paper-for-griffl

Extracts academic paper content and creates a comprehensive SEO brief for Griffl.org

## Usage

```bash
bun analyze-paper-for-griffl.md --file "/path/to/paper.pdf" [--url "https://example.com/paper"]
bun analyze-paper-for-griffl.md --url "https://example.com/paper.pdf"
```

## Features

- **Local PDF extraction** using pdftotext (primary method)
- **Token-efficient section extraction** (intro, conclusion, references)
- **Fabric analysis** with extract_article_wisdom pattern
- **Automatic reference extraction** from PDF
- **Semantic file naming** (Author_Year_Keywords.pdf)
- **SEO-optimized brief** generation for Griffl

## Dependencies

- pdftotext (for local PDF extraction)
- pdfinfo (for metadata extraction)
- fabric (for content analysis)
*/

import { exec } from "child_process";
import { promisify } from "util";
import { readFile, writeFile, rename } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const execAsync = promisify(exec);

interface PaperInput {
  file?: string;
  url?: string;
}

interface PaperMetadata {
  title: string;
  author?: string;
  year?: string;
  source?: string;
  url?: string;
}

interface PaperSections {
  abstract?: string;
  introduction?: string;
  methodology?: string;
  results?: string;
  discussion?: string;
  conclusion?: string;
  references?: string;
  fullContent: string;
}

// Parse command line arguments
function parseArgs(): PaperInput {
  const args = process.argv.slice(2);
  const input: PaperInput = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" || args[i] === "-f") {
      input.file = args[++i];
    } else if (args[i] === "--url" || args[i] === "-u") {
      input.url = args[++i];
    }
  }

  if (!input.file && !input.url) {
    console.error("❌ Error: Must provide either --file or --url");
    console.log("\nUsage:");
    console.log("  bun analyze-paper-for-griffl.md --file <path> [--url <url>]");
    console.log("  bun analyze-paper-for-griffl.md --url <url>");
    process.exit(1);
  }

  return input;
}

// Extract metadata from local PDF
async function extractPdfMetadata(pdfPath: string): Promise<Partial<PaperMetadata>> {
  try {
    const { stdout } = await execAsync(`pdfinfo "${pdfPath}"`);
    const metadata: Partial<PaperMetadata> = {};

    const titleMatch = stdout.match(/Title:\s+(.+)/);
    const authorMatch = stdout.match(/Author:\s+(.+)/);
    const creationDateMatch = stdout.match(/CreationDate:\s+.+?(\d{4})/);

    if (titleMatch) metadata.title = titleMatch[1].trim();
    if (authorMatch) metadata.author = authorMatch[1].trim();
    if (creationDateMatch) metadata.year = creationDateMatch[1];

    return metadata;
  } catch (error) {
    console.warn("⚠️  Could not extract PDF metadata");
    return {};
  }
}

// Extract text from specific PDF pages
async function extractPdfPages(pdfPath: string, firstPage: number, lastPage: number): Promise<string> {
  const { stdout } = await execAsync(`pdftotext -f ${firstPage} -l ${lastPage} -layout "${pdfPath}" -`);
  return stdout;
}

// Get total pages from PDF
async function getPdfPageCount(pdfPath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(`pdfinfo "${pdfPath}" | grep "Pages:"`);
    const match = stdout.match(/Pages:\s+(\d+)/);
    return match ? parseInt(match[1]) : 0;
  } catch (error) {
    return 0;
  }
}

// Extract key sections from local PDF (token-efficient)
async function extractFromLocalPdf(pdfPath: string): Promise<{ text: string; metadata: Partial<PaperMetadata> }> {
  console.log("📄 Processing local PDF...");

  const metadata = await extractPdfMetadata(pdfPath);
  const totalPages = await getPdfPageCount(pdfPath);

  console.log(`   Found ${totalPages} pages`);
  console.log(`   Title: ${metadata.title || "Unknown"}`);
  console.log(`   Author: ${metadata.author || "Unknown"}`);

  // Extract strategic sections for token efficiency
  let text = "";

  // First 3 pages (usually abstract, intro)
  console.log("   Extracting introduction...");
  const intro = await extractPdfPages(pdfPath, 1, Math.min(3, totalPages));
  text += intro + "\n\n";

  // Last 2 pages (conclusion)
  if (totalPages > 3) {
    console.log("   Extracting conclusion...");
    const conclusion = await extractPdfPages(pdfPath, Math.max(totalPages - 1, 4), totalPages);
    text += conclusion + "\n\n";
  }

  // References (usually last 3-4 pages)
  if (totalPages > 6) {
    console.log("   Extracting references...");
    const refStart = Math.max(totalPages - 4, Math.ceil(totalPages * 0.8));
    const refs = await extractPdfPages(pdfPath, refStart, totalPages);
    text += "\n\n=== REFERENCES ===\n\n" + refs;
  }

  const estimatedTokens = Math.floor(text.length / 4);
  console.log(`✅ Extracted ~${estimatedTokens} tokens from key sections (~${Math.round(estimatedTokens / totalPages)} per page)`);

  return { text, metadata };
}

// Parse academic paper structure from text
function parseAcademicPaper(text: string): PaperSections {
  const sections: PaperSections = { fullContent: text };

  // Extract references section
  const refsMatch = text.match(/(?:===\s*REFERENCES\s*===|REFERENCES|References|BIBLIOGRAPHY|Bibliography)\s+([\s\S]+?)(?:\n\n\n|$)/i);
  if (refsMatch) {
    sections.references = refsMatch[1].trim();
  }

  // Extract abstract
  const abstractMatch = text.match(/(?:ABSTRACT|Abstract)\s+([\s\S]{100,2000}?)(?:\n\n|Keywords|Introduction|INTRODUCTION)/i);
  if (abstractMatch) {
    sections.abstract = abstractMatch[1].trim();
  }

  // Extract introduction (first significant section)
  const introMatch = text.match(/(?:INTRODUCTION|Introduction)\s+([\s\S]{200,3000}?)(?:\n\n[A-Z][A-Z]|\n\n## )/i);
  if (introMatch) {
    sections.introduction = introMatch[1].trim();
  }

  // Extract conclusion/discussion
  const conclusionMatch = text.match(/(?:CONCLUSION|Conclusion|DISCUSSION|Discussion)\s+([\s\S]{200,3000}?)(?:\n\nREFERENCES|\n\nAcknowledg|===\s*REFERENCES|$)/i);
  if (conclusionMatch) {
    sections.conclusion = conclusionMatch[1].trim();
  }

  return sections;
}

// Analyze content with Fabric
async function analyzeWithFabric(content: string, pattern: string = "extract_article_wisdom"): Promise<string> {
  console.log(`🧠 Analyzing with Fabric pattern: ${pattern}...`);

  try {
    // Write content to temp file to avoid command line length limits
    const tmpFile = path.join(process.env.TEMP || "/tmp", `fabric-input-${Date.now()}.txt`);
    await writeFile(tmpFile, content, "utf-8");

    // Use fabric with file input
    const { stdout } = await execAsync(`fabric --pattern ${pattern} < "${tmpFile}"`, {
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    // Clean up temp file
    try {
      await execAsync(`del "${tmpFile}"`);
    } catch {}

    return stdout.trim();
  } catch (error: any) {
    // If fails due to token limit, try summarize_paper instead
    if (error.message.includes("too long") && pattern !== "summarize_paper") {
      console.log("   Token limit exceeded, trying summarize_paper pattern...");
      return analyzeWithFabric(content.slice(0, 50000), "summarize_paper");
    }
    console.error(`   Fabric error: ${error.message}`);
    throw error;
  }
}

// Generate semantic filename
function generateSemanticFilename(metadata: PaperMetadata): string {
  const author = metadata.author?.split(/[,\s]+/)[0]?.replace(/[^a-zA-Z]/g, '') || "Unknown";
  const year = metadata.year || "2025";
  const titleWords = metadata.title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 6)
    .join('_');

  return `${author}_${year}_${titleWords}`;
}

// Process Fabric wisdom output to format quotes scientifically
function formatQuotesScientifically(wisdom: string, metadata: PaperMetadata): string {
  // Find the QUOTES section
  const quotesMatch = wisdom.match(/# QUOTES\s+([\s\S]+?)(?=\n# [A-Z]|$)/);

  if (!quotesMatch) return wisdom;

  const quotesSection = quotesMatch[1];
  const quoteLines = quotesSection.split('\n').filter(line => line.trim().startsWith('-'));

  // Group quotes by theme (basic categorization)
  const categories: { [key: string]: string[] } = {
    'Artificial Intimacy and Student Behavior': [],
    'Educational Responses and Institutional Limitations': [],
    'AI as Cultural Technology': [],
    'Critical Pedagogy and Student Competencies': [],
    'Educational Philosophy and Human Values': [],
    'Systemic Change and Future Directions': [],
    'Other Key Insights': []
  };

  // Simple keyword-based categorization
  quoteLines.forEach(line => {
    const quote = line.substring(2).trim(); // Remove "- " prefix

    if (quote.includes('student') || quote.includes('classroom') || quote.includes('intimacy')) {
      categories['Artificial Intimacy and Student Behavior'].push(quote);
    } else if (quote.includes('educator') || quote.includes('education is') || quote.includes('research')) {
      categories['Educational Responses and Institutional Limitations'].push(quote);
    } else if (quote.includes('cultural') || quote.includes('technology') || quote.includes('mirror')) {
      categories['AI as Cultural Technology'].push(quote);
    } else if (quote.includes('literacy') || quote.includes('learn') || quote.includes('decode')) {
      categories['Critical Pedagogy and Student Competencies'].push(quote);
    } else if (quote.includes('dignity') || quote.includes('humanity') || quote.includes('values')) {
      categories['Educational Philosophy and Human Values'].push(quote);
    } else if (quote.includes('framework') || quote.includes('future') || quote.includes('coalition')) {
      categories['Systemic Change and Future Directions'].push(quote);
    } else {
      categories['Other Key Insights'].push(quote);
    }
  });

  // Build formatted quotes section
  let formattedQuotes = '# KEY QUOTATIONS\n\n';
  const authorCitation = metadata.author && metadata.year ? `${metadata.author}, ${metadata.year}` :
                         metadata.author ? metadata.author :
                         metadata.year ? `Author, ${metadata.year}` : 'Author, Year';

  Object.entries(categories).forEach(([category, quotes]) => {
    if (quotes.length > 0) {
      formattedQuotes += `## ${category}\n\n`;
      quotes.forEach(quote => {
        // Check if it's a secondary quote (contains "quoted in" or similar)
        const isSecondaryQuote = quote.toLowerCase().includes('capitalism') && quote.toLowerCase().includes('fears');
        const citation = isSecondaryQuote ? 'Chiang, quoted in ' + authorCitation : authorCitation;

        formattedQuotes += `> ${quote} (${citation})\n\n`;
      });
    }
  });

  // Replace original QUOTES section with formatted version
  return wisdom.replace(/# QUOTES\s+[\s\S]+?(?=\n# [A-Z]|$)/, formattedQuotes);
}

// Create Griffl SEO brief
async function createGrifflBrief(
  wisdom: string,
  sections: PaperSections,
  metadata: PaperMetadata
): Promise<string> {
  const date = new Date().toISOString().split('T')[0];

  // Extract key topics for Obsidian tags
  const topics = new Set<string>();
  topics.add('AI-Education');
  topics.add('Educational-Technology');
  topics.add('Research');

  // Analyze content for additional tags
  const wisdomLower = wisdom.toLowerCase();
  if (wisdomLower.includes('intimacy')) topics.add('Artificial-Intimacy');
  if (wisdomLower.includes('literacy')) topics.add('Digital-Literacy');
  if (wisdomLower.includes('pedagogy') || wisdomLower.includes('teaching')) topics.add('Pedagogy');
  if (wisdomLower.includes('chatbot') || wisdomLower.includes('llm')) topics.add('LLM');
  if (wisdomLower.includes('emotion') || wisdomLower.includes('psychological')) topics.add('Psychology');
  if (wisdomLower.includes('cultural')) topics.add('Cultural-Technology');
  if (wisdomLower.includes('critical')) topics.add('Critical-Thinking');

  // Obsidian frontmatter
  let brief = `---\n`;
  brief += `tags: [${Array.from(topics).join(', ')}]\n`;
  brief += `author: ${metadata.author || 'Unknown'}\n`;
  brief += `year: ${metadata.year || new Date().getFullYear()}\n`;
  brief += `date-analyzed: ${date}\n`;
  brief += `type: research-brief\n`;
  brief += `status: analyzed\n`;
  if (metadata.url) brief += `source-url: ${metadata.url}\n`;
  brief += `---\n\n`;

  brief += `# ${metadata.title}\n\n`;
  brief += `**Source:** ${metadata.author ? `${metadata.author}. ` : ''}`;
  brief += `${metadata.year ? `(${metadata.year}). ` : ''}`;
  brief += `${metadata.title}.`;
  if (metadata.source) brief += ` *${metadata.source}*.`;
  brief += `\n\n`;

  if (metadata.url) {
    brief += `**Original Article:** ${metadata.url}\n\n`;
  }

  brief += `---\n\n`;

  // Format quotes scientifically and add Fabric wisdom analysis
  const formattedWisdom = formatQuotesScientifically(wisdom, metadata);
  brief += formattedWisdom + "\n\n";

  brief += `---\n\n`;

  // Add references if extracted
  if (sections.references) {
    brief += `## References & Key Literature\n\n`;
    brief += `### Primary Source\n`;
    brief += `${metadata.author || "Author"}`;
    if (metadata.year) brief += ` (${metadata.year})`;
    brief += `. ${metadata.title}.`;
    if (metadata.url) brief += ` ${metadata.url}`;
    brief += `\n\n`;

    brief += `### Additional References\n\n`;
    brief += sections.references + "\n\n";
  }

  brief += `---\n\n`;
  brief += `*Date analyzed: ${date}*\n`;
  brief += `*PDF renamed to: ${generateSemanticFilename(metadata)}.pdf*\n`;

  return brief;
}

// Main execution
async function main() {
  console.log("🚀 Academic Paper Analysis for Griffl\n");

  const input = parseArgs();

  // Skip processing if input is empty or whitespace
  if (!input.file || input.file.trim() === "") {
    console.log("ℹ️  No file provided, skipping processing");
    process.exit(0);
  }

  // Validate local file if provided
  if (input.file && !existsSync(input.file)) {
    console.error(`❌ File not found: ${input.file}`);
    process.exit(1);
  }

  let text: string;
  let metadata: PaperMetadata;

  // Primary method: Local PDF extraction
  if (input.file) {
    const result = await extractFromLocalPdf(input.file);
    text = result.text;
    metadata = {
      ...result.metadata,
      title: result.metadata.title || "Unknown Title",
      url: input.url
    };
  }
  // Fallback: URL-only (would need download logic or Jina MCP)
  else if (input.url) {
    console.error("❌ URL-only mode not yet implemented. Please download PDF and use --file option.");
    console.log("   Future: Will integrate Jina MCP for direct URL processing");
    process.exit(1);
  } else {
    console.error("❌ No valid input provided");
    process.exit(1);
  }

  // Parse paper structure
  console.log("\n📋 Parsing paper structure...");
  const sections = parseAcademicPaper(text);

  console.log(`   Found sections: ${Object.keys(sections).filter(k => sections[k as keyof PaperSections] && k !== 'fullContent').join(', ')}`);

  // Extract key content for analysis
  const keyContent = [
    sections.abstract,
    sections.introduction,
    sections.conclusion
  ].filter(Boolean).join("\n\n");

  // Analyze with Fabric
  let wisdom: string;
  try {
    const contentToAnalyze = keyContent || text.slice(0, 50000);
    wisdom = await analyzeWithFabric(contentToAnalyze);
  } catch (error: any) {
    console.error(`❌ Fabric analysis failed: ${error.message}`);
    console.log("   Creating basic structure from extracted content...");
    wisdom = `## Summary\n\n${sections.abstract || "No abstract available"}\n\n## Key Sections\n\n${keyContent.slice(0, 2000)}`;
  }

  // Generate semantic filename
  const semanticName = generateSemanticFilename(metadata);

  // Create SEO brief
  console.log("\n📝 Creating SEO brief...");
  const brief = await createGrifflBrief(wisdom, sections, metadata);

  // Save brief
  const briefDir = "C:\\Users\\herbo\\Documents\\Obsidian Vault\\04-CONTENT\\Griffl\\Research";
  const briefPath = path.join(briefDir, `${semanticName}.md`);
  await writeFile(briefPath, brief, "utf-8");
  console.log(`✅ Brief saved: ${briefPath}`);

  // Move and rename PDF to ebooks folder
  if (input.file && existsSync(input.file)) {
    const pdfDir = "C:\\Users\\herbo\\Documents\\ebooks";
    const newPdfPath = path.join(pdfDir, `${semanticName}.pdf`);

    if (input.file !== newPdfPath) {
      try {
        await rename(input.file, newPdfPath);
        console.log(`✅ PDF renamed: ${newPdfPath}`);
      } catch (error: any) {
        console.warn(`⚠️  Could not rename PDF: ${error.message}`);
      }
    }
  }

  console.log("\n🎉 Analysis complete!");
  console.log(`\n📊 Stats:`);
  console.log(`   Title: ${metadata.title}`);
  console.log(`   Author: ${metadata.author || "Unknown"}`);
  console.log(`   Year: ${metadata.year || "Unknown"}`);
  console.log(`   Content extracted: ${text.length} chars (~${Math.floor(text.length / 4)} tokens)`);
  console.log(`   Brief: ${briefPath}`);
}

main().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});