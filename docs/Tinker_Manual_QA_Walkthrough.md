# Tinker User Walkthrough and Manual QA Guide

This document does two jobs at once:

1. It introduces Tinker to someone using it for the first time.
2. It doubles as the human regression pass for the currently shipped app surface.

Use it when onboarding a new user, preparing a release candidate, or checking that a new feature wave did not break the core experience.

## What Tinker Is

Tinker is a local-first digital workshop for people who learn by making things. Instead of keeping projects in one place and notes in another, Tinker keeps the learning inside the project itself.

At a high level:
- A **workshop** is a space for a domain, practice area, or body of work.
- A **project** is a single build, experiment, or problem you are working through.
- A **project workbench** is the freeform surface where you place observations, references, attempts, questions, breakthroughs, media, and sticky notes.
- A **scar** is a structured record of failure, friction, or cost from an attempt.
- A **bridge** is a human-made connection between ideas across projects.
- A **skill** is something you are learning and must prove with evidence.
- The **dashboards** help you review patterns across projects, not just inside one of them.

## Why Someone Would Use Tinker

Use Tinker when the work itself is the source of learning:
- You are prototyping, building, repairing, experimenting, or researching.
- You want your notes attached to real attempts, not buried in a separate notebook.
- You want to track failure patterns, not just wins.
- You want to prove skill growth with artifacts such as photos, video, or files.
- You want to preserve the connections you notice between different projects and disciplines.

Tinker is especially useful for self-taught makers, indie builders, technical hobbyists, and multidisciplinary learners who move between physical and digital work.

## When To Open Tinker

Tinker is most valuable in these moments:
- **Before starting a project**: capture the problem, references, and questions.
- **During the work**: log attempts, dead ends, media evidence, and quick observations.
- **Right after a failure or surprise**: tag a scar while the details are still fresh.
- **When a pattern clicks**: create a bridge or breakthrough before the insight fades.
- **At the end of the week**: review what failed, what changed, what skills are due, and what deserves follow-up.

## What A First-Time User Should Expect

Tinker is not a generic notes app. It is built around active project work.

The usual rhythm looks like this:
1. Create a workshop for an area of practice.
2. Add one or more projects to that workshop.
3. Open a project and work on its bench.
4. Add observations, references, attempts, questions, and breakthroughs as the work evolves.
5. Attach photos, video, and files as evidence.
6. Tag failures as scars and connect related ideas with bridges.
7. Review patterns across all of that work in the dashboards.

## Example First-Time Journey

Example: someone learning electronics repair could use Tinker like this:
- Create a workshop called `Bench Repair`.
- Add a project called `Fix dead guitar pedal`.
- Drop in a reference link for the circuit diagram.
- Add an attempt item describing a capacitor swap that did not solve the issue.
- Tag the attempt with a scar such as `misdiagnosis` or `rushed test sequence`.
- Upload a photo of the board and a short video of the new symptom.
- Add a breakthrough when the actual fault is found.
- Create a bridge to another project where the same power issue appeared.
- Mark a skill such as `signal tracing` as practiced only after uploading evidence.

## How To Use This Document

Read each section in two passes:
- First, use the short intro under the section heading to understand what that part of Tinker is for.
- Then walk through the table row by row and record behavior in the `Notes / Bugs` column.

Target platforms:
- Primary target: desktop app flow.
- Secondary target: tablet layout spot check.

Issue severity:
- `Blocker`: core flow broken or data loss risk
- `High`: major workflow damage, confusing state, or broken persistence
- `Medium`: feature works with friction or visual or interaction bugs
- `Low`: polish issue only

## Test Data Setup

Start from a clean local state if possible.

Create at least:
- 2 workshops
- 3 projects
- 1 attempt item with a scar
- 1 reference item
- 1 breakthrough with media
- 1 locker item
- 1 bridge across projects
- 1 skill that has evidence attached

---

## A. Shell, Startup, and Persistence

**What this part does**

This is the app frame around every workflow: navigation, search, modals, saved state, and the small behaviors that make the app feel dependable.

**Why it matters**

If shell behavior is unreliable, every other feature feels fragile even when the deeper data model is sound.

**When users rely on it**

Every session. This is what makes Tinker feel like a stable workshop rather than a temporary scratchpad.

**Example scenario**

A user closes Tinker in the middle of a project, reopens it the next day, and expects to land back in the same workshop or project with their context still intact.

### A1. Clean launch
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Launch the app from a clean state. | App shell loads without console-visible crashes or broken layout. | |
| Observe first screen. | Toolbar, sidebar, main content, and status bar all render. | |
| Do not interact for a few seconds. | No flicker, modal flashes, or loading loop remains onscreen. | |

