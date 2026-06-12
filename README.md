# TaskFlow — Personal Task Manager

## Project Title & Description

**Exercise chosen: Personal Task Manager (Option 1 — Fundamentals Track)**

TaskFlow is a full-stack personal task manager built with a real Node.js/Express REST API backend and a vanilla JavaScript frontend — no React, no build step, no magic. You can add tasks with a title, optional description, and an optional due date; mark them complete or incomplete; edit them inline; and delete them with a confirmation prompt. Tasks are filtered by status (All / Active / Completed), searchable by title or description, and persisted to a JSON file on disk so nothing is lost across server restarts. Overdue tasks are visually flagged with a red border and a warning badge. The UI is a dark-themed, monospace-accented single page served as static files by the same Express process that handles the API.

---

## Live Demo Links

> **Deployed URL:** *(add your Render URL here after deploying — see the deployment guide at the bottom of this file)*
>
> Example format: `https://taskflow-xxxx.onrender.com`

---

## Tech Stack

| Tool / Library | Version | Why |
|---|---|---|
| **Node.js** | ≥18.x | Runtime. No transpilation needed, native ES modules supported. |
| **Express 5** | ^5.2.1 | Minimal HTTP framework. Handles routing, static file serving, and JSON body parsing in ~10 lines of setup. |
| **cors** | ^2.8.6 | Allows the frontend to call the API during local development when ports differ. |
| **uuid** | ^14.0.0 | Generates collision-proof UUIDs for task IDs instead of fragile auto-increment integers. |
| **Vanilla JS + CSS** | — | No framework means no build step, no `npm run build`, no bundler config. A reviewer can read every line directly. Appropriate for this scope. |
| **JSON file persistence** | — | Zero-dependency storage. `data/tasks.json` is created automatically on first run. Survives server restarts. Good enough for a single-user app with no concurrent write load. |

**What was intentionally left out:** SQLite/PostgreSQL (overkill for one user, adds a native dependency that breaks on some environments), React (adds build complexity with no UX gain at this scale), authentication (out of scope per the brief).

---

## How to Run Locally

Assumes you have **Node.js 18 or later** installed. Nothing else required.

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open in browser
# http://localhost:3000
```

The `data/` directory and `tasks.json` file are created automatically on first run. No `.env` file, no database setup, no config needed.

**To verify the API is running:**
```bash
curl http://localhost:3000/api/tasks
# Should return: []
```

---

## API Documentation

Base URL (local): `http://localhost:3000`  
All request bodies and responses are JSON. All endpoints return `Content-Type: application/json`.

---

### `GET /api/tasks`

Returns all tasks sorted by creation date, newest first.

**Request body:** none

**Response `200`:**
```json
[
  {
    "id": "68d5f7dd-70fb-4e38-ae0b-8e319145baad",
    "title": "Review DSA notes",
    "description": "Arrays and linked lists before placement",
    "dueDate": "2026-06-10",
    "completed": false,
    "createdAt": "2026-06-12T07:34:21.444Z",
    "updatedAt": "2026-06-12T07:34:21.444Z"
  }
]
```

---

### `POST /api/tasks`

Creates a new task.

**Request body:**
```json
{
  "title": "string (required)",
  "description": "string (optional, defaults to \"\")",
  "dueDate": "YYYY-MM-DD (optional, defaults to null)"
}
```

**Response `201`:** Returns the created task object (same shape as above).

**Response `400`:**
```json
{ "error": "Title is required." }
```

---

### `PATCH /api/tasks/:id`

Partially updates a task. Send only the fields you want to change. Used for both editing details and toggling completion status.

**URL param:** `id` — UUID of the task

