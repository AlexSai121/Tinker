# TINKER — Agentic Skills Index

## Overview
This directory contains 8 skill files that define the complete technical specification for building Tinker. Feed these to your agentic coding tool (Claude Code, Cursor, etc.) before starting implementation.

## Skill Files

| # | File | Topic | Size | Purpose |
|---|------|-------|------|---------|
| 1 | `01-architecture.md` | Architecture | 5,077 chars | Technical spec for architecture |
| 2 | `02-database.md` | Database | 7,329 chars | Technical spec for database |
| 3 | `03-react-components.md` | React | 12,665 chars | Technical spec for react |
| 4 | `04-state-management.md` | State | 11,486 chars | Technical spec for state |
| 5 | `05-ipc-electron.md` | Ipc | 10,884 chars | Technical spec for ipc |
| 6 | `06-canvas-spatial.md` | Canvas | 10,467 chars | Technical spec for canvas |
| 7 | `07-testing.md` | Testing | 9,142 chars | Technical spec for testing |
| 8 | `08-agentic-workflow.md` | Agentic | 8,899 chars | Technical spec for agentic |

## Total Package Size: 75,949 characters

## Usage

### Option A: Feed All Skills (Recommended for new sessions)
```
Read all files in /skills/ directory. These define the complete technical 
specification for Tinker, a local-first Electron desktop app for makers.
Before writing any code, understand these patterns:
1. Architecture & Conventions (01)
2. Database & Drizzle ORM (02)
3. React Component Patterns (03)
4. State Management (04)
5. IPC & Electron Main Process (05)
6. Canvas & Spatial UI (06)
7. Testing & Quality (07)
8. Agentic Workflow (08)
```

### Option B: Feed Per-Task Skills
| Task | Required Skills |
|------|----------------|
| Project scaffold | 01, 05 |
| Database schema | 01, 02 |
| DAOs | 01, 02 |
| Hooks | 01, 02, 04 |
| Stores | 01, 04 |
| Canvas | 01, 03, 06 |
| Components | 01, 03 |
| IPC handlers | 01, 05 |
| Testing | 01, 07 |
| Full build | ALL |

### Option C: Reference During Review
```
Check this implementation against SKILL 03 (React Components):
- Are all components memoized where required?
- Are event handlers useCallback'd?
- Are Tailwind classes following the workshop palette?
```

## Skill Dependencies
```
01-architecture (foundational)
├── 02-database
│   ├── 04-state-management
│   └── 07-testing
├── 03-react-components
│   ├── 06-canvas-spatial
│   └── 07-testing
├── 05-ipc-electron
│   └── 01-architecture
└── 08-agentic-workflow (meta)
```

## Key Principles (Repeated Across All Skills)
1. **Local-first** — No cloud, no accounts, no telemetry
2. **No AI** — No ML, no suggestions, no auto-tagging
3. **Free software** — MIT license, open source
4. **Type safety** — Strict TypeScript, Zod validation
5. **Test coverage** — Unit tests for DAOs, E2E for flows
6. **Performance** — 60fps canvas, <100ms queries
