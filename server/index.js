const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// ── JOBS ──────────────────────────────────────────────────────────────────────

app.get('/api/jobs', (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM jobs';
  const params = [];
  const conditions = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(company LIKE ? OR position LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC';

  res.json(db.prepare(query).all(...params));
});

app.get('/api/jobs/:id', (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  const contacts = db.prepare('SELECT * FROM contacts WHERE job_id = ?').all(req.params.id);
  const interviews = db.prepare(
    'SELECT * FROM interview_rounds WHERE job_id = ? ORDER BY scheduled_date'
  ).all(req.params.id);
  res.json({ ...job, contacts, interviews });
});

app.post('/api/jobs', (req, res) => {
  const { company, position, location, remote, url, status, applied_date, deadline, salary_min, salary_max, notes } = req.body;
  const result = db.prepare(`
    INSERT INTO jobs (company, position, location, remote, url, status, applied_date, deadline, salary_min, salary_max, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(company, position, location, remote ? 1 : 0, url, status || 'applied', applied_date, deadline, salary_min || null, salary_max || null, notes);
  res.status(201).json(db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/jobs/:id', (req, res) => {
  const { company, position, location, remote, url, status, applied_date, deadline, salary_min, salary_max, notes } = req.body;
  db.prepare(`
    UPDATE jobs SET company=?, position=?, location=?, remote=?, url=?, status=?,
    applied_date=?, deadline=?, salary_min=?, salary_max=?, notes=?, updated_at=datetime('now')
    WHERE id=?
  `).run(company, position, location, remote ? 1 : 0, url, status, applied_date, deadline, salary_min || null, salary_max || null, notes, req.params.id);
  res.json(db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id));
});

app.delete('/api/jobs/:id', (req, res) => {
  db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── CONTACTS ──────────────────────────────────────────────────────────────────

app.post('/api/jobs/:id/contacts', (req, res) => {
  const { name, email, phone, role, notes } = req.body;
  const result = db.prepare(
    'INSERT INTO contacts (job_id, name, email, phone, role, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, name, email, phone, role, notes);
  res.status(201).json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/contacts/:id', (req, res) => {
  const { name, email, phone, role, notes } = req.body;
  db.prepare('UPDATE contacts SET name=?, email=?, phone=?, role=?, notes=? WHERE id=?')
    .run(name, email, phone, role, notes, req.params.id);
  res.json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id));
});

app.delete('/api/contacts/:id', (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── INTERVIEW ROUNDS ──────────────────────────────────────────────────────────

app.post('/api/jobs/:id/interviews', (req, res) => {
  const { round_type, scheduled_date, interviewer, notes, questions_asked, outcome } = req.body;
  const result = db.prepare(`
    INSERT INTO interview_rounds (job_id, round_type, scheduled_date, interviewer, notes, questions_asked, outcome)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, round_type, scheduled_date, interviewer, notes, questions_asked, outcome);
  res.status(201).json(db.prepare('SELECT * FROM interview_rounds WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/interviews/:id', (req, res) => {
  const { round_type, scheduled_date, interviewer, notes, questions_asked, outcome } = req.body;
  db.prepare(`
    UPDATE interview_rounds SET round_type=?, scheduled_date=?, interviewer=?, notes=?, questions_asked=?, outcome=?
    WHERE id=?
  `).run(round_type, scheduled_date, interviewer, notes, questions_asked, outcome, req.params.id);
  res.json(db.prepare('SELECT * FROM interview_rounds WHERE id = ?').get(req.params.id));
});

app.delete('/api/interviews/:id', (req, res) => {
  db.prepare('DELETE FROM interview_rounds WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── PREP QUESTIONS ────────────────────────────────────────────────────────────

app.get('/api/prep', (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM prep_questions';
  const params = [];
  const conditions = [];

  if (category && category !== 'all') {
    conditions.push('category = ?');
    params.push(category);
  }
  if (search) {
    conditions.push('(question LIKE ? OR answer LIKE ? OR tags LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY category, created_at DESC';

  res.json(db.prepare(query).all(...params));
});

app.post('/api/prep', (req, res) => {
  const { category, question, answer, tags, difficulty } = req.body;
  const result = db.prepare(
    'INSERT INTO prep_questions (category, question, answer, tags, difficulty) VALUES (?, ?, ?, ?, ?)'
  ).run(category, question, answer, tags, difficulty || 'medium');
  res.status(201).json(db.prepare('SELECT * FROM prep_questions WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/prep/:id', (req, res) => {
  const { category, question, answer, tags, difficulty, practiced } = req.body;
  db.prepare(
    'UPDATE prep_questions SET category=?, question=?, answer=?, tags=?, difficulty=?, practiced=? WHERE id=?'
  ).run(category, question, answer, tags, difficulty, practiced ? 1 : 0, req.params.id);
  res.json(db.prepare('SELECT * FROM prep_questions WHERE id = ?').get(req.params.id));
});

app.delete('/api/prep/:id', (req, res) => {
  db.prepare('DELETE FROM prep_questions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── STATS ─────────────────────────────────────────────────────────────────────

app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM jobs GROUP BY status').all();
  const upcoming = db.prepare(`
    SELECT * FROM jobs
    WHERE deadline >= date('now') AND status NOT IN ('offer','rejected','withdrawn')
    ORDER BY deadline ASC LIMIT 5
  `).all();
  const upcomingInterviews = db.prepare(`
    SELECT ir.*, j.company, j.position FROM interview_rounds ir
    JOIN jobs j ON ir.job_id = j.id
    WHERE ir.scheduled_date >= datetime('now')
    ORDER BY ir.scheduled_date ASC LIMIT 5
  `).all();
  res.json({ total, byStatus, upcoming, upcomingInterviews });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
