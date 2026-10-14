---
paths:
  - "lib/progress.ts"
  - "lib/lessonStore*.ts"
  - "lib/nextUp*.ts"
  - "components/LessonTrackers.tsx"
  - "components/LessonRail.tsx"
  - "components/NextUp.tsx"
  - "components/PathView.tsx"
  - "components/DataControls.tsx"
  - "components/ReadToggle.tsx"
  - "components/HomeView.tsx"
  - "app/data/**"
---

# Progress tracking

Applies when editing the progress store, the lesson trackers, Next up or the data page. Stored in localStorage only.

## Standing rules

- Tracked units per topic: each concept section, the quiz, each post, each with "Mark done" at the end of its section. A topic is read when all are done; the read flag is derived, and the graph and "Next up" use only it.
- "In progress" means deliberate progress only: a section marked done or a quiz question answered (inProgressSlugs in lib/progress.ts). Scrolling a section into view ("visited") does not count, so merely opening a topic never marks it in progress.
- Stored in localStorage only: versioned, try/catch, tolerant of missing or corrupt data, pages render without it, synced across tabs, old keys migrate. No accounts, nothing sent anywhere.
- Great reads (/reads) carry only a per-entry "Read" toggle (lib/readsRead.ts, key `sys101:reads-read`, ids of reads). It is not a topic unit, never sets a topic read flag and never feeds Next up or the map; it is cleared by "Reset all" on /data and is not in the export file.
- Display: "x of N done", a thin segmented bar, a Continue link. The homepage button follows what you started (homeAction in lib/nextUp.ts). /data shows a read/in-progress/ready tally then export/import/reset. The Path view shows a per-group count and a mark-group-read toggle (markTopics).