**Request body (any subset):**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "dueDate": "2026-06-20",
  "completed": true
}
```

**Response `200`:** Returns the full updated task object.

**Response `400`:**
```json
{ "error": "Title cannot be empty." }
```

**Response `404`:**
```json
{ "error": "Task not found." }
```

---

### `DELETE /api/tasks/:id`

Deletes a task permanently.

**URL param:** `id` — UUID of the task

**Request body:** none

**Response `200`:**
```json
{ "success": true }
```

**Response `404`:**
```json
{ "error": "Task not found." }
```

---

## Project Structure

```
taskflow/
│
├── server/
│   ├── index.js        ← Express app: all routes (GET, POST, PATCH, DELETE),
│   │                     static file serving, port binding
│   └── db.js           ← Thin read/write helpers for data/tasks.json
│
├── public/             ← Served as static files by Express
│   ├── index.html      ← Single HTML page; all markup and widget structure
│   ├── css/
│   │   └── style.css   ← All styles: layout, dark theme, task cards,
│   │                     modal, toast, responsive breakpoints
│   └── js/
│       └── app.js      ← All frontend logic: fetch calls, render, filter,
│                         search, edit mode, delete modal, toast
│
├── data/
│   └── tasks.json      ← Auto-created on first run. This is the database.
│                         Commit it or .gitignore it — your call.
│
├── package.json        ← Dependencies: express, cors, uuid
└── README.md
```

**Entry point:** `server/index.js`  
**Start command:** `node server/index.js` (or `npm start`)  
**No build step.** What you see is what runs.

---

## Next Steps

### What was deliberately skipped

| Feature | Reason skipped |
|---|---|
| Drag-and-drop reordering | Needs a `order` field on every task, a PATCH-all endpoint, and significant pointer/touch event handling. Adds complexity without testing any new concept for this exercise. |
| SQLite persistence | `better-sqlite3` is a native module — it fails to compile without Node.js build headers, which aren't available in all environments. JSON file is sufficient for single-user, no-concurrency use. |
| User authentication | Explicitly out of scope per the brief ("assume one user"). |

### What I'd build next (priority order)

1. **SQLite via `better-sqlite3` or `@libsql/client`** — replace the JSON file with a proper database. Gains: atomic writes, no race conditions if the app ever scales, proper querying without loading all tasks into memory.

2. **Task priorities** — add a `priority` field (`low / medium / high`) with a visual indicator. Sort the list by priority + due date instead of just creation date.

3. **Subtasks / checklist items** — a task can have child items with their own completion state. Common ask, tests a one-to-many relationship in the data model.

4. **Due date reminders** — a cron job (via `node-cron`) that logs or pushes a notification for tasks due today. Could be extended to email with `nodemailer`.

5. **Drag-and-drop reorder** — now that the data model is more stable, add a `displayOrder` integer field and use the browser's native Drag-and-Drop API (no library needed for this use case).

6. **Deploy to a real database on Render** — swap JSON file for a Render-managed PostgreSQL instance with `pg` + raw SQL or a lightweight ORM like `drizzle-orm`.

---

## Deploying to Render

### Step 1 — Push to GitHub

```bash
# In your project root, create a .gitignore first
echo "node_modules/\ndata/tasks.json" > .gitignore

git init
git add .
git commit -m "Initial commit: TaskFlow"

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

> **Note on `data/tasks.json`:** Adding it to `.gitignore` means tasks reset on every deploy. If you want tasks to survive deploys, either commit the file (not recommended for production) or migrate to a database. For a portfolio submission, resetting on deploy is fine.

---

### Step 2 — Create a Render Web Service

1. Go to [https://render.com](https://render.com) and sign in (free account works).
2. Click **New → Web Service**.
3. Connect your GitHub account if you haven't already.
4. Select the `taskflow` repository.

---

### Step 3 — Configure the Service

Fill in these fields exactly:

| Field | Value |
|---|---|
| **Name** | `taskflow` (or anything you want) |
| **Region** | Singapore (closest to India) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

Leave everything else as default.

---

### Step 4 — Deploy

Click **Create Web Service**. Render will:
1. Pull your code from GitHub
2. Run `npm install`
3. Run `npm start`
4. Assign a URL like `https://taskflow-xxxx.onrender.com`

First deploy takes ~2 minutes. You'll see live build logs.

---

### Step 5 — Verify

Once the status shows **Live**, open your Render URL in the browser. Test:

```bash
# Replace with your actual Render URL
curl https://taskflow-xxxx.onrender.com/api/tasks
```

Should return `[]` or your existing tasks.

---

### Important: Render Free Tier Behaviour

- **Spins down after 15 minutes of inactivity.** First request after idle takes ~30 seconds to cold-start. This is normal on the free tier.
- **Disk is ephemeral.** `data/tasks.json` is lost on every deploy or restart on the free tier. For persistent data on Render, use their managed **PostgreSQL** add-on (also has a free tier). This is the natural "next step" for this project.
- **Logs:** In your Render dashboard → your service → **Logs** tab. If something breaks, check here first.

---

### Auto-deploy on Git Push

By default, Render auto-deploys every time you push to `main`. To disable: Service Settings → **Auto-Deploy → Off**.