### A2. Sidebar and toolbar behavior
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Toggle the sidebar closed and open. | Sidebar animates cleanly and main content remains usable. | |
| Switch between all top-level views in the toolbar. | Each view opens without stale content from the previous view. | |
| Use the global search input and then clear it. | Search results open correctly and clearing returns you to the prior app flow. | |

### A3. Modal behavior
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Open each available modal from its normal entry point. | Modal opens centered, overlay appears, and background is not interactable. | |
| Close each modal by button, overlay click, and `Esc`. | Modal closes cleanly every time. | |
| Open a second modal from inside settings or another workflow if supported. | Modal stack behaves correctly and returns to the right place after close. | |

### A4. Persistence across reload / reopen
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Open a workshop canvas, then reload or relaunch. | Last active workshop returns. | |
| Open a project workbench, then reload or relaunch. | Last active project view returns. | |
| Pan/zoom the workshop canvas, then reload or relaunch. | Camera position restores for that workshop. | |
| Change settings, then reload or relaunch. | Settings remain saved. | |
| Verify recently created data after reload. | Workshops, projects, items, locker entries, and skills are still present. | |

### A5. Keyboard shortcuts
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Press `/` or `Ctrl/Cmd+K`. | Search field receives focus. | |
| Press `Shift+N`. | Creates workshop if none selected, otherwise opens create-project flow for active workshop. | |
| Press `Ctrl/Cmd+B`. | Sidebar toggles. | |
| Press `Esc` while a modal is open. | Modal closes first. | |
| Press `Esc` while search is active. | Search clears. | |
| Press `Esc` in project view with an item selected. | Item selection clears before leaving the project. | |
| Press `Esc` again in project view. | Returns to workshop canvas. | |

---

## B. Workshop Canvas and Project Creation

**What this part does**

The workshop canvas is the high-level spatial map of a user's work. It holds projects and gives each practice area a visible home.

**Why it matters**

This is how users organize multiple builds without losing the sense that those builds belong to a larger body of work.

**When users rely on it**

At the start of a new project, when switching between active projects, or when reviewing everything happening inside one workshop.

**Example scenarios**

- A woodworker creates one workshop for `Furniture` and another for `Jigs and Repairs`.
- A developer creates projects like `CLI tool`, `Portfolio site`, and `Game prototype` inside the same software workshop.

### B1. Workshop creation
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Create a new workshop from the sidebar. | Workshop appears immediately in sidebar list. | |
| Open the workshop from the sidebar. | Workbench canvas loads for that workshop. | |

### B2. Project creation from sidebar
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Create a project from a workshop row in the sidebar. | Create Project modal opens with correct workshop context. | |
| Fill valid name, description, and template questions. | Submission succeeds without validation errors. | |
| Create the project with `openProjectOnCreate` enabled. | App opens directly into the new project. | |
| Disable `openProjectOnCreate` in settings, then create another project. | App stays on the workshop canvas after creation. | |

### B3. Canvas interactions
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Pan the workbench canvas. | Canvas moves smoothly. | |
| Zoom in and out with wheel or controls. | Zoom changes and reset returns to default. | |
| Double-click empty canvas space. | Create Project modal opens at the clicked location. | |
| Click a project card on canvas. | Project opens. | |
| Return to canvas with the back button. | Previous workshop canvas reappears. | |
| Leave a workshop inactive if dust overlay is enabled. | Dust/age visual behavior matches settings. | |

### B4. Sidebar project selection
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Open a project from sidebar. | Correct project opens. | |
| Switch between two projects from sidebar. | Active state updates correctly and no stale selection persists. | |
| Check recent items list after creating new items. | Recent items update and navigate to the correct project when clicked. | |

---

## C. Project Workbench and Core Item Flows

**What this part does**

The project workbench is the core of Tinker. It is the place where users think inside the project itself by placing notes, evidence, and attempts on a freeform bench.

**Why it matters**

This is the feature that makes Tinker different from a conventional notes tool. The workbench keeps thinking tied to actual making.

**When users rely on it**

While actively building, researching, testing, documenting, and capturing in-progress work.

**What each item type is for**

- `Observation`: something you noticed and want to preserve.
- `Reference`: outside material that matters to this project and why it matters.
- `Attempt`: something you tried, what happened, and what it cost or taught you.
- `Question`: an unresolved idea or uncertainty worth tracking.
- `Breakthrough`: a meaningful insight or success, usually backed by media or proof.
- `Sticky note`: fast, lightweight scratch thinking on the bench itself.

**Example scenarios**

- `Observation`: "Motor runs hot after 20 minutes under load."
- `Reference`: a video on dovetail jig setup with a note about why its alignment trick matters.
- `Attempt`: "Changed debounce timing from 20 ms to 60 ms; reduced false triggers but added lag."
- `Question`: "Is the noise coming from grounding or shielding?"
- `Breakthrough`: a photo of the repaired assembly plus a note explaining the fix.
- `Sticky note`: a temporary reminder to test the alternate bracket size.

