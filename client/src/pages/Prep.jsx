import { useState, useEffect, useCallback } from 'react';

const CATS = ['all', 'behavioral', 'dsa', 'system_design', 'coding', 'company_specific'];
const CAT_LABELS = {
  all: 'All', behavioral: 'Behavioral', dsa: 'DSA / Algorithms',
  system_design: 'System Design', coding: 'Coding Concepts', company_specific: 'Company Specific',
};
const DIFFS = ['easy', 'medium', 'hard'];
const DIFF_STYLE = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' };
const DIFF_DARK = { easy: 'dark:bg-green-900/40 dark:text-green-300', medium: 'dark:bg-yellow-900/40 dark:text-yellow-300', hard: 'dark:bg-red-900/40 dark:text-red-300' };

const SEEDS = [
  { category: 'behavioral', difficulty: 'easy', question: 'Tell me about yourself.', tags: 'intro', answer: 'Craft a 2-minute pitch: current role/education, key experiences, why you\'re excited about this company. Keep it technical and relevant.' },
  { category: 'behavioral', difficulty: 'easy', question: 'Why do you want to work here?', tags: 'motivation', answer: 'Research the company. Mention specific products, culture, tech stack, or mission that aligns with your goals.' },
  { category: 'behavioral', difficulty: 'medium', question: 'Tell me about a time you resolved a conflict with a teammate.', tags: 'conflict,teamwork', answer: 'STAR: Situation (the disagreement), Task (your role), Action (how you communicated/compromised), Result (positive outcome).' },
  { category: 'behavioral', difficulty: 'medium', question: 'Describe a project you\'re most proud of.', tags: 'achievement,impact', answer: 'Choose something with measurable impact. Cover: problem, your role, tech decisions, challenges, outcome. Quantify impact.' },
  { category: 'behavioral', difficulty: 'medium', question: 'Tell me about a time you missed a deadline.', tags: 'failure,growth', answer: 'Be honest. Focus on what you learned and what you changed. Show self-awareness and growth.' },
  { category: 'behavioral', difficulty: 'hard', question: 'Tell me about a time you disagreed with your manager.', tags: 'conflict,leadership', answer: 'Show you can advocate for your ideas while staying respectful. Emphasize data-driven communication and ability to compromise.' },
  { category: 'dsa', difficulty: 'easy', question: 'Two Sum — find two numbers that add up to a target.', tags: 'array,hashmap', answer: 'O(n) solution: iterate, for each num check if (target - num) is in a hashmap. If not, add num to map. Return indices when found.' },
  { category: 'dsa', difficulty: 'easy', question: 'Valid Parentheses — check if brackets are balanced.', tags: 'stack,string', answer: 'Use a stack. Push opening brackets. On closing bracket, pop and check match. Return stack.isEmpty() at end.' },
  { category: 'dsa', difficulty: 'medium', question: 'Longest Substring Without Repeating Characters.', tags: 'sliding-window,hashmap', answer: 'Sliding window with a set. Expand right, shrink left when duplicate found. Track max window size. O(n).' },
  { category: 'dsa', difficulty: 'medium', question: 'Binary Search — implement and common patterns.', tags: 'binary-search,array', answer: 'lo=0, hi=len-1, mid=(lo+hi)//2. For sorted arrays. Variants: find leftmost, rightmost, rotated array. Always check loop condition carefully.' },
  { category: 'dsa', difficulty: 'hard', question: 'Merge K Sorted Lists.', tags: 'heap,linkedlist', answer: 'Use a min-heap of size k. Initialize with head of each list. Poll min, push next node of that list. O(n log k).' },
  { category: 'system_design', difficulty: 'medium', question: 'Design a URL shortener (bit.ly)', tags: 'distributed,hashing,cache', answer: 'API: POST /shorten, GET /:code. Storage: hash long URL to 6-char base62 ID. DB: (id, long_url, created_at). Cache hot URLs in Redis. Handle collisions. CDN for redirects.' },
  { category: 'system_design', difficulty: 'medium', question: 'Design a rate limiter.', tags: 'distributed,redis', answer: 'Token bucket or sliding window counter. Store counts in Redis with TTL. Distributed: use Redis atomic ops (INCR + EXPIRE). Return 429 when limit exceeded.' },
  { category: 'system_design', difficulty: 'hard', question: 'Design Twitter/X feed.', tags: 'distributed,fanout,cache', answer: 'Fan-out on write (push) for normal users, fan-out on read (pull) for celebrities. Store tweets in DB + timeline cache (Redis sorted set by timestamp). CDN for media.' },
  { category: 'system_design', difficulty: 'hard', question: 'Design a notification system.', tags: 'queues,fanout', answer: 'Event producers → Kafka → consumers per channel (push/email/SMS). Fan-out service. Retry with exponential backoff. Store notification state in DB. Rate limit per user.' },
  { category: 'coding', difficulty: 'easy', question: 'What is the difference between BFS and DFS?', tags: 'graph,traversal', answer: 'BFS: queue, level-by-level, shortest path in unweighted graphs. DFS: stack/recursion, explores deep first, good for cycle detection, topological sort.' },
  { category: 'coding', difficulty: 'medium', question: 'Explain dynamic programming and when to use it.', tags: 'dp,optimization', answer: 'DP = break problem into subproblems, cache results. Use when: overlapping subproblems + optimal substructure. Patterns: 1D DP, 2D DP, knapsack, LCS, LIS.' },
  { category: 'coding', difficulty: 'medium', question: 'What is the time/space complexity of common data structures?', tags: 'complexity,ds', answer: 'Array: O(1) access, O(n) search. HashMap: O(1) avg. BST: O(log n) balanced. Heap: O(log n) insert/delete, O(1) peek. Stack/Queue: O(1) push/pop.' },
];

