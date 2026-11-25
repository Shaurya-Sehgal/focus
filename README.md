# focus. website

Informational website for the focus. digital-wellness campaign. Milestone 1: the homepage plus a shared header and footer, ready for design feedback. Not published.

## Run it on your computer

You need Node.js (already installed: v24).

1. Open a terminal in this folder (`focusWebsite`).
2. First time only: `npm install` downloads the libraries into `node_modules`.
3. `npm run dev` starts a local preview at **http://localhost:5173**. Open that address in your browser. When you save a file, the page updates automatically.
4. Press `Ctrl + C` in the terminal to stop it.

Other commands:

- `npm run build` checks the TypeScript for errors and creates the finished, optimized site in `dist/`. Run it before publishing.
- `npm run preview` serves the `dist/` build locally so you can check it.

## Where things are

| File | What it does |
| --- | --- |
| `src/content.ts` | Campaign facts, research findings and sources. Edit wording here first. |
| `src/App.tsx` | The homepage sections, in order. |
| `src/components/` | Page sections and shared pieces (`Header`, `Footer`, `Hero`, `Habits`, …). `PageRibbon` draws the whole light ribbon, hero included. |
| `src/ribbon/` | The ribbon's strands, hero formula, clock and pointer easing, plus the page route maths. |
| `src/components/HabitScene.tsx`, `habitSceneRenderer.ts` | The Blender artwork in the Habits panel: the still shows first, then the 3D scene (three.js loads only when needed). Web exports live in `src/assets/habits/`. |
| `concepts/` | Blender source files, renders and web exports. `concepts/tools/` rebuilds the current scenes, stills and GLBs (see DEVELOPMENT.md). |
| `src/styles/tokens.css` | Colours, type sizes, spacing and easing. Change the palette here. |
| `src/styles/base.css`, `layout.css`, `home.css` | Page-wide defaults, shared header/footer/button styles, then homepage sections. |
| `src/assets/` | Logo files cut from `focusLogo.JPG` (navy and white, transparent background). |
| `screenshots/` | Desktop, mobile and reduced-motion captures from the milestone review. |
| `DEVELOPMENT.md` | Decisions, open questions and missing assets. |

## Note about OneDrive

This folder is inside OneDrive, so OneDrive will try to sync `node_modules` (thousands of small files). If syncing gets slow, move the project to a folder outside OneDrive, such as `C:\dev\focusWebsite`, and run `npm install` again there.