### C1. Project playground shell
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Open a project with no items. | Empty state renders clearly. | |
| Open a project with many items. | Playground loads without overlapping or unusable controls. | |
| Click a card on the playground. | Selection state is visually obvious. | |
| Click empty surface. | Selection clears. | |

### C2. Create each item type
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Create an observation item. | Item appears on bench. | |
| Create a reference item with source URL and why-this-matters note. | Item appears with reference details shown. | |
| Create an attempt item with what/result/tools. | Item appears with attempt details shown. | |
| Create a question item. | Item appears with question content. | |
| Create a breakthrough item with required media. | Item appears only when media requirement is satisfied. | |

### C3. Validation rules
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Submit an item with empty content where content is required. | Inline validation prevents submission. | |
| Submit a reference without a long enough why-this-matters note. | Validation error appears. | |
| Submit an attempt without both `what you tried` and `result`. | Validation error appears. | |
| Submit a breakthrough without media. | Validation error appears. | |

### C4. Media and quick capture
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Use quick capture uploader in the project tool area. | Observation with media is created automatically. | |
| Use normal uploader for a reference or breakthrough. | Media is attached to the created item. | |
| Drag a supported file onto the playground. | New media-backed item appears near drop point. | |
| Preview a media-backed item. | Media preview modal opens correctly. | |
| Open attached evidence externally from preview modal. | System or browser handler opens the file. | |

### C5. Sticky notes and spatial persistence
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Double-click empty space on the playground. | Sticky note appears near click location. | |
| Type text into sticky note and blur focus. | Text auto-saves. | |
| Drag sticky note to a new position. | Position changes smoothly. | |
| Reload or relaunch while in the same project. | Sticky note and position persist. | |

### C6. General card repositioning
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Drag a plain text item to a new position. | Position changes and selection state remains sensible. | |
| Drag a media-backed item to a new position. | Position changes without accidental preview/open. | |
| Reload after moving multiple cards. | Card positions persist. | |

### C7. Item rendering checks
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Compare a plain item, media-backed item, and sticky note. | Visual treatment is distinct and consistent. | |
| Select each item type and inspect selection panel. | Correct actions appear for the selected content. | |

---

## D. Failure, Bridge, and Skill Flows

**What this part does**

These features turn raw project notes into long-term learning. Scars capture failure patterns, bridges capture cross-project insight, and skills track proven growth.

**Why it matters**

Without this layer, users only store project records. With it, Tinker becomes a system for reflection, pattern recognition, and evidence-based mastery.

**When users rely on it**

After an attempt fails, when a connection appears between two projects, or when a user wants to verify that they truly learned a repeatable skill.

**Example scenarios**

- `Scar`: "Ruined a print by changing too many slicer settings at once."
- `Bridge`: connect a jig-building lesson from woodworking to fixture design in 3D printing.
- `Skill`: move `surface soldering` from exposed to practiced after uploading a close-up repair photo and notes.

### D1. Scar tagging
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Create an attempt and add a scar. | Scar saves and indicator appears on the item. | |
| Add notes and severity/failure type values. | Correct values persist after reload. | |
| Open Scar Map afterward. | New scar data appears in the dashboard. | |

### D2. Bridge creation
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Start bridge creation from an item. | Bridge modal opens with correct source item. | |
| Search for cross-project target items. | Search results only show eligible items from other projects. | |
| Try to submit with a short note. | Validation blocks submission. | |
| Submit a valid bridge. | Bridge is created and appears in Constellation. | |

### D3. Skill evidence and status transitions
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Add a skill from the project skill panel. | Skill appears in that project. | |
| Open skill evidence modal. | Current status and evidence load correctly. | |
| Move from `exposed` to `attempted`. | Transition succeeds with evidence note. | |
| Move from `attempted` to `practiced` with evidence file. | Transition succeeds and review scheduling is visible. | |
| Attempt `owned` before the review is due. | Transition is prevented. | |
| Complete the due path when the review is eligible. | Skill can become `owned`. | |

### D4. Portfolio reflection
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Open Skill Portfolio after skill updates. | Counts, cards, and due reminders reflect current data. | |
| Preview evidence from portfolio. | Preview modal opens correctly. | |

---

## E. Dashboard Walkthrough

**What this part does**

The dashboards zoom out from single-project work and help users notice patterns across all of Tinker.

**Why it matters**

People often remember their highlights and forget their repeated mistakes. The dashboards make long-term patterns visible.

**When users rely on it**

During weekly review, before starting a related project, or when deciding what skill or failure pattern deserves attention next.

**Example feature scenarios**

