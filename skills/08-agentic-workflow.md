# SKILL: Tinker Agentic Workflow & Prompting Patterns

## Philosophy
The agent works best with clear, bounded tasks. Each task has a single deliverable, explicit acceptance criteria, and minimal context switching.

## Task Granularity
Break work into tasks that fit in ONE agent session (15-30 min):

| Too Big | Just Right | Too Small |
|---------|-----------|-----------|
| "Build the entire app" | "Implement shops DAO with all CRUD" | "Create shops table" |
| "Implement canvas" | "Implement WorkbenchCanvas with pan/zoom" | "Add onWheel handler" |
| "Write all tests" | "Write unit tests for shops DAO" | "Test createShop function" |

## Prompt Template
```
## Task: [Brief description]

### Context
[Which skill files apply? Which PRD section?]

### Requirements
[What must be implemented?]

### Files to Create/Modify
[List exact file paths]

### Acceptance Criteria
[How do we know it's done?]

### Constraints
[What must NOT be done?]
```

## Example Prompts

### Prompt: Scaffold
```
## Task: Initialize Tinker project scaffold

### Context
Follow SKILL: 01-architecture.md and 05-ipc-electron.md

### Requirements
Set up the complete Electron + Vite + React + TypeScript project:
1. Create directory structure as specified in PRD Section 2
2. Initialize package.json with all dependencies pinned to exact versions
3. Create three Vite configs (main, preload, renderer)
4. Set up TypeScript strict mode and path aliases
5. Create electron/main.ts, electron/preload.ts, electron/ipc/channels.ts
6. Set up Tailwind CSS with workshop color palette
7. Create src/main.tsx with basic React app rendering "Tinker"
8. Ensure npm install and npm run dev work

### Files to Create
- package.json, vite.main.config.ts, vite.preload.config.ts, vite.renderer.config.ts
- tsconfig.json, tailwind.config.ts, index.html
- electron/main.ts, electron/preload.ts, electron/ipc/channels.ts, electron/ipc/types.ts
- src/main.tsx, src/App.tsx, src/index.css

### Acceptance Criteria
- [ ] npm install completes without errors
- [ ] npm run dev launches Electron window showing "Tinker"
- [ ] No console errors
- [ ] TypeScript strict mode enabled
- [ ] Path alias @/ resolves correctly

### Constraints
- Do NOT write application logic, DAOs, or components yet
- Do NOT create database schema yet
- Use exact versions from PRD tech stack
```

### Prompt: Database Schema
```
## Task: Implement complete database schema

### Context
Follow SKILL: 02-database.md. Schema defined in PRD Section 3.

### Requirements
Write src/db/schema.ts with ALL 11 tables: shops, workbenches, items, itemMedia, scars, skills, bridges, skillBridges, lockerItems, cameraStates, appSettings.

Each table must have proper column types, primary key (nanoid text), timestamps, foreign keys with cascade deletes, relations, and indexes.

Also create src/db/index.ts, src/types/index.ts, src/utils/id.ts, src/utils/constants.ts, src/utils/validators.ts.

### Files to Create
- src/db/schema.ts, src/db/index.ts, src/types/index.ts
- src/utils/id.ts, src/utils/constants.ts, src/utils/validators.ts

### Acceptance Criteria
- [ ] All 11 tables defined with correct types
- [ ] Relations connect all foreign keys
- [ ] Types generated correctly from schema
- [ ] Validators enforce all constraints
- [ ] Database initializes without errors

### Constraints
- Do NOT write DAOs or components yet
- Use Drizzle ORM patterns from SKILL 02
- All enums must be const arrays
```

### Prompt: DAOs
```
## Task: Implement all Data Access Objects

### Context
Follow SKILL: 02-database.md DAO pattern. Schema is complete.

### Requirements
Implement all DAO files in src/data/: shops.ts (5), workbenches.ts (8), items.ts (8), scars.ts (6), skills.ts (8), bridges.ts (7), locker.ts (7), scarMap.ts (4), camera.ts (3).

Each DAO must import from @/db and @/db/schema, use type-safe Drizzle queries, handle errors, return typed promises.

Also create src/lib/electron.ts (IPC wrapper).

### Acceptance Criteria
- [ ] All functions compile without TS errors
- [ ] All functions use correct query keys
- [ ] All functions handle edge cases
- [ ] No raw SQL strings

### Constraints
- Do NOT write hooks or components yet
- Do NOT use any in types
```

