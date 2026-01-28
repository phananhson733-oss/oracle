## ADDED Requirements

### Requirement: Home Page Layout Structure

The home page SHALL display the following modules in order from top to bottom:
1. Header with greeting, date, and user avatar
2. Today's Fortune card (daily forecast summary)
3. Quick Access section with three entry points
4. My Chart section with natal chart and life k-line entries
5. Personalized Recommendations section with 3-4 dynamic cards

#### Scenario: Home page initial load
- **WHEN** user opens the home page
- **THEN** all five modules are displayed in the specified order
- **AND** Today's Fortune card shows loading state until data is fetched

#### Scenario: Quick Access section display
- **WHEN** home page is loaded
- **THEN** Quick Access section shows three equal-width buttons
- **AND** buttons are labeled: "双人合盘", "CBT日记", "AI问答"
- **AND** each button has an icon and subtitle

### Requirement: Quick Access Navigation

The Quick Access section SHALL provide navigation to three core features:
- 双人合盘 (Synastry) → Discovery page synastry tab
- CBT日记 (CBT Journal) → CBT journal page
- AI问答 (AI Q&A) → Ask page

#### Scenario: Navigate to synastry
- **WHEN** user taps "双人合盘" button
- **THEN** app navigates to discovery page with synastry tab active

#### Scenario: Navigate to CBT journal
- **WHEN** user taps "CBT日记" button
- **THEN** app navigates to CBT journal page

#### Scenario: Navigate to AI Q&A
- **WHEN** user taps "AI问答" button
- **THEN** app navigates to ask page

### Requirement: My Chart Section

The My Chart section SHALL display two list items:
- 本命盘解读 (Natal Chart Reading) → Self page
- 人生k线图 (Life K-Line Chart) → K-line chart page

#### Scenario: Navigate to natal chart
- **WHEN** user taps "本命盘解读" item
- **THEN** app navigates to self page

#### Scenario: Navigate to life k-line
- **WHEN** user taps "人生k线图" item
- **THEN** app navigates to life k-line chart page

### Requirement: Personalized Recommendation System

The home page SHALL display personalized recommendations based on user status and current astrological events.

#### Scenario: New user recommendations
- **WHEN** user registered within 3 days
- **THEN** recommendations show fixed onboarding cards:
  - "生成你的本命盘"
  - "了解双人合盘"
  - "占星入门指南"

#### Scenario: User without birth chart
- **WHEN** user has not generated birth chart
- **AND** user is not a new user
- **THEN** recommendations include "5分钟了解真实的自己" card with priority 10

#### Scenario: Important astrological event
- **WHEN** there is an active important astrological event (e.g., Mercury retrograde)
- **THEN** recommendations include event reminder card with priority 9

#### Scenario: CBT journal reminder
- **WHEN** user's last CBT entry was more than 3 days ago
- **THEN** recommendations include CBT reminder card with priority 7

#### Scenario: Synastry feature promotion
- **WHEN** user has never used synastry feature
- **THEN** recommendations include synastry promotion card with priority 6

### Requirement: Recommendation Priority Algorithm

The system SHALL calculate recommendation priority and display top 3-4 items sorted by priority score.

Priority scores:
- New user onboarding: 10
- Birth chart generation: 10
- Astrological event alert: 9
- Behavior-based recommendation: 8
- CBT journal reminder: 7
- Synastry promotion: 6
- Trending content: 5
- Educational content: 4

#### Scenario: Priority sorting
- **WHEN** multiple recommendation types are applicable
- **THEN** recommendations are sorted by priority score descending
- **AND** only top 3-4 items are displayed

### Requirement: User Status API Integration

The home page SHALL fetch user status from backend API to determine recommendation content.

#### Scenario: Successful status fetch
- **WHEN** home page loads
- **THEN** system calls `GET /api/user/status`
- **AND** uses response to generate recommendations

#### Scenario: Status API failure
- **WHEN** user status API call fails
- **THEN** system uses local storage data to infer user status
- **AND** recommendations are generated with available data

### Requirement: Astrological Events API Integration

The home page SHALL fetch current astrological events from backend API with local caching.

#### Scenario: Successful events fetch
- **WHEN** home page loads
- **AND** cache is expired or empty
- **THEN** system calls `GET /api/astro/events?date={today}`
- **AND** caches response for 24 hours

#### Scenario: Events cache hit
- **WHEN** home page loads
- **AND** valid cache exists (within 24 hours)
- **THEN** system uses cached data without API call

#### Scenario: Events API failure
- **WHEN** astrological events API call fails
- **AND** no valid cache exists
- **THEN** astrological event recommendations are skipped
- **AND** other recommendations are still displayed

### Requirement: Recommendation Card Display

Each recommendation card SHALL display:
- Icon (emoji or image)
- Title (8-15 characters)
- Optional subtitle/description
- Tap action to navigate to relevant feature

#### Scenario: Card tap navigation
- **WHEN** user taps a recommendation card
- **THEN** app navigates to the feature or content specified by the card type

#### Scenario: Card visual style
- **WHEN** recommendation cards are displayed
- **THEN** each card shows icon on the left
- **AND** title and optional subtitle on the right
- **AND** card has consistent padding and border radius