const BLANK = { category: 'behavioral', question: '', answer: '', tags: '', difficulty: 'medium' };

// ── Flashcard Component ───────────────────────────────────────────────────────
function Flashcard({ question, onKnow, onUnsure, onSkip, index, total }) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => setFlipped(f => !f);

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-gray-400 dark:text-gray-500">Card {index + 1} of {total}</p>

      {/* Progress bar */}
      <div className="w-full max-w-xl bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* Card flip container */}
      <div
        className="w-full max-w-xl cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={handleFlip}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            height: '260px',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="mb-4 text-4xl">🤔</div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
              {question.question}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">Click to reveal answer</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg border border-blue-100 dark:border-gray-600 flex flex-col items-center justify-center p-8 text-center overflow-auto"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="mb-3 text-3xl">💡</div>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {question.answer || 'No answer added yet.'}
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-300 mt-4">Click to flip back</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-2">
        <button
          onClick={e => { e.stopPropagation(); setFlipped(false); onUnsure(); }}
          className="px-6 py-2.5 rounded-xl font-medium text-sm bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors flex items-center gap-2"
        >
          😅 Still Learning
        </button>
        <button
          onClick={e => { e.stopPropagation(); setFlipped(false); onSkip(); }}
          className="px-6 py-2.5 rounded-xl font-medium text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          ⏭ Skip
        </button>
        <button
          onClick={e => { e.stopPropagation(); setFlipped(false); onKnow(); }}
          className="px-6 py-2.5 rounded-xl font-medium text-sm bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors flex items-center gap-2"
        >
          ✅ Got It!
        </button>
      </div>
    </div>
  );
}

