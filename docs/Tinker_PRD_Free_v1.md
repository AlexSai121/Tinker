# TINKER
## Product Requirements Document — Free Edition

**Version:** 1.1  
**Date:** April 22, 2026  
**Status:** Draft  
**Classification:** Confidential  
**Monetization:** None (Free App)

---

## 1. EXECUTIVE SUMMARY

Tinker is a free, open-source project-embedded learning notebook designed for makers, builders, and self-taught polymaths who learn by doing. Unlike traditional note-taking apps that organize knowledge by subject or date, Tinker organizes learning around physical projects in progress. It treats failure as first-class data, requires evidence of applied understanding, and preserves human-drawn connections across disciplines.

**Core Thesis:** Learning and creating are the same activity for builders, yet every existing tool treats them as separate. Tinker closes that gap — and remains free forever.

---

## 2. PROBLEM STATEMENT

### 2.1 The Unsolved Problem

Current learning and note-taking tools fail builders and creatives in four critical ways:

1. **Separation of Notes and Practice:** You take notes *about* woodworking in Notion, but you build the dovetail joint in your garage. The gap between theory and practice is never bridged in software.

2. **Failure Is Invisible:** Every maker fails repeatedly while learning. Current tools have no mechanism to capture, categorize, or learn from those failures. The most valuable learning data — what went wrong and why — disappears.

3. **Illusion of Competence:** Flashcards and highlighted text create a false sense of mastery. You can recall a definition without being able to execute the skill. No tool requires proof of application.

4. **Cross-Domain Insights Are Lost:** A carpenter learning joinery and a programmer learning recursion might both grapple with "tension" and "fit." Current tools keep knowledge in silos. The user must manually bridge domains, and those bridges evaporate.

### 2.2 Target User

**Primary Persona: The Self-Taught Polymath Maker**

- Weekend woodworkers learning Japanese joinery via YouTube
- Indie hackers teaching themselves electronics and 3D modeling
- DIY biologists running experiments in community labs
- Creative technologists blending code, sculpture, and sound
- Retired engineers rebuilding vintage motorcycles

**Common traits:**
- Learns across 3+ domains simultaneously
- Values process over polish
- Has a physical or digital "shop" where projects live
- Keeps notebooks, but they are messy and non-searchable
- Frustrated by the gap between tutorial consumption and actual ability
- **Skeptical of subscription software** — prefers tools they own

**Secondary Persona: The Trade School / Bootcamp Student**
- Needs to document hands-on learning for assessment
- Wants a portfolio of demonstrated skills, not just certificates

---

## 3. PRODUCT VISION

> "A craftsman's workshop, digitized. Every project is a workbench. Every failure is a scar with a story. Every skill is proven, not parroted."

Tinker is not a second brain. It is **first hands** — a tool for people who think with their hands, not just their minds.

**Free Forever Commitment:** Tinker is released as free, open-source software. All core features are available to every user without payment, account creation, or data collection. The tool belongs to the community that uses it.

---

## 4. CORE FEATURES

### 4.1 The Workbench View

**Concept:** A zoomable, infinite canvas where each project exists as a physical workbench. Spatial memory replaces folder hierarchies.

**Implementation:**
- Each project is represented as a workbench card on an infinite canvas
- Workbenches have a physical size — they cannot grow infinitely. If a project outgrows its bench, it must split into sub-projects or a new bench
- Users pan and zoom across their workshop. The camera position is persistent per session
- Workbenches can be grouped into "shops" (e.g., "Wood Shop," "Code Lab," "Electronics Bench")
- Background texture options: pegboard, concrete, butcher block, grid paper

**Interaction Details:**
- Pinch to zoom, two-finger pan (touch)
- Scroll wheel zoom, click-drag pan (desktop)
- Double-click a workbench to "step up to it" — full-screen project view
- Workbenches have a "dust level" — visually fade if untouched for >30 days (gentle nudge, not guilt)

**Why This Works:**
- Spatial memory is more durable than semantic memory. Users will remember "my fermentation project is in the upper-left corner of the kitchen shop" faster than they remember a folder path
- Physical constraints (bench size) force project decomposition, which is good learning hygiene

---

### 4.2 Project-Embedded Learning

**Concept:** Every note, link, image, or video must be "nailed" to a specific project. No floating notes. No subject-based organization.

