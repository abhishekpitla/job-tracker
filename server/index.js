require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const db = require('./db');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'fake-key-to-avoid-crash'
});

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const PORT = 3001;

// Helper: add an activity log entry
function logActivity(job_id, type, description) {
  db.prepare('INSERT INTO activity_log (job_id, type, description) VALUES (?, ?, ?)')
    .run(job_id, type, description);
}

// ── AI ────────────────────────────────────────────────────────────────────────

app.post('/api/ai/parse-job', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Please set your OPENAI_API_KEY in the server/.env file' });
    }

    const prompt = `
Extract the following job application details from the text below and return ONLY a valid JSON object. 
If a field is not found, leave it empty or null. Try to infer the location, remote status, salary min and max if mentioned.

{
  "company": "Company Name",
  "position": "Job Title",
  "location": "City, State or Remote",
  "remote": boolean (true if remote is mentioned),
  "salary_min": number (minimum salary if mentioned, else null),
  "salary_max": number (maximum salary if mentioned, else null),
  "notes": "Short summary of the role or requirements"
}

Text:
${text}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    res.json(parsed);

  } catch (error) {
    console.error('AI parse error:', error);
    res.status(500).json({ error: 'Failed to parse job description. Is your API key valid?' });
  }
});

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
  const activity = db.prepare(
    'SELECT * FROM activity_log WHERE job_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.params.id);
  res.json({ ...job, contacts, interviews, activity });
});

app.post('/api/jobs', (req, res) => {
  const {
    company, position, location, remote, url, status,
    applied_date, deadline, salary_min, salary_max, notes, priority, source
  } = req.body;

  const result = db.prepare(`
    INSERT INTO jobs (company, position, location, remote, url, status, applied_date, deadline,
      salary_min, salary_max, notes, priority, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    company, position, location, remote ? 1 : 0, url,
    status || 'applied', applied_date, deadline,
    salary_min || null, salary_max || null, notes,
    priority || 0, source || null
  );

  const newJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
  logActivity(newJob.id, 'created', `Application created for ${company} — ${position}`);
  if (applied_date) logActivity(newJob.id, 'applied', `Applied on ${applied_date}`);

  res.status(201).json(newJob);
});

app.put('/api/jobs/:id', (req, res) => {
  const {
    company, position, location, remote, url, status,
    applied_date, deadline, salary_min, salary_max, notes, priority, source
  } = req.body;

  const oldJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);

  db.prepare(`
    UPDATE jobs SET company=?, position=?, location=?, remote=?, url=?, status=?,
    applied_date=?, deadline=?, salary_min=?, salary_max=?, notes=?, priority=?, source=?,
    updated_at=datetime('now')
    WHERE id=?
  `).run(
    company, position, location, remote ? 1 : 0, url, status,
    applied_date, deadline, salary_min || null, salary_max || null, notes,
    priority || 0, source || null,
    req.params.id
  );

  // Auto-log status changes
  if (oldJob && oldJob.status !== status) {
    const STATUS_LABELS = {
      applied: 'Applied', phone_screen: 'Phone Screen', oa: 'Online Assessment',
      technical: 'Technical Interview', onsite: 'Onsite', offer: 'Offer Received 🎉',
      rejected: 'Rejected', withdrawn: 'Withdrawn',
    };
    logActivity(
      req.params.id,
      'status_change',
      `Status changed from "${STATUS_LABELS[oldJob.status] || oldJob.status}" to "${STATUS_LABELS[status] || status}"`
    );
  }

  // Log notes change
  if (oldJob && oldJob.notes !== notes && notes) {
    logActivity(req.params.id, 'note', 'Notes updated');
  }

  res.json(db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id));
});

app.delete('/api/jobs/:id', (req, res) => {
  db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── ACTIVITY LOG ──────────────────────────────────────────────────────────────

app.get('/api/jobs/:id/activity', (req, res) => {
  const activity = db.prepare(
    'SELECT * FROM activity_log WHERE job_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);
  res.json(activity);
});

app.post('/api/jobs/:id/activity', (req, res) => {
  const { type, description } = req.body;
  const result = db.prepare(
    'INSERT INTO activity_log (job_id, type, description) VALUES (?, ?, ?)'
  ).run(req.params.id, type || 'note', description);
  res.status(201).json(db.prepare('SELECT * FROM activity_log WHERE id = ?').get(result.lastInsertRowid));
});

// ── CONTACTS ──────────────────────────────────────────────────────────────────

app.post('/api/jobs/:id/contacts', (req, res) => {
  const { name, email, phone, role, notes } = req.body;
  const result = db.prepare(
    'INSERT INTO contacts (job_id, name, email, phone, role, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, name, email, phone, role, notes);

  logActivity(req.params.id, 'contact', `Contact added: ${name}${role ? ` (${role})` : ''}`);
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

  const ROUND_LABELS = {
    hr_screen: 'HR Screen', phone_screen: 'Phone Screen', online_assessment: 'Online Assessment',
    technical: 'Technical Interview', system_design: 'System Design', behavioral: 'Behavioral',
    onsite: 'Onsite', other: 'Other',
  };
  const label = ROUND_LABELS[round_type] || round_type;
  const dateStr = scheduled_date ? ` on ${scheduled_date.replace('T', ' ')}` : '';
  logActivity(req.params.id, 'interview', `${label} round scheduled${dateStr}${interviewer ? ` with ${interviewer}` : ''}`);

  res.status(201).json(db.prepare('SELECT * FROM interview_rounds WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/interviews/:id', (req, res) => {
  const { round_type, scheduled_date, interviewer, notes, questions_asked, outcome } = req.body;
  const old = db.prepare('SELECT * FROM interview_rounds WHERE id = ?').get(req.params.id);
  db.prepare(`
    UPDATE interview_rounds SET round_type=?, scheduled_date=?, interviewer=?, notes=?, questions_asked=?, outcome=?
    WHERE id=?
  `).run(round_type, scheduled_date, interviewer, notes, questions_asked, outcome, req.params.id);

  if (old && outcome && old.outcome !== outcome) {
    logActivity(old.job_id, 'interview', `Interview outcome updated: ${outcome}`);
  }

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

  // Weekly applications over last 8 weeks
  const weeklyApps = db.prepare(`
    SELECT strftime('%Y-W%W', applied_date) as week, COUNT(*) as count
    FROM jobs
    WHERE applied_date IS NOT NULL AND applied_date >= date('now', '-56 days')
    GROUP BY week
    ORDER BY week ASC
  `).all();

  // Source breakdown
  const bySource = db.prepare(`
    SELECT COALESCE(source, 'Unknown') as source, COUNT(*) as count
    FROM jobs GROUP BY source ORDER BY count DESC
  `).all();

  // Average time to response (days between applied_date and first status change)
  const responseStats = db.prepare(`
    SELECT COUNT(*) as responded FROM jobs
    WHERE status NOT IN ('applied', 'withdrawn')
  `).get();

  res.json({ total, byStatus, upcoming, upcomingInterviews, weeklyApps, bySource, responseStats });
});

// ── EXPORT ───────────────────────────────────────────────────────────────────

app.get('/api/export/csv', (req, res) => {
  const jobs = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all();
  const headers = ['id', 'company', 'position', 'location', 'remote', 'url', 'status', 'applied_date', 'deadline', 'salary_min', 'salary_max', 'notes', 'source', 'priority', 'created_at'];
  const csvRows = [
    headers.join(','),
    ...jobs.map(job =>
      headers.map(h => {
        const val = job[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    )
  ];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="job-applications.csv"');
  res.send(csvRows.join('\n'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
