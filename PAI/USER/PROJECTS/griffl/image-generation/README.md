# Griffl Custom Image Generation System

**Status:** ✅ Operational (Illustration-First Approach)

## Overview

Agent-driven branded image generation system that creates **geometric illustrations** for Griffl.org content using Google Gemini Imagen AI, combining Elements of AI playfulness with Daniel Miessler's conceptual diagram sophistication.

## Architecture

```
Content Input
    ↓
Fabric Pattern (create_custom_image)
    ├─ Analyzes content
    ├─ Applies Griffl brand guidelines
    └─ Generates optimized prompt
    ↓
Generate Command (generate-brand-image.md)
    ├─ Calls Imagen API
    ├─ Downloads image
    └─ Saves metadata to Obsidian
    ↓
Branded Illustration (PNG)
```

## Quick Start

### 1. Setup

```bash
# Add to .env file
GEMINI_API_KEY=your_api_key_here
FABRIC_PATH=C:\Users\herbo\Documents\GitHub\Fabric\fabric.exe
```

### 2. Generate Image from Text

```bash
echo "AI simplifies teaching" | bun ~/.claude/commands/generate-brand-image.md
```

### 3. Generate from Blog Post

```bash
cat blog-post.md | bun ~/.claude/commands/generate-brand-image.md --output hero-image.png
```

## Components

### 1. **Visual Guidelines** (`visual-guidelines.md`)

