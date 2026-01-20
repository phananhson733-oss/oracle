# Plan: English Analysis of 20 Astrology Classics

## Objective
Generate comprehensive, depth-first English analysis reports (approx. 10,000 words each) for 20 classic astrology books, adhering to the `astrology-book-analyzer` v4.1 skill standards.

## Constraints & Standards
- **Role:** Planner (I structure the work; execution agents implement).
- **Skill:** `astrology-book-analyzer` v4.1.
- **Language:** English (US/UK professional standard).
- **Tone:** Professional, insightful, accessible yet deep. **NO EMOJIS**.
- **Source:** Must verify against original English texts/summaries to avoid "translation of a translation" hallucinations.
- **Output Directory:** `english_analysis/`

## Book List (20 Titles)
1. Aspects in Astrology (Sue Tompkins)
2. Astrology, Karma & Transformation (Stephen Arroyo)
3. Astrology, Psychology, and the Four Elements (Stephen Arroyo)
4. Chiron and the Healing Journey (Melanie Reinhart)
5. Cosmos and Psyche (Richard Tarnas)
6. The Development of the Personality (Liz Greene & Howard Sasportas)
7. Dynamics of the Unconscious (Liz Greene & Howard Sasportas)
8. Gods of Change (Howard Sasportas)
9. Jung and Astrology (Maggie Hyde)
10. Pluto: The Evolutionary Journey of the Soul (Jeff Green)
11. Psychological Astrology (Karen Hamaker-Zondag)
12. Relating (Liz Greene)
13. Retrograde Planets (Erin Sullivan)
14. Saturn: A New Look at an Old Devil (Liz Greene)
15. The Astrological Neptune (Liz Greene)
16. The Dark of the Soul (Liz Greene)
17. The Inner Planets (Liz Greene & Howard Sasportas)
18. The Inner Sky (Steven Forrest)
19. The Luminaries (Liz Greene & Howard Sasportas)
20. The Twelve Houses (Howard Sasportas)

## Execution Phases

### Phase 1: Context & Source Retrieval (Per Book)
**Agent:** `librarian` / `websearch`
**Action:**
- Search for extensive summaries, chapter outlines, and academic reviews of the original English text.
- Verify exact terminology used by the author (e.g., Liz Greene's specific Jungian terms).
- **Output:** A "Context Brief" for the writer agent containing key themes, chapter list, and author's core arguments.

### Phase 2: Content Generation (Batched)
Due to the 10k word requirement, generation for each book will be split into **3 logical parts** to maintain quality and avoid context truncation.

**Agent:** `oracle` or `general` (with `astrology-book-analyzer` skill loaded)

#### Part 1: Foundations (approx. 3500 words)
- **Sections:**
  1. Introduction: Why Read This Book
  2. Book Overview: Structure and Logic
  3. Core Concepts & Theories (First 50%)
- **Focus:** Author's background, historical context, philosophical framework.

#### Part 2: Methodology & Deep Dive (approx. 3500 words)
- **Sections:**
  1. Core Concepts & Theories (Remaining 50%)
  2. Astrological Methods and Techniques (The "How-To")
- **Focus:** Practical application, specific placement interpretations (e.g., Saturn in Houses), step-by-step guides.

#### Part 3: Synthesis & Critique (approx. 3000 words)
- **Sections:**
  1. Critical Analysis & Academic Discussion (Strengths/Limitations)
  2. Conclusion: Learning Path & Action Plan
  3. Summary: Classic Quotes (5-8) & Core Insight
- **Focus:** Critical thinking, comparative analysis, actionable takeaways.

### Phase 3: Assembly & Review
**Agent:** `writer` (or manual script)
**Action:**
- Combine Part 1, 2, and 3 into a single Markdown file: `english_analysis/[Book_Title].md`.
- **Quality Check:**
  - Verify "No Emoji" rule.
  - Verify "Terminology Explanation Template" usage.
  - Verify Word Count (~10k range).
  - Ensure formatting aligns with `assets/report-template-english.md`.

## Detailed Prompt Strategy (for Implementation)

When triggering the agent, use the following structure:

```markdown
**Task:** Analyze [Book Title] by [Author] using skill `astrology-book-analyzer`.
**Mode:** English Report Generation (Part X of 3).
**Context:** [Insert Context Brief from Phase 1]
**Constraints:**
- STRICTLY NO EMOJIS.
- Use "Depth First" approach.
- Follow `methodology.md` for [Book Type].
- Output strictly in Markdown.
```

## Next Steps
1. User approves this plan.
2. Execute Phase 1 for the first batch of books (e.g., first 5).
3. Execute Phase 2 sequentially.
