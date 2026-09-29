# Quizzical — Premium Full-Stack Trivia App

A modern, responsive, server-validated trivia application built with React 19, Vite, Express, and Web Audio API.

## Features

- **Full-Stack Architecture**: React 19 client communicating with an Express.js backend for server-side scoring and question randomization.
- **70+ Curated Questions**: Across General Knowledge, Science, History, Geography, Movies, Sports, and Malayalam/Pop-Culture Comedy ("Stress Buster").
- **Continuous Round Timer**: Dynamic timing (15s per question, standard 60s, extended 120s, or blitz 30s) that persists across questions without accidental resets.
- **Micro-Interactions & Audio**: Web Audio API sound effects for correct answers, wrong answers, low time countdown ticks, time's up gong, and victory fanfare. Includes a persistent Sound ON/OFF toggle in `localStorage`.
- **Keyboard Navigation**: Press `1`-`4` or `A`-`D` to select options, and `Enter`/`Space` to advance to the next question.
- **Performance & Result Analytics**: Circular SVG accuracy ring, statistics breakdown (Correct, Incorrect, Unanswered, Time spent), filterable question review list, and one-click score sharing.
- **Resilient Error Handling**: Centralized API helper with request timeout, user-friendly error banners with retry buttons, and fallback scoring.

## Quick Start

### 1. Install Dependencies
```bash
npm install
cd server && npm install && cd ..
```

### 2. Run the Application
Run both backend (port 5000) and frontend (port 5173) concurrently with one command:
```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Other Useful Commands
- `npm run client` — Run only the Vite frontend dev server
- `npm run server` — Run only the Express backend server (port 5000)
- `npm run build` — Build production bundle with Vite
- `npm run lint` — Lint entire codebase with ESLint