Comprehensive brand standards for image generation:
- Color palette (Griffl purple #8d1491 primary)
- Illustration styles (flat geometric, conceptual diagrams)
- Visual metaphors for AI/education concepts
- Composition patterns (hero, diptych, flow, layered)
- Style references (Elements of AI + Miessler diagrams)

### 2. **Fabric Pattern** (`create_custom_image`)

Location: `C:\Users\herbo\Documents\GitHub\Fabric\data\patterns\create_custom_image\`

Transforms content into optimized image prompts:
- Analyzes core concepts and emotional tone
- Selects appropriate visual metaphors
- Applies Griffl brand colors and style
- Generates detailed 150-250 word prompts
- Outputs structured Markdown with metadata

### 3. **Generation Command** (`generate-brand-image.md`)

Location: `~/.claude/commands/generate-brand-image.md`

Orchestrates the complete workflow:
- Runs Fabric pattern
- Calls Imagen/DALL-E API
- Downloads and saves images
- Creates Obsidian metadata records

### 4. **Test Script** (`test-image-generation.md`)

Quick workflow validation without API calls

## Usage Examples

### Basic Hero Image

```bash
echo "New AI course for educators launched" \
  | bun commands/generate-brand-image.md \
  --output griffl-course-hero.png
```

### Social Media Share

```bash
cat announcement.md \
  | bun commands/generate-brand-image.md \
  --size 1.91:1 \
  --output social-share.png
```

### Multiple Iterations

```bash
cat blog-draft.md \
  | bun commands/generate-brand-image.md \
  --iterations 3 \
  --api imagen
```

## Output Examples

**Input:** "AI workflows simplify teaching preparation"

**Generated Prompt:**
```
Flat geometric minimalist illustration showing AI workflow automation,
centered hero composition with lightbulb insight moment, deep purple
(#8d1491) accent highlighting AI element, supporting navy blue (#2563eb)
for structure and warm coral (#fb923c) for human connection, generous
whitespace, simplified geometric teacher figure interacting with clean
interface elements, in the style of Elements of AI course materials
meets New Yorker editorial diagrams...
```

**Output:** PNG image with:
- Griffl brand compliance (purple accent visible)
- Geometric illustration style
- Clear visual metaphor
- Professional educational aesthetic
- Metadata saved to Obsidian

## Brand Guidelines Summary

### Must-Have Elements
- ✅ Griffl purple (#8d1491) as primary accent
- ✅ Flat geometric style (never realistic/3D)
- ✅ Conceptual visual metaphors
- ✅ 2-4 color palette maximum
- ✅ Generous whitespace (30-40%)
- ✅ Elements of AI or editorial diagram style

### Never Include
- ❌ Realistic/photographic styles
- ❌ 3D renders
- ❌ Literal robots with screen faces
- ❌ Matrix-style falling code
- ❌ Clipart or childish cartoon styles
- ❌ Cluttered compositions

## Supported Illustration Types

### 1. Concept Explanation Diagrams
Abstract geometric shapes showing systems, workflows, relationships

**Best for:** Technical concepts, AI processes, learning loops

### 2. Transformation Visuals
Before/after, problem/solution diptychs

**Best for:** Impact stories, value propositions, case studies

### 3. Process Workflows
Left-to-right or top-to-bottom flow diagrams

**Best for:** Step-by-step guides, methodologies, frameworks

### 4. Hero Images
Centered metaphor with supporting details

**Best for:** Blog headers, course thumbnails, landing pages

## Cost & Performance

### Google Gemini Imagen 4 Fast (Default)
- **Cost:** $0.02 per image
- **Speed:** ~10 seconds
- **Quality:** High, suitable for most use cases
- **Best for:** Iteration, testing, social media

### OpenAI DALL-E 3 HD (Optional)
- **Cost:** $0.08 per image
- **Speed:** ~15 seconds
- **Quality:** Premium, highest detail
- **Best for:** Hero images, print, premium content

### Recommended Strategy
1. Generate 2-3 iterations with Imagen ($0.04-0.06 total)
2. Select best concept
3. Optional: Final generation with DALL-E HD if needed

## Integration with Existing Workflows

### Morning Briefing
Could extend `good-morning.bat` to generate hero images for scheduled posts

### Content Pipeline
```
1. Write blog post
2. Run create_seo_brief pattern
3. Generate hero image ← NEW
4. Publish to WordPress
```

### Social Media
Automate visual creation for LinkedIn/Twitter announcements

## Troubleshooting

### Pattern Not Found
```bash
# Update Fabric patterns
cd C:\Users\herbo\Documents\GitHub\Fabric
./fabric.exe --updatepatterns
```

### API Key Issues
```bash
# Verify in .env
echo $GEMINI_API_KEY
```

### Image Quality Problems
- Check brand alignment score in metadata
- Adjust prompt in Fabric pattern if score < 0.85
- Try different visual metaphor

### Griffl Purple Not Visible
- Pattern explicitly includes #8d1491 in prompt
- If missing, regenerate or manually edit prompt

## Files & Locations

```
PAI/
├── .claude/context/projects/griffl/image-generation/
│   ├── README.md (this file)
│   └── visual-guidelines.md (comprehensive brand standards)
├── .claude/commands/
│   ├── generate-brand-image.md (main orchestrator)
│   └── test-image-generation.md (workflow test)
│
Fabric/
└── data/patterns/create_custom_image/
    ├── system.md (pattern logic)
    └── README.md (usage docs)
```

## Future Enhancements

### Planned
- [ ] Agent integration (visual-storyteller + brand-guardian)
- [ ] Style learning from reference images
- [ ] Batch generation for content series
- [ ] Template library for common concepts

### Ideas
- Automated alt text generation with SEO optimization
- A/B testing different visual metaphors
- Integration with WordPress media library
- Notion database of generated images with metadata

## Version History

- **v1.0** (2025-10-02): Initial release
  - Illustration-first approach
  - Imagen AI integration
  - Griffl brand guidelines (Elements of AI + Miessler style)
  - Markdown-based Fabric pattern

## Support

**Documentation:**
- Visual Guidelines: `visual-guidelines.md`
- Fabric Pattern: `Fabric/data/patterns/create_custom_image/README.md`

**Testing:**
- Quick test: `bun test-image-generation.md`
- Full test: Use actual content with `--iterations 1`

**Issues:**
- Brand alignment < 0.85: Refine visual-guidelines.md
- API errors: Check .env keys
- Pattern updates: `fabric --updatepatterns`

---

**Maintained by:** ATOM Digital Assistant
**Last Updated:** 2025-10-02
**System Status:** ✅ Operational
