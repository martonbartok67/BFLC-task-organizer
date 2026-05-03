# FLC Task Organizer

Focused, sophisticated task management for a single team workspace.

## Stack


- Next.js App Router + TypeScript + Tailwind
- Supabase Auth + Postgres + Realtime + Storage
- Vercel deployment target

## Features (v1)

- Multi-project dashboard with drag-and-drop Kanban
- Task detail drawer with subtasks, attachments, comments, mentions
- Calendar view with shared Google Calendar two-way sync
- Analytics panel for project progress
- Team collaboration activity feed

## Setup

1. Copy `.env.example` to `.env.local`
2. Fill Supabase and Google credentials
3. Install dependencies and run:

```bash
npm install
npm run dev
```

## Supabase

- Run SQL in `supabase/migrations/202604280001_init_flc_task_organizer.sql`
- Create private storage bucket named `task-attachments`
- First registered user is auto-activated to bootstrap approvals; subsequent users start as `pending`

## Tests

```bash
npm run test
npm run test:e2e
```