// ── Practice Mode ─────────────────────────────────────────────────────────────
function PracticeMode({ questions, onExit, onMarkPracticed }) {
  const [deck, setDeck] = useState(() => [...questions].sort(() => Math.random() - 0.5));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState({ know: 0, learning: 0, skipped: 0 });
  const [done, setDone] = useState(false);

  const advance = (outcome) => {
    setResults(r => ({ ...r, [outcome]: r[outcome] + 1 }));
    if (outcome === 'know') onMarkPracticed(deck[index]);
    if (index + 1 >= deck.length) {
      setDone(true);
    } else {
      setIndex(i => i + 1);
    }
  };

  if (done) {
    const total = deck.length;
    const pct = Math.round((results.know / total) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-6xl">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📚'}</div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Session Complete!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">You reviewed {total} cards</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center bg-green-50 dark:bg-green-900/30 rounded-xl px-6 py-4">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{results.know}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Got It</div>
          </div>
          <div className="text-center bg-red-50 dark:bg-red-900/30 rounded-xl px-6 py-4">
            <div className="text-3xl font-bold text-red-500 dark:text-red-400">{results.learning}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Still Learning</div>
          </div>
          <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-xl px-6 py-4">
            <div className="text-3xl font-bold text-gray-500 dark:text-gray-300">{results.skipped}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Skipped</div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{pct}%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">score</div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setIndex(0); setResults({ know: 0, learning: 0, skipped: 0 }); setDone(false); setDeck([...questions].sort(() => Math.random() - 0.5)); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            🔄 Practice Again
          </button>
          <button onClick={onExit} className="border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium">
            ← Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">🃏 Practice Mode</h2>
        <button onClick={onExit} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline">Exit</button>
      </div>
      <Flashcard
        question={deck[index]}
        index={index}
        total={deck.length}
        onKnow={() => advance('know')}
        onUnsure={() => advance('learning')}
        onSkip={() => advance('skipped')}
      />
    </div>
  );
}

// ── Main Prep Page ────────────────────────────────────────────────────────────
export default function Prep() {
  const [questions, setQuestions] = useState([]);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [seeded, setSeeded] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (cat !== 'all') p.set('category', cat);
    if (search) p.set('search', search);
    const res = await fetch(`/api/prep?${p}`);
    const data = await res.json();

    if (data.length === 0 && !seeded && cat === 'all' && !search) {
      setSeeded(true);
      for (const q of SEEDS) {
        await fetch('/api/prep', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q),
        });
      }
      load();
      return;
    }
    setQuestions(data);
  }, [cat, search, seeded]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/prep', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setForm(BLANK);
    setShowForm(false);
    load();
  };

  const togglePracticed = async (q) => {
    await fetch(`/api/prep/${q.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...q, practiced: !q.practiced }),
    });
    load();
  };

  const markPracticed = async (q) => {
    if (!q.practiced) {
      await fetch(`/api/prep/${q.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...q, practiced: true }),
      });
      load();
    }
  };

  const del = async (id) => {
    await fetch(`/api/prep/${id}`, { method: 'DELETE' });
    load();
  };

  const counts = CATS.slice(1).reduce((acc, c) => {
    acc[c] = questions.filter(q => q.category === c).length;
    return acc;
  }, {});
  const practicedCount = questions.filter(q => q.practiced).length;

  if (practiceMode) {
    const deck = questions.filter(q => cat === 'all' || q.category === cat);
    return (
      <div className="max-w-2xl mx-auto">
        <PracticeMode questions={deck} onExit={() => setPracticeMode(false)} onMarkPracticed={markPracticed} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Interview Prep</h1>
          {questions.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {practicedCount}/{questions.length} practiced
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPracticeMode(true)}
            disabled={questions.length === 0}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            🃏 Practice Mode
          </button>
          <button
            onClick={() => setShowForm(v => !v)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Add Question
          </button>
        </div>
      </div>

      {/* Category stat cards */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {CATS.slice(1).map(c => (
          <div key={c} onClick={() => setCat(c)}
            className={`bg-white dark:bg-gray-800 rounded-lg p-3 border cursor-pointer transition-colors ${cat === c ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
              }`}>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{counts[c] || 0}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{CAT_LABELS[c]}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Search questions..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex flex-wrap gap-1">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cat === c ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}>
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Question</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm">
                  {CATS.slice(1).map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Difficulty</label>
                <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm">
                  {DIFFS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tags (comma separated)</label>
                <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                  placeholder="array, dp, greedy"
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Question *</label>
              <textarea required value={form.question} rows={2} placeholder="Enter the interview question..."
                onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Answer / Key Points</label>
              <textarea value={form.answer} rows={4} placeholder="Solution approach, STAR story, key concepts..."
                onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 dark:text-gray-400 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500">
            No questions found
          </div>
        ) : questions.map(q => (
          <div key={q.id}
            className={`bg-white dark:bg-gray-800 rounded-xl border transition-colors ${q.practiced ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10' : 'border-gray-100 dark:border-gray-700'
              }`}>
            <div className="p-4 cursor-pointer flex items-start justify-between gap-4"
              onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${DIFF_STYLE[q.difficulty]} ${DIFF_DARK[q.difficulty]}`}>
                  {q.difficulty}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{CAT_LABELS[q.category]}</span>
                    {q.practiced && <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Practiced</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{q.question}</p>
                  {q.tags && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {q.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => `#${t}`).join(' ')}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-gray-400 text-xs flex-shrink-0 mt-1">{expanded === q.id ? '▲' : '▼'}</span>
            </div>

            {expanded === q.id && (
              <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                {q.answer
                  ? <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Answer / Notes</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{q.answer}</p>
                  </div>
                  : <p className="text-sm text-gray-400 italic mb-3">No answer added yet.</p>
                }
                <div className="flex gap-2">
                  <button onClick={() => togglePracticed(q)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${q.practiced
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60'
                      }`}>
                    {q.practiced ? 'Unmark Practiced' : 'Mark as Practiced'}
                  </button>
                  <button onClick={() => del(q.id)} className="text-xs px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
