#!/usr/bin/env bun

/**
 * generate-brand-image - Agent-driven branded image generation
 *
 * Orchestrates visual-storyteller and brand-guardian agents to create
 * brand-compliant illustrations using Fabric's create_custom_image pattern
 * and Google Gemini Imagen AI.
 *
 * Usage:
 *   echo "content" | bun generate-brand-image.md
 *   cat blog-post.md | bun generate-brand-image.md --output hero.png
 *   bun generate-brand-image.md --file post.md --model imagen-4.0-ultra-generate-001
 *
 * Options:
 *   --output, -o     Output image filename (default: branded-image-[timestamp].png)
 *   --file, -f       Input file path (alternative to stdin)
 *   --model, -m      Image model: dall-e-3|dall-e-2|imagen-4.0-ultra|imagen-4.0|imagen-3.0 (default: dall-e-3)
 *   --size           Aspect ratio: 16:9|1.91:1|1:1|4:3|9:16 (default: 16:9)
 *   --iterations, -i Number of variations to generate (default: 1)
 *   --save-metadata  Save generation metadata to Obsidian (default: true)
 *   --help, -h       Show this help message
 */

import { readFileSync } from 'fs';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

// Environment setup
const FABRIC_PATH = process.env.FABRIC_PATH || 'C:\\Users\\herbo\\Documents\\GitHub\\Fabric\\fabric.exe';
const FABRIC_ENV_PATH = 'C:\\Users\\herbo\\.config\\fabric\\.env';

// Load API keys from Fabric environment
let GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let OPENAI_API_KEY = process.env.OPENAI_API_KEY;

