# Job Tracker

A full-stack app to manage your job applications, track interviews, and store interview prep notes.

## Tech Stack

- **Frontend**: React 18, React Router, Tailwind CSS, Vite
- **Backend**: Node.js, Express, SQLite (via better-sqlite3)

## Project Structure

```
job-tracker/
├── client/        # React frontend (Vite)
└── server/        # Express backend + SQLite database
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/abhishekpitla/job-tracker.git
cd job-tracker
```

### 2. Install all dependencies

```bash
npm run install:all
```

This installs dependencies for the root, server, and client in one command.

### 3. Run the app (development)

```bash
npm run dev
```

This starts both the backend and frontend concurrently:

| Service  | URL                     |
|----------|-------------------------|
| Frontend | http://localhost:5173   |
| Backend  | http://localhost:3001   |

Open http://localhost:5173 in your browser.

## Available Scripts

| Command              | Description                                      |
|----------------------|--------------------------------------------------|
| `npm run dev`        | Start both frontend and backend in dev mode      |
| `npm run server`     | Start only the backend (with nodemon)            |
| `npm run client`     | Start only the frontend (Vite dev server)        |
| `npm run install:all`| Install dependencies for all packages            |

## Features

- **Dashboard** — Overview of all applications with stats and upcoming deadlines/interviews
- **Jobs** — Add, edit, delete, search, and filter job applications by status
- **Job Detail** — View full job info, manage contacts, and log interview rounds
- **Prep** — Store and organize interview prep questions by category and difficulty

## API Endpoints

| Method | Endpoint                    | Description                  |
|--------|-----------------------------|------------------------------|
| GET    | `/api/jobs`                 | List all jobs (filter/search)|
| POST   | `/api/jobs`                 | Add a new job                |
| GET    | `/api/jobs/:id`             | Get job with contacts & interviews |
| PUT    | `/api/jobs/:id`             | Update a job                 |
| DELETE | `/api/jobs/:id`             | Delete a job                 |
| POST   | `/api/jobs/:id/contacts`    | Add contact to a job         |
| PUT    | `/api/contacts/:id`         | Update a contact             |
| DELETE | `/api/contacts/:id`         | Delete a contact             |
| POST   | `/api/jobs/:id/interviews`  | Add interview round          |
| PUT    | `/api/interviews/:id`       | Update interview round       |
| DELETE | `/api/interviews/:id`       | Delete interview round       |
| GET    | `/api/prep`                 | List prep questions          |
| POST   | `/api/prep`                 | Add a prep question          |
| PUT    | `/api/prep/:id`             | Update a prep question       |
| DELETE | `/api/prep/:id`             | Delete a prep question       |
| GET    | `/api/stats`                | Get dashboard stats          |