**Implementation:**
- When creating any content, the user must select an active project
- Content types:
  - **Observation:** Text note with optional photo/video attachment
  - **Reference:** External link or file (PDF, video URL, article) with required 1-sentence "why this matters" field
  - **Attempt:** Documentation of a try — what you did, what happened, what you used
  - **Question:** Explicit unknown — flagged for future resolution
  - **Breakthrough:** A solved problem or discovered technique — requires evidence attachment
- All content appears on the project workbench as physical items: sticky notes, index cards, photos, tool icons
- Content can be rearranged on the bench surface. Position is meaningful and persistent.

**The "Why This Matters" Constraint:**
- Every reference (link, file, quote) requires a mandatory 1-sentence field explaining its relevance to the project
- This field is searchable and displayed as a subtitle under the reference
- Prevents link hoarding and forces immediate contextualization

**Why This Works:**
- Prevents the "read later" graveyard. If you cannot articulate why a link matters to your current project, you cannot save it
- Creates an automatic learning narrative: "I was building X, I found Y, I thought Z, I tried A, it failed because B"

---

### 4.3 Failure Archaeology

**Concept:** A systematic, categorized documentation of mistakes, with tools to surface patterns over time.

**Implementation:**

**Scar Tagging:**
- When documenting an "Attempt" that failed, the user is prompted to tag the failure with:
  - **Failure Type** (from a personal taxonomy that grows over time):
    - Misunderstood instruction
    - Wrong tool/material
    - Impatience / rushed
    - Overconfidence
    - Environmental factor (temperature, humidity, etc.)
    - Conceptual gap (didn't understand the principle)
    - Execution error (understood, but hands failed)
    - Unknown — genuinely mysterious
  - **Severity:** Minor setback / Significant delay / Project restart / Injury risk
  - **Cost:** Time lost, materials ruined, money spent (optional but encouraged)

**Scar Map:**
- A personal dashboard showing failure patterns over time
- Visualizations:
  - Timeline of failures across all projects
  - Pie chart: failure type distribution
  - Heat map: which projects generate the most failures
  - Trend line: are you failing faster (more attempts) or smarter (different failure types)?
- Filterable by project, time period, failure type

**Scar Sharing (Optional):**
- Users can export anonymized scar maps as shareable files
- Community scars are browseable via a simple peer-to-peer or self-hosted directory
- "I failed the same way" upvote system
- No comments — only "me too" reactions and links to how the user eventually solved it
- **No central server required** — sharing is opt-in and user-controlled

**Why This Works:**
- Normalizes failure as data, not shame
- Pattern recognition in failure types reveals systemic gaps (e.g., "I always rush the finishing stage")
- Community scars reduce isolation and accelerate learning without requiring expert mentors

---

### 4.4 Mastery Markers

**Concept:** Skills are not marked "learned" until the user provides evidence of applied understanding.

**Implementation:**

**Evidence Types:**
- **Photo:** Visual proof of completed work (e.g., finished dovetail joint)
- **Video:** Demonstration of process or technique (30-second minimum)
- **File:** Working code, CAD model, circuit schematic, etc.
- **Peer Review:** Link to a forum post or community thread where you taught someone else
- **Replication:** Documentation of successfully repeating the skill in a new context

**Skill Lifecycle:**
1. **Exposed:** You encountered the concept (reference saved)
2. **Attempted:** You tried it (failure or partial success documented)
3. **Practiced:** Evidence uploaded and self-reviewed
4. **Owned:** Evidence reviewed after 30+ days — do you still remember how? Can you still do it?

**The 30-Day Challenge:**
- After marking a skill "Practiced," Tinker schedules a 30-day reminder
- The user must upload *new* evidence of the same skill, in a *different* project, to mark it "Owned"
- This prevents the "I watched a tutorial once" illusion of competence

**Skill Portfolio:**
- A dedicated view showing all "Owned" skills with their evidence
- Exportable as a PDF portfolio for job applications, apprenticeships, or personal review
- Skills are tagged with the projects that built them

**Why This Works:**
- Friction prevents false mastery. The user must do the work to claim the skill
- The 30-day challenge enforces spaced repetition through action, not flashcards
- The portfolio creates tangible proof of self-directed learning

---

### 4.5 Skill Cross-Pollination (Analogy Threads)

**Concept:** Users manually draw connections between concepts across projects. The tool preserves and surfaces these bridges.

**Implementation:**

**Bridge Creation:**
- From any piece of content on any workbench, the user can initiate a "bridge"
- They navigate to another project, select the target content, and write a bridge note: "This is like that because..."
- The bridge note has a minimum length (50 characters) to prevent lazy linking
- Bridges are bidirectional and visible from both ends

**Bridge Visualization:**
- A "Constellation View" shows all projects as nodes and all bridges as lines
- Line thickness represents bridge strength (how often the user has revisited or reinforced the connection)
- Color-coding by bridge age: fresh (green), established (blue), dormant (gray)
- Clicking a line reveals the bridge note

**Bridge Surfacing:**
- When viewing a project, Tinker shows a "Related Concepts" sidebar listing all bridges *out* from that project
- When creating new content, Tinker suggests (purely based on existing bridges) that the user check connected projects — no AI, just graph traversal

**Bridge Decay:**
- Bridges fade if not revisited. The user receives a gentle prompt: "You once connected 'tension in joinery' to 'tension in string theory.' Still true?"
- This forces periodic reinforcement or intentional deletion of stale connections

**Why This Works:**
- The user is the polymath engine. The tool just preserves their insight
- Human-drawn connections are meaningful because they are intentional and articulated
- Bridge decay prevents the graph from becoming an unmaintainable mess

---

### 4.6 The Reference Locker

**Concept:** A dedicated space for raw materials — books, videos, articles, courses — that are not yet attached to a project.

**Implementation:**
- Items in the locker have a "stale date" (default: 14 days)
- If not attached to a project and given a "why this matters" note within 14 days, the item is archived (not deleted — retrievable, but out of sight)
- Locker items can be browsed by source type (book, video, article, course) and date added
- A "rescue" feature allows one-click promotion to a project

**Why This Works:**
- Prevents hoarding. The 14-day deadline forces decision-making
- Archived items are searchable, so nothing is truly lost
- Creates a natural filter: if it wasn't important enough to attach to a project, it probably wasn't important

---

## 5. USER FLOWS

### 5.1 Onboarding Flow

1. **Welcome:** "Tinker is a workshop, not a library. You learn by building things here."
2. **Shop Creation:** User names their first shop (e.g., "Wood Shop," "Code Lab")
3. **First Project:** User creates their first project with a simple template:
   - What are you trying to build/learn?
   - What do you already know?
   - What's your first step?
4. **First Entry:** User is prompted to document their first attempt, even if it's just planning
5. **Workbench Tour:** Brief interactive tutorial showing pan, zoom, and content creation

**Time to First Value:** < 3 minutes

---

### 5.2 Daily Use Flow

1. **Open Tinker:** Lands on Workbench View, camera position restored
2. **Select Project:** Click a workbench to enter project view
3. **Document Attempt:** Create an "Attempt" entry with photo/video
4. **Tag Failure (if applicable):** Scar tagging takes < 10 seconds
5. **Save Reference (if applicable):** Paste link, write "why this matters"
6. **Draw Bridge (if insight strikes):** Connect to another project
7. **Close:** Camera position saved, next session resumes here

**Target Session Length:** 2–5 minutes per project update

---

### 5.3 Weekly Review Flow

1. **Scar Map Check:** Review failure patterns from the week
2. **Bridge Reinforcement:** Review fading bridges, reinforce or delete
3. **Mastery Audit:** Check skills approaching 30-day review
4. **Locker Cleanup:** Rescue or archive stale references
5. **Shop Reorganization:** Move workbenches, split overgrown projects

**Target Session Length:** 15–20 minutes

---

## 6. TECHNICAL ARCHITECTURE

### 6.1 Platform Strategy

**Primary:** Desktop (macOS, Windows, Linux) — builders work at benches, not on phones
**Secondary:** Tablet (iPad, Android) — for shop-floor documentation with camera
**Tertiary:** Web — for reference saving and lightweight review
**Excluded:** Phone — too small for workbench view, too distracting for deep work

### 6.2 Data Model

```
User
├── Shops[]
│   ├── name
│   ├── background_texture
│   └── workbenches[]
│       ├── name
│       ├── position (x, y, z)
│       ├── size (width, height)
│       ├── created_at
│       ├── last_opened
│       └── items[]
│           ├── type (observation, reference, attempt, question, breakthrough)
│           ├── content
│           ├── media[] (photo, video, file)
│           ├── position_on_bench (x, y)
│           ├── created_at
│           └── scars[] (for attempts)
│               ├── type
│               ├── severity
│               └── cost
│       └── skills[]
│           ├── name
│           ├── status (exposed, attempted, practiced, owned)
│           ├── evidence[]
│           └── bridges[] (to other skills)
├── Bridges[]
│   ├── source_item_id
│   ├── target_item_id
│   ├── note
│   ├── strength (1-5)
│   ├── created_at
│   └── last_reinforced
├── ScarMap
│   └── aggregated failure data
└── ReferenceLocker
    └── items[] with stale_date
```

### 6.3 Data Philosophy

**Local-First, User-Owned:**
- All data stored locally in SQLite
- No account required, no cloud dependency, no data collection
- Full JSON export at any time
- Optional sync via user-controlled methods:
  - File-based sync (Dropbox, iCloud, Syncthing)
  - Self-hosted sync server (optional, open-source)
  - Manual export/import for offline transfer

**Privacy by Design:**
- No telemetry, no analytics, no crash reporting without explicit opt-in
- No server infrastructure operated by the project
- Community features operate peer-to-peer or via self-hosted directories

### 6.4 Performance Targets

- Workbench View: 60fps pan/zoom with 50+ workbenches
- Project View: < 100ms load time for 200+ items
- Media: Lazy loading with local thumbnail generation
- Search: < 500ms across all content
- App launch: < 2 seconds cold start

---

## 7. DESIGN PRINCIPLES

### 7.1 Physical Honesty
- Elements feel like real objects: weight, texture, shadow
- No glassmorphism, no neon gradients
- Color palette derived from workshop materials: steel gray, pine yellow, oak brown, chalk white

### 7.2 Friction as a Feature
- Mandatory fields prevent lazy capture
- Bench size limits force project discipline
- 30-day challenges prevent false mastery
- Locker stale dates prevent hoarding

### 7.3 User Intelligence, Tool Memory
- The user thinks. The tool remembers.
- No suggestions, no recommendations, no "smart" features
- The tool is a faithful external memory, not an assistant

### 7.4 Messy is Okay
- Workbenches can be cluttered. Clutter is honest.
- No auto-cleanup, no "inbox zero" pressure
- Dust levels are gentle nudges, not guilt trips

### 7.5 Free Software Ethics
- No dark patterns to drive conversion (there is no conversion)
- No artificial limits on features
- No data lock-in
- Community contributions welcomed and credited

---

## 8. OPEN SOURCE MODEL

### 8.1 License
- **Code:** MIT License — free to use, modify, distribute
- **Documentation:** CC BY-SA 4.0
- **Brand:** "Tinker" name and logo trademarked to prevent proprietary forks from confusing users

### 8.2 Governance
- **Benevolent Dictator Model** initially (founder maintains direction)
- Transition to **Technical Steering Committee** after 1,000 active users or 2 years
- All feature decisions documented in public GitHub discussions
- Major changes require community RFC (Request for Comments) process

### 8.3 Contribution Model
- **Code:** Pull requests welcome; all reviewed by core team
- **Design:** Community Figma file; design decisions made via RFC
- **Documentation:** Wiki-style docs; anyone can propose edits
- **Localization:** Community-driven translation via Crowdin or similar

### 8.4 Sustainability (No Monetization)

**Funding Sources (Optional, Transparent):**
- **GitHub Sponsors:** Voluntary donations from users who want to support development
- **Grants:** Applications to open-source foundations (Mozilla, Sloan, etc.)
- **Consulting:** Core team offers paid customization for institutions (maker spaces, bootcamps) — all customizations contributed back to main codebase
- **Merchandise:** Optional stickers, posters, workshop aprons — proceeds fund development

**Transparency:**
- Monthly public financial report
- All expenses documented (hosting for website/docs, CI/CD, design tools)
- No salaries until sustainable; team works voluntarily or on grants

---

## 9. GO-TO-MARKET

### 9.1 Phase 1: Alpha (Months 1-3)
- 100 hand-selected makers across 5 domains (woodworking, coding, electronics, cooking, music)
- Discord community for feedback
- Focus: Workbench View stability and scar tagging usability
- **Recruitment:** Direct outreach to YouTube makers, Reddit communities, local maker spaces

### 9.2 Phase 2: Beta (Months 4-6)
- Open beta via Product Hunt, Hacker News, Reddit (r/woodworking, r/electronics, etc.)
- Focus: Cross-pollination bridges and mastery markers
- **Content:** "Build in Public" case studies showing real user workbenches

### 9.3 Phase 3: Public Release (Month 7)
- v1.0 release on GitHub with binaries for all platforms
- Partnerships: YouTube makers, Skillshare instructors, maker spaces
- **Launch Event:** 24-hour livestream of makers using Tinker in real time

### 9.4 Key Metrics
- **Activation:** Created first project + first attempt within 7 days
- **Retention:** Weekly scar map check (habit formation)
- **Engagement:** Average bridges per user > 5 after 30 days
- **Community:** Active Discord members, GitHub stars, pull request volume

---

## 10. COMPETITIVE LANDSCAPE

| Tool | Strength | Tinker's Differentiation |
|------|----------|--------------------------|
| Notion | Flexible databases | Tinker is project-embedded, not subject-organized |
| Obsidian | Linking and graph view | Tinker's graph is human-drawn analogies, not auto-links |
| Capacities | Object-based PKM | Tinker requires evidence, not just capture |
| RemNote | Spaced repetition | Tinker's repetition is action-based, not flashcard-based |
| Bear / Apple Notes | Simplicity | Tinker is spatial and physical, not list-based |
| Day One | Journaling | Tinker is project-driven, not date-driven |

**No direct competitor** offers the combination of: project-embedded learning + failure archaeology + evidence-based mastery + human-drawn cross-pollination.

---

## 11. RISKS AND MITIGATIONS

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Users find friction too high | Medium | High | Onboarding emphasizes long-term value; optional "relaxed mode" reduces mandatory fields |
| Workbench view becomes cluttered | High | Medium | Bench size limits; "archive completed projects" feature; dust levels as gentle nudges |
| Mobile absence limits adoption | Medium | Medium | Tablet app for shop-floor use; web clipper for reference saving |
| Open-source sustainability | Medium | High | Transparent funding; grants; institutional consulting; merchandise |
| Makers prefer physical notebooks | High | Medium | Position as "digital supplement" not replacement; printable workbench exports |
| Fork fragmentation | Low | Medium | Strong brand identity; trademark on name; clear governance roadmap |

---

## 12. FUTURE CONSIDERATIONS (Post-v1.0)

- **Plugin API:** Allow domain-specific extensions (e.g., electronics schematic viewer, code execution sandbox)
- **Hardware Integration:** Bluetooth scale for material weight, camera trigger for hands-free documentation
- **Collaborative Benches:** Multi-user workbenches for team projects (e.g., hackathons, build competitions)
- **Mobile Companion:** Minimal phone app for quick photo capture and voice memos (syncs to desktop)
- **Print Export:** Physical workbench layouts for those who want a hybrid digital/physical workflow

---

## 13. APPENDIX

### 13.1 Glossary
- **Workbench:** A project's workspace. A physical surface for organizing learning artifacts.
- **Scar:** A documented failure with categorized cause and severity.
- **Bridge:** A user-drawn connection between concepts across projects.
- **Shop:** A collection of related workbenches (e.g., "Wood Shop").
- **Mastery Marker:** Evidence of applied skill, required to advance skill status.
- **Dust Level:** Visual fading of inactive workbenches as a gentle engagement nudge.
- **Reference Locker:** Staging area for unprocessed materials with automatic stale-date archiving.

### 13.2 Open Questions
1. Should failed attempts be visually distinct (red border) or normalized (same as successes)?
2. What is the optimal bench size limit? (Candidate: 50 items)
3. Should bridges decay automatically, or only on user prompt?
4. How to handle video evidence storage efficiently?
5. What is the right stale date for the Reference Locker? (Candidate: 14 days)
6. Should the app include a "beginner mode" with reduced friction for first-time users?
7. What is the best peer-to-peer sharing protocol for community scars?

### 13.3 Free Software Commitment

Tinker is built on the belief that tools for learning should be:
- **Accessible:** No paywalls, no feature gates, no artificial scarcity
- **Transparent:** Open source, open governance, open finances
- **Respectful:** No data collection, no surveillance, no dark patterns
- **Sustainable:** Funded by the community it serves, not by extracting value from it

The goal is not to build a unicorn. The goal is to build a **public good** — a tool that makes self-directed, hands-on learning more effective, more reflective, and more joyful for anyone who wants to use it.

---

**Document Owner:** Product Team  
**Next Review Date:** May 22, 2026  
**Distribution:** Public (Open Source)