try {
  const fabricEnv = readFileSync(FABRIC_ENV_PATH, 'utf-8');
  const lines = fabricEnv.split('\n');
  for (const line of lines) {
    if (line.startsWith('GEMINI_API_KEY=')) {
      GEMINI_API_KEY = line.split('=')[1].trim();
    } else if (line.startsWith('OPENAI_API_KEY=')) {
      OPENAI_API_KEY = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.warn('⚠️  Could not load Fabric environment, using system env vars');
}

const OBSIDIAN_VAULT = process.env.OBSIDIAN_VAULT_PATH || 'C:\\Users\\herbo\\Documents\\Obsidian Vault';
const GRIFFL_IMAGE_DIR = 'C:\\Users\\herbo\\Documents\\GitHub\\Griffl.org\\custom-image';

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  output: null,
  file: null,
  model: 'dall-e-3',
  size: '16:9',
  iterations: 1,
  saveMetadata: true,
  help: false
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--output' || arg === '-o') flags.output = args[++i];
  else if (arg === '--file' || arg === '-f') flags.file = args[++i];
  else if (arg === '--model' || arg === '-m') flags.model = args[++i];
  else if (arg === '--size') flags.size = args[++i];
  else if (arg === '--iterations' || arg === '-i') flags.iterations = parseInt(args[++i]);
  else if (arg === '--save-metadata') flags.saveMetadata = args[++i] !== 'false';
  else if (arg === '--help' || arg === '-h') flags.help = true;
}

if (flags.help) {
  console.log(readFileSync(__filename, 'utf-8').split('*/')[0].split('/**')[1]);
  process.exit(0);
}

// Read input content
let content = '';
if (flags.file) {
  if (!existsSync(flags.file)) {
    console.error(`Error: File not found: ${flags.file}`);
    process.exit(1);
  }
  content = readFileSync(flags.file, 'utf-8');
} else {
  // Read from stdin
  const stdinBuffer = readFileSync(0, 'utf-8');
  content = stdinBuffer.trim();
}

if (!content) {
  console.error('Error: No content provided. Use stdin or --file option.');
  process.exit(1);
}

// Determine API from model name
const apiType = flags.model.includes('dall-e') ? 'dall-e' : 'imagen';

// Validate API keys
if (apiType === 'imagen' && !GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY not found in environment');
  process.exit(1);
}

if (apiType === 'dall-e' && !OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY not found in environment');
  process.exit(1);
}

console.log('🎨 Griffl Brand Image Generator\n');
console.log(`📄 Content length: ${content.length} characters`);
console.log(`🤖 Model: ${flags.model}`);
console.log(`📐 Size: ${flags.size}\n`);

// Step 1: Run Fabric pattern to generate prompt
console.log('⚡ Generating image prompt with Fabric pattern...');

let promptJson;
try {
  const fabricCmd = `"${FABRIC_PATH}" --pattern create_custom_image -v=imageModel:${flags.model}`;
  const fabricOutput = execSync(fabricCmd, {
    input: content,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  promptJson = JSON.parse(fabricOutput.trim());

  // Ensure model is set correctly (fallback to flag if variable didn't work)
  if (!promptJson.api_parameters || !promptJson.api_parameters.model || promptJson.api_parameters.model === '{{imageModel}}') {
    if (!promptJson.api_parameters) promptJson.api_parameters = {};
    promptJson.api_parameters.model = flags.model;
  }

  console.log(`✅ Prompt generated (${promptJson.image_prompt.length} chars)`);
  console.log(`🎯 Brand alignment: ${(promptJson.brand_alignment_score * 100).toFixed(0)}%`);
  console.log(`💡 Visual metaphor: ${promptJson.visual_metaphor}`);
  console.log(`🎭 Emotional tone: ${promptJson.emotional_tone}\n`);
} catch (error) {
  console.error('❌ Failed to generate prompt with Fabric pattern');
  console.error(error.message);
  process.exit(1);
}

// Adjust aspect ratio if specified
if (flags.size && flags.size !== '16:9') {
  promptJson.api_parameters.aspectRatio = flags.size;
}

// Step 2: Generate image with API
console.log(`🖼️  Generating image with ${apiType}...\n`);

// Ensure output directory exists
if (!existsSync(GRIFFL_IMAGE_DIR)) {
  mkdirSync(GRIFFL_IMAGE_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const defaultFilename = join(GRIFFL_IMAGE_DIR, `griffl-image-${timestamp}.png`);
const outputFilename = flags.output || defaultFilename;

if (apiType === 'imagen') {
  await generateWithImagen(promptJson, outputFilename, flags.iterations);
} else if (apiType === 'dall-e') {
  await generateWithDallE(promptJson, outputFilename, flags.iterations);
}

// Step 3: Save metadata to Obsidian
if (flags.saveMetadata) {
  await saveMetadataToObsidian(promptJson, outputFilename, content, flags.model);
}

console.log(`\n✨ Image generation complete!`);
console.log(`📁 Saved to: ${outputFilename}`);

// === API Integration Functions ===

async function generateWithImagen(promptData, outputPath, iterations) {
  const { image_prompt, negative_prompt, api_parameters } = promptData;

  // Use model from api_parameters (set by Fabric pattern variable)
  const modelName = api_parameters.model || 'imagen-4.0-generate-001';

  for (let i = 0; i < iterations; i++) {
    console.log(`🎨 Iteration ${i + 1}/${iterations}...`);

    const payload = {
      instances: [{
        prompt: image_prompt
      }],
      parameters: {
        sampleCount: 1,
        aspectRatio: api_parameters.aspectRatio || "16:9"
      }
    };

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Imagen API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.predictions || result.predictions.length === 0) {
        throw new Error('No images returned from Imagen API');
      }

      // Get base64 image data
      const imageBase64 = result.predictions[0].bytesBase64Encoded;
      const imageBuffer = Buffer.from(imageBase64, 'base64');

      // Save image
      const finalPath = iterations > 1
        ? outputPath.replace('.png', `-${i + 1}.png`)
        : outputPath;

      writeFileSync(finalPath, imageBuffer);
      console.log(`✅ Saved: ${finalPath} (${(imageBuffer.length / 1024).toFixed(1)} KB)`);

    } catch (error) {
      console.error(`❌ Iteration ${i + 1} failed:`, error.message);
      if (i === iterations - 1) process.exit(1);
    }
  }
}

async function generateWithDallE(promptData, outputPath, iterations) {
  const { image_prompt, api_parameters } = promptData;

  // Map aspect ratio to DALL-E size
  const sizeMap = {
    '16:9': '1792x1024',
    '1.91:1': '1792x1024', // Closest DALL-E supports
    '1:1': '1024x1024',
    '4:3': '1024x1024', // Closest square
    '9:16': '1024x1792'
  };

  const size = sizeMap[api_parameters.aspectRatio] || '1024x1024';

  for (let i = 0; i < iterations; i++) {
    console.log(`🎨 Iteration ${i + 1}/${iterations}...`);

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: image_prompt,
          n: 1,
          size: size,
          quality: 'hd',
          style: 'natural'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DALL-E API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const imageUrl = result.data[0].url;

      // Download image
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      const finalPath = iterations > 1
        ? outputPath.replace('.png', `-${i + 1}.png`)
        : outputPath;

      writeFileSync(finalPath, imageBuffer);
      console.log(`✅ Saved: ${finalPath} (${(imageBuffer.length / 1024).toFixed(1)} KB)`);

    } catch (error) {
      console.error(`❌ Iteration ${i + 1} failed:`, error.message);
      if (i === iterations - 1) process.exit(1);
    }
  }
}

async function saveMetadataToObsidian(promptData, imagePath, originalContent, apiUsed) {
  const date = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString();

  const metadata = `# Image Generation Metadata

**Generated:** ${timestamp}
**Image:** ${imagePath}
**API:** ${apiUsed}
**Brand Alignment:** ${(promptData.brand_alignment_score * 100).toFixed(0)}%

## Original Content

\`\`\`
${originalContent.slice(0, 500)}${originalContent.length > 500 ? '...' : ''}
\`\`\`

## Visual Design

**Metaphor:** ${promptData.visual_metaphor}
**Tone:** ${promptData.emotional_tone}
**Placement:** ${promptData.suggested_placement}

## Generated Prompt

\`\`\`
${promptData.image_prompt}
\`\`\`

## Negative Prompt

\`\`\`
${promptData.negative_prompt}
\`\`\`

## Alt Text

${promptData.alt_text}

## API Parameters

\`\`\`json
${JSON.stringify(promptData.api_parameters, null, 2)}
\`\`\`

---
**Tags:** #ai-generated #griffl-brand #visual-content
**Brand Alignment Score:** ${promptData.brand_alignment_score}
`;

  const metadataDir = join(OBSIDIAN_VAULT, 'AI-Generated-Images');
  if (!existsSync(metadataDir)) {
    mkdirSync(metadataDir, { recursive: true });
  }

  const metadataPath = join(metadataDir, `${date}-image-generation-${timestamp.split('T')[1].replace(/[:.]/g, '-').slice(0, 8)}.md`);
  writeFileSync(metadataPath, metadata);

  console.log(`📝 Metadata saved to Obsidian: ${metadataPath}`);
}
