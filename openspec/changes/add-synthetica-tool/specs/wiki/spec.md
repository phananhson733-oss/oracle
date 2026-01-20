## ADDED Requirements

### Requirement: Synthetica tool availability
The system SHALL provide a "Synthetica" tool within the Encyclopedia Tools tab.

#### Scenario: Accessing the tool
- **WHEN** user navigates to Encyclopedia and selects Tools
- **THEN** the Synthetica tool interface is displayed

### Requirement: Localized report payload
The system SHALL return Synthetica analysis in a localized content envelope (`lang`, `content`, optional `meta`). The content MUST include `report_title`, `modules`, and `synthesis`.

#### Scenario: Report structure is returned
- **WHEN** user submits a selection (planet, sign, optional house, context, optional aspects)
- **THEN** the API returns `lang` and structured `content` with `report_title`, `modules`, and `synthesis`

#### Scenario: Report language matches UI
- **WHEN** the UI language is English
- **THEN** the API response uses `lang=en` and report text is English

#### Scenario: Cache hit avoids refetch
- **WHEN** the user repeats an identical selection with the same language
- **THEN** the system returns cached report content

### Requirement: Synthetica UI copy uses i18n
The system SHALL render the Tools tab label and tool UI text using the project i18n translations (EN label = "Synthetica").

#### Scenario: Tools label is localized
- **WHEN** the user switches language
- **THEN** the Tools tab label and tool prompts display the translated copy

### Requirement: Context-aware aspect weighting
The system SHALL rank selected aspects using context-specific planet multipliers, aspect-category multipliers, and key-house bonuses before prompt generation.

#### Scenario: Key house bonus affects ranking
- **WHEN** context is LOVE and the selected house is in the LOVE key-house set
- **THEN** the weight calculation includes the key-house bonus