### Prompt: React Query Hooks
```
## Task: Implement all TanStack Query hooks

### Context
Follow SKILL: 04-state-management.md. DAOs are complete.

### Requirements
Implement all hooks in src/hooks/: useShops, useWorkbenches, useItems, useScars, useSkills, useBridges, useLocker, useCamera, useExport, useMedia.

Also create src/hooks/queryKeys.ts.

Each hook must use centralized query keys, invalidate correct queries on mutation, handle loading/error states.

### Acceptance Criteria
- [ ] All hooks compile without errors
- [ ] Query keys follow strict hierarchy
- [ ] Mutations invalidate correct queries
- [ ] TypeScript infers correct return types

### Constraints
- Do NOT write Zustand stores or components yet
- Use exact patterns from SKILL 04
```

### Prompt: Zustand Stores
```
## Task: Implement all Zustand stores

### Context
Follow SKILL: 04-state-management.md.

### Requirements
Implement three stores: uiStore.ts (navigation, modals, search), canvasStore.ts (camera, pan, zoom), editorStore.ts (drafts).

All stores must use devtools middleware, have atomic selectors, be typed.

### Acceptance Criteria
- [ ] All stores compile without errors
- [ ] Devtools middleware enabled
- [ ] Selectors are atomic
- [ ] Actions update state correctly

### Constraints
- Do NOT write components yet
- No server state in stores
```

### Prompt: Workbench Canvas
```
## Task: Implement the spatial workbench canvas

### Context
Follow SKILL: 06-canvas-spatial.md. Hooks and stores are ready.

### Requirements
Implement canvas components: WorkbenchCanvas.tsx (Stage with pan/zoom), WorkbenchLayer.tsx, WorkbenchCard.tsx (draggable, dust overlay), BackgroundLayer.tsx (tiled textures), and canvasMath.ts.

### Acceptance Criteria
- [ ] Canvas fills viewport
- [ ] Pan and zoom work smoothly (60fps)
- [ ] Workbenches render correctly
- [ ] Dragging updates position in DB
- [ ] Dust overlay visible on inactive benches
- [ ] Background texture tiles correctly

### Constraints
- Use React.memo on ALL Konva components
- Use useCallback for ALL event handlers
- Debounce DB saves (500ms)
```

### Prompt: Project View
```
## Task: Implement project view and item management

### Context
Follow SKILL: 03-react-components.md.

### Requirements
Implement: ProjectView.tsx, ItemGrid.tsx, ItemCard.tsx, ItemCreator.tsx (RHF + Zod), SkillPanel.tsx, ScarTagger.tsx, MediaUploader.tsx, WhyThisMatters.tsx, TypeBadge.tsx.

### Acceptance Criteria
- [ ] Can create all 5 item types
- [ ] Reference requires WhyThisMatters
- [ ] Attempt shows scar indicator
- [ ] Media uploads save to disk
- [ ] Skills show correct status
- [ ] Form validation works

### Constraints
- Use Tailwind classes only
- All forms use React Hook Form + Zod
- All buttons have data-testid for E2E
```

## Agent Workflow

### 1. Pre-Flight Check
Before each task, the agent should:
1. Read relevant SKILL files
2. Check existing code for patterns
3. Verify types are available
4. Confirm dependencies installed

### 2. Implementation
1. Write types first
2. Write tests second (TDD where possible)
3. Write implementation third
4. Run tests and fix failures
5. Run TypeScript check and fix errors

### 3. Post-Flight Check
After each task:
1. Run npm run typecheck — must pass
2. Run npm run lint — must pass
3. Run npm run test — must pass
4. Run npm run build — must pass
5. Commit with descriptive message

### 4. Handoff
When complete, agent should:
1. Summarize what was implemented
2. List files created/modified
3. Note any deviations from spec
4. Identify next logical task

## Common Agent Mistakes to Avoid

| Mistake | Prevention |
|---------|-----------|
| Using `any` type | Enable strict mode, use Zod inference |
| Mixing server/UI state | Follow state ownership matrix |
| Raw SQL in components | Route through DAOs only |
| Inline styles | Use Tailwind utility classes |
| Unmemoized Konva props | Use React.memo + useCallback |
| Missing error handling | Wrap all async calls in try/catch |
| Hardcoded strings | Use constants file |
| Missing data-testid | Add to all interactive elements |
| Forgetting to invalidate queries | Check mutation onSuccess handlers |
| Direct DB access in renderer | Use IPC only |

## Git Commit Messages
```
feat: add workbench canvas with pan/zoom
feat: implement scar tagging UI
fix: correct dust level calculation
refactor: extract canvas math utilities
test: add unit tests for shops DAO
docs: update component patterns in skills
```

## No-Go List
- ❌ No task that takes >30 minutes of agent time
- ❌ No implementation without corresponding tests
- ❌ No commits with failing tests
- ❌ No manual testing only — automate everything
- ❌ No "I'll fix it later" — fix it now
