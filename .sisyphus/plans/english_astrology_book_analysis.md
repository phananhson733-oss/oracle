# English Astrology Book Analysis Plan (Revised)

## Objective
Generate deep "disassembly" (analysis) reports in English for 20 classic astrology books.
**CRITICAL**: The existing Chinese analysis files are **structural references only**. The actual content **MUST** be derived from fresh web searches of the original English texts and reliable summaries to ensure authenticity and avoid "translationese" or hallucinated details.

## Core Constraints
1.  **Source Material**: Use `websearch` to find original English book summaries, reviews, and excerpts. Do **NOT** rely solely on translating the Chinese text.
2.  **Structure**: Mirror the "Part X/Y" structure of the Chinese reference files (typically 5 parts per book).
3.  **Length & Depth**: maintain a word count and depth comparable to the Chinese versions (approx. 2000-3000 words per book, split into parts).
4.  **Hallucination Control**:
    - Verify all specific terms, quotes, and chapter titles against English sources.
    - If a specific "oracle" insight in the Chinese version seems unique to that analysis, try to find the corresponding concept in the original book; if not found, adapt the *spirit* of the insight using verified concepts from the book.
5.  **Context**: Ensure the tone is appropriate for professional/psychological astrology (Jungian, Evolutionary, etc.).

## Target Directory
`english_analysis/` (New directory)

## List of Books (Reference Files)
1. `Aspects_in_Astrology.md` (Sue Tompkins)
2. `Astrology_Karma_Transformation.md` (Stephen Arroyo)
3. `Astrology_Psychology_Elements.md` (Stephen Arroyo)
4. `Chiron_and_the_Healing_Journey.md` (Melanie Reinhart)
5. `Cosmos_and_Psyche.md` (Richard Tarnas)
6. `Development_Personality.md` (Howard Sasportas)
7. `Dynamics_of_the_Unconscious.md` (Liz Greene & Howard Sasportas)
8. `Gods_of_Change.md` (Howard Sasportas)
9. `Jung_and_Astrology.md` (Maggie Hyde)
10. `Pluto_Evolutionary_Journey.md` (Jeff Green)
11. `Psychological_Astrology.md` (Karen Hamaker-Zondag)
12. `Relating.md` (Liz Greene)
13. `Retrograde_Planets.md` (Erin Sullivan)
14. `Saturn.md` (Liz Greene)
15. `The_Astrological_Neptune.md` (Liz Greene)
16. `The_Dark_of_the_Soul.md` (Liz Greene)
17. `The_Inner_Planets.md` (Liz Greene & Howard Sasportas)
18. `The_Inner_Sky.md` (Steven Forrest)
19. `The_Luminaries.md` (Liz Greene & Howard Sasportas)
20. `The_Twelve_Houses.md` (Howard Sasportas)

## Implementation Workflow (Per Book)

### Step 1: Context Gathering
1.  **Read Reference**: Read the Chinese `.md` file to understand the *structure* (how many parts, what themes are covered in each part).
2.  **Web Search**: Perform targeted searches for the book title + author + "summary", "chapter analysis", "key concepts", "quotes".
    - *Query Examples*: "Saturn Liz Greene summary chapter by chapter", "Jung and Astrology Maggie Hyde key concepts".

### Step 2: Content Generation
1.  **Drafting**: Write the English analysis following the "Deep Disassembly" format.
    - **Header**: Standardized metadata table.
    - **Body**: Split into Parts (e.g., Part 1: Core Philosophy, Part 2: Specific Placements, etc.).
    - **Oracle/Action**: Include the practical/mystical application sections, ensuring they align with the book's actual teachings.
2.  **Refinement**: Ensure the tone is consistent—authoritative, psychological, and engaging.

### Step 3: Verification
1.  **Fact Check**: Are the concepts attributed to the correct author? (e.g., distinguishing Greene's view on Saturn from traditional views).
2.  **Length Check**: Is the content sufficiently detailed? (Avoid brief summaries; aim for "deep dive").

## Execution Batching
To ensure quality, books will be processed in groups of 5.

**Batch 1**:
- Jung_and_Astrology
- Saturn
- The_Inner_Sky
- Cosmos_and_Psyche
- Pluto_Evolutionary_Journey

(Subsequent batches to follow)

