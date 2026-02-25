const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'jobs.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    location TEXT,
    remote INTEGER DEFAULT 0,
    url TEXT,
    status TEXT DEFAULT 'applied',
    applied_date TEXT,
    deadline TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT,
    notes TEXT,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS interview_rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    round_type TEXT NOT NULL,
    scheduled_date TEXT,
    interviewer TEXT,
    notes TEXT,
    questions_asked TEXT,
    outcome TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS prep_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    tags TEXT,
    difficulty TEXT DEFAULT 'medium',
    practiced INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

module.exports = db;
