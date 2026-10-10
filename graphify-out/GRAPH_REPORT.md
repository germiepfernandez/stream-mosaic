# Graph Report - workspace  (2026-10-10)

## Corpus Check
- 53 files · ~37,951 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 293 nodes · 531 edges · 24 communities (12 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `34d0405c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- types.ts
- package.json
- auth.ts
- use-viewer-state.ts
- cn
- components.json
- compilerOptions
- layout.tsx
- openspec-explore/SKILL.md
- opsx-explore.md
- devDependencies
- Stream Mosaic
- AGENTS.md
- { GET, POST }

## God Nodes (most connected - your core abstractions)
1. `cn()` - 29 edges
2. `compilerOptions` - 16 edges
3. `react` - 14 edges
4. `Button()` - 12 edges
5. `useViewerState()` - 12 edges
6. `ParsedMedia` - 12 edges
7. `getLayout()` - 11 edges
8. `ViewerCellView()` - 10 edges
9. `ViewerApp()` - 9 edges
10. `LayoutId` - 9 edges

## Surprising Connections (you probably didn't know these)
- `TooltipContent()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/tooltip.tsx → src/lib/utils.ts
- `GET()` --calls--> `twitchConfigured()`  [EXTRACTED]
  src/app/api/config/route.ts → src/lib/twitch.ts
- `Home()` --calls--> `ViewerApp()`  [EXTRACTED]
  src/app/page.tsx → src/components/viewer/viewer-app.tsx
- `TwitchPlayerProps` --references--> `ParsedMedia`  [EXTRACTED]
  src/components/players/twitch-player.tsx → src/lib/types.ts
- `RosterStrip()` --calls--> `Badge()`  [EXTRACTED]
  src/components/viewer/roster-strip.tsx → src/components/ui/badge.tsx

## Import Cycles
- None detected.

## Communities (24 total, 12 thin omitted)

### Community 0 - "types.ts"
Cohesion: 0.10
Nodes (39): lucide-react, react, Home(), loadTwitchApi(), TwitchPlayer(), TwitchPlayerInstance, TwitchPlayerProps, Window (+31 more)

### Community 1 - "package.json"
Cohesion: 0.05
Nodes (37): eslintConfig, dependencies, @base-ui/react, class-variance-authority, clsx, lucide-react, next, next-auth (+29 more)

### Community 2 - "auth.ts"
Cohesion: 0.09
Nodes (26): nextConfig, next, next-auth, GET(), GET(), POST(), POST(), GET() (+18 more)

### Community 3 - "use-viewer-state.ts"
Cohesion: 0.17
Nodes (26): GridStage(), GridStageProps, ToolbarProps, createCellPlaceholder(), ensureSizes(), resizeCellsToLayout(), useViewerState(), AUTO_EXPAND_ORDER (+18 more)

### Community 4 - "cn"
Cohesion: 0.17
Nodes (17): @base-ui/react, class-variance-authority, Badge(), badgeVariants, Button(), buttonVariants, DialogContent(), DialogDescription() (+9 more)

### Community 5 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "layout.tsx"
Cohesion: 0.21
Nodes (7): dmSans, jetbrains, metadata, RootLayout(), Providers(), TooltipContent(), TooltipProvider()

### Community 8 - "openspec-explore/SKILL.md"
Cohesion: 0.17
Nodes (11): Check for context, Ending Discovery, Guardrails, Handling Different Entry Points, OpenSpec Awareness, Planning a Change, The Stance, What You Don't Have To Do (+3 more)

### Community 9 - "opsx-explore.md"
Cohesion: 0.18
Nodes (10): Check for context, Ending Discovery, Guardrails, OpenSpec Awareness, Planning a Change, The Stance, What You Don't Have To Do, What You Might Do (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, @fission-ai/openspec, tailwindcss, @tailwindcss/turbopack, @types/node, @types/react (+2 more)

### Community 11 - "Stream Mosaic"
Cohesion: 0.20
Nodes (9): 1. AUTH_SECRET, 2. Twitch (live badges + import follows), 3. Google / YouTube (import subscriptions + live refresh), Features, OpenSpec, Optional API setup (free), Run locally, Scripts (+1 more)

## Knowledge Gaps
- **11 isolated node(s):** `react-dom`, `shadcn`, `tw-animate-css`, `@fission-ai/openspec`, `@tailwindcss/turbopack` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 146 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `types.ts` to `package.json`, `use-viewer-state.ts`, `cn`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **What connects `react-dom`, `shadcn`, `tw-animate-css` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0963265306122449 - nodes in this community are weakly interconnected._
- **Why does `next` connect `auth.ts` to `package.json`, `layout.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Why does `next-auth` connect `auth.ts` to `types.ts`, `package.json`, `layout.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09103840682788052 - nodes in this community are weakly interconnected._