- `Scar Map`: find that rushed measurement checks are causing repeated avoidable mistakes.
- `Constellation`: see that three projects share the same problem-solving theme.
- `Skill Portfolio`: notice that a skill is nearly owned but still missing a review checkpoint.
- `Reference Locker`: save a useful source now and rescue it into a project later.
- `Weekly Review`: turn scattered project activity into a deliberate reflection pass.
- `Search`: jump straight to the one attempt, skill, or locker item you vaguely remember.

### E1. Scar Map
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Open Scar Map with existing scar data. | Summary cards and charts load. | |
| Change project, failure type, and date filters. | Dashboard updates correctly. | |
| Use an empty filter slice. | Empty state is clear and non-broken. | |
| Run scar export. | Downloaded file is produced. | |

### E2. Constellation
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Open Constellation with bridge data. | Graph loads with project nodes and bridge lines. | |
| Click a bridge. | Selected bridge details panel updates. | |
| Click a project node. | Correct project opens. | |
| Reinforce a bridge. | State updates and no broken selection remains. | |
| Review decay prompt cards. | Dormant bridge prompts match existing stale bridges. | |

### E3. Skill Portfolio
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Open Skill Portfolio. | Owned skills and review reminders load. | |
| Preview evidence from a skill card. | Preview modal opens. | |
| Export PDF. | PDF file is generated. | |

### E4. Reference Locker
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Save a locker reference from toolbar or locker view. | New locker item appears in active list. | |
| Search and filter locker items. | Results narrow correctly. | |
| Rescue a locker item to a project. | Rescue form validates and creates the linked reference item. | |
| Archive an active locker item. | Item moves to archived list. | |
| Restore an archived locker item. | Item returns to active list with a new stale window. | |

### E5. Weekly Review
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Open Weekly Review. | All five steps render. | |
| Step through each review section. | Content updates correctly and navigation buttons work. | |
| Use each `open related view` action. | Correct dashboard or canvas view opens. | |
| Complete the weekly review. | Review completion state updates and next due date changes. | |

### E6. Search Results
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Search for known item text. | Matching items appear. | |
| Search for known skill name. | Matching skills appear. | |
| Search for known locker reference. | Matching locker items appear. | |
| Open results from each section. | App navigates to correct destination and clears search when appropriate. | |

---

## F. Settings, Import / Export, and Platform Checks

**What this part does**

These features govern how Tinker behaves, how data moves in and out, and how the app adapts across desktop and tablet layouts.

**Why it matters**

Local-first tools live or die on trust. Users need confidence that their preferences stick, their exports are useful, and their data can be moved or restored safely.

**When users rely on it**

When personalizing the app, making backups, migrating data, checking browser-preview behavior, or confirming the app still works well on tablet.

**Example scenarios**

- Export a single workshop before sharing a focused snapshot with a collaborator.
- Replace a browser-preview dataset with a demo archive before a walkthrough.
- Change review day and stale thresholds to match a personal workflow cadence.

### F1. Settings
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Open Settings and inspect all sections. | Data, Appearance, Behavior, and About sections render correctly. | |
| Change theme, default texture, and behavior flags. | Values save and persist after reload. | |
| Change `openProjectOnCreate`. | New project behavior follows the setting. | |
| Change locker stale days / dust threshold / review day. | Values save without validation glitches. | |

### F2. Export
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Run full export. | Valid JSON file downloads. | |
| Run scoped single-workshop export. | Output contains only chosen workshop data. | |
| Apply date range filters during export. | Output reflects the selected date window. | |

### F3. Import (browser preview path)
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| In browser preview mode, run merge import with valid JSON. | Imported data merges into current state and counts update. | |
| Run replace import with valid JSON. | Workspace is replaced cleanly. | |
| Review import warnings message after media-heavy import. | Warnings are human-readable and accurate. | |

### F4. Tablet checks
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Open app in tablet layout. | Sidebar becomes overlay-style and remains usable. | |
| Open a project on tablet. | Touch sheet appears. | |
| Switch between Create and Skills tabs in the touch sheet. | Correct panel content appears. | |
| Expand/collapse the touch sheet and use touch navigation. | No trapped scroll or broken sheet state. | |

### F5. Large-data smoke pass
| Action | Expected Result | Notes / Bugs |
|---|---|---|
| Populate many workshops, projects, items, bridges, skills, and locker entries. | App remains responsive without major stalls. | |
| Open workshop canvas with many projects. | Pan/zoom still feels usable. | |
| Open a project with many items. | Playground remains navigable and cards remain operable. | |
| Open dashboards with larger data volume. | Views load without broken charts or obvious timing failures. | |

---

## Exit Criteria Before New Feature Wave
- No `Blocker` issues remain in shell, project playground, bridges, locker, settings/export, or persistence.
- No data-loss bug remains open.
- Desktop walkthrough passes end to end.
- Tablet spot check has no `Blocker` or `High` issue in navigation or project tools.
- Automated regression covers the project playground paths that changed most recently.
