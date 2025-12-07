# PowerBI Integration Roadmap

## Overview
This document outlines the technical roadmap for integrating PowerBI into Narrativee. The goal is to allow users to connect their PowerBI account, embed dashboards, and automatically generate narrative reports from their datasets.

## Phase 1: Authentication & Connection (Foundation)
**Goal:** Allow users to securely connect their Microsoft/PowerBI account.

- [x] **Better Auth Configuration:** Add `microsoft` provider to `auth.ts`.
- [x] **Scopes:** Configure `offline_access` (for refresh tokens) and `Dataset.Read.All`.
- [x] **Account Linking:** Use Better Auth's `linkSocial` method to connect PowerBI to the existing user account.
- [x] **Database Schema:** (Implemented via `account` table in `schema.ts`)

## Phase 2: Data Extraction (The "Brain")
**Goal:** Fetch raw data from PowerBI to feed into Narrativee's LLM.

- [x] **Dataset Discovery:** List available workspaces and datasets.
- [x] **DAX Querying:** Use the "Execute Queries" REST API endpoint to run DAX queries against datasets.
- [ ] **Data Parsing:** Convert PowerBI JSON response into Narrativee's internal CSV/JSON format for analysis.

## Phase 3: Embedding (The "View")
**Goal:** Display the live dashboard inside the Narrativee workspace.

- [ ] **Frontend Component:** Create `<PowerBIEmbed />` using `powerbi-client-react`.
- [ ] **Embed Token Generation:** Backend endpoint to generate short-lived embed tokens (for "App Owns Data" or "User Owns Data" scenario).
- [ ] **Layout:** Split-screen view (Dashboard on left, Editor on right).

## Phase 4: Automation (The "Value")
**Goal:** "Set it and forget it" reporting.

- [ ] **Scheduler:** Cron job to fetch data every Monday at 9 AM.
- [ ] **Auto-Generate:** Trigger `llm.generateReport()` with the fresh data.
- [ ] **Notification:** Email user when the draft is ready.

## Technical Stack
- **Backend:** Node.js, Axios (for REST API), MSAL Node (Microsoft Auth Library).
- **Frontend:** React, `powerbi-client-react`.
- **Database:** Postgres (Prisma/Drizzle).
