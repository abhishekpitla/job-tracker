import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import JobForm from '../components/JobForm';

const ROUND_TYPES = ['hr_screen', 'phone_screen', 'online_assessment', 'technical', 'system_design', 'behavioral', 'onsite', 'other'];
const ROUND_LABELS = {
  hr_screen: 'HR Screen', phone_screen: 'Phone Screen', online_assessment: 'Online Assessment',
  technical: 'Technical Interview', system_design: 'System Design', behavioral: 'Behavioral',
  onsite: 'Onsite', other: 'Other',
};

const BLANK_INTERVIEW = { round_type: 'technical', scheduled_date: '', interviewer: '', notes: '', questions_asked: '', outcome: '' };
const BLANK_CONTACT = { name: '', email: '', phone: '', role: '', notes: '' };

const ACTIVITY_ICONS = {
  created: '🆕', status_change: '🔄', applied: '📤', interview: '🎙️',
  contact: '👤', note: '📝', default: '📌',
};

function ActivityTimeline({ items }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 italic">No activity yet.</p>;
  }
  return (
    <ol className="relative border-l border-gray-200 dark:border-gray-600 space-y-4 ml-2">
      {items.map(a => (
        <li key={a.id} className="ml-4">
          <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-xs">
            {ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS.default}
          </span>
          <p className="text-sm text-gray-800 dark:text-gray-200">{a.description}</p>
          <time className="text-xs text-gray-400 dark:text-gray-500">{a.created_at?.replace('T', ' ').slice(0, 16)}</time>
        </li>
      ))}
    </ol>
  );
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className="text-lg transition-transform hover:scale-110"
        >
          <span className={(hovered != null ? star <= hovered : star <= value) ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-600'}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddIv, setShowAddIv] = useState(false);
  const [showAddC, setShowAddC] = useState(false);
  const [newIv, setNewIv] = useState(BLANK_INTERVIEW);
  const [newC, setNewC] = useState(BLANK_CONTACT);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'activity'

  const load = useCallback(async () => {
    const res = await fetch(`/api/jobs/${id}`);
    if (!res.ok) { navigate('/jobs'); return; }
    setJob(await res.json());
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (data) => {
    await fetch(`/api/jobs/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    setShowEdit(false);
    load();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${job.company} — ${job.position}"?`)) return;
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    navigate('/jobs');
  };

  const handlePriorityChange = async (priority) => {
    await fetch(`/api/jobs/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...job, priority }),
    });
    load();
  };

  const addInterview = async (e) => {
    e.preventDefault();
    await fetch(`/api/jobs/${id}/interviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newIv),
    });
    setNewIv(BLANK_INTERVIEW);
    setShowAddIv(false);
    load();
  };

  const deleteInterview = async (ivId) => {
    await fetch(`/api/interviews/${ivId}`, { method: 'DELETE' });
    load();
  };

  const addContact = async (e) => {
    e.preventDefault();
    await fetch(`/api/jobs/${id}/contacts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newC),
    });
    setNewC(BLANK_CONTACT);
    setShowAddC(false);
    load();
  };

  const deleteContact = async (cId) => {
    await fetch(`/api/contacts/${cId}`, { method: 'DELETE' });
    load();
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    await fetch(`/api/jobs/${id}/activity`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'note', description: newNote.trim() }),
    });
    setNewNote('');
    load();
  };

  if (!job) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 dark:text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );

  const salary = job.salary_min || job.salary_max
    ? `$${(job.salary_min || 0).toLocaleString()} – $${(job.salary_max || 0).toLocaleString()}`
    : null;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/jobs')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline block">
        ← Back to Jobs
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.company}</h1>
              {job.url && (
                <a href={job.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors">
                  View JD ↗
                </a>
              )}
            </div>
            <p className="text-lg text-gray-500 dark:text-gray-400">{job.position}</p>
            <div className="flex items-center flex-wrap gap-2 mt-3">
              <StatusBadge status={job.status} />
              {job.location && <span className="text-sm text-gray-500 dark:text-gray-400">📍 {job.location}</span>}
              {job.remote === 1 && <span className="text-xs bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-full font-medium">Remote</span>}
              {salary && <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">💰 {salary}</span>}
              {job.source && <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">via {job.source}</span>}
            </div>
            <div className="mt-3">
              <StarRating value={job.priority || 0} onChange={handlePriorityChange} />
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setShowEdit(true)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
              ✏️ Edit
            </button>
            <button onClick={handleDelete}
              className="px-3 py-2 text-sm border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
              🗑 Delete
            </button>
          </div>
        </div>

        {/* Quick meta */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          {job.applied_date && (
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium">Applied</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{job.applied_date}</p>
            </div>
          )}
          {job.deadline && (
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium">Deadline</p>
              <p className="text-sm text-red-500 font-semibold">{job.deadline}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium">Interviews</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{job.interviews?.length || 0} rounds</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium">Contacts</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{job.contacts?.length || 0} people</p>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {['details', 'activity'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors capitalize border-b-2 -mb-px ${activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
            {tab === 'details' ? '📋 Details' : '📅 Activity Log'}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: Notes + interviews */}
          <div className="md:col-span-2 space-y-6">

            {/* Notes */}
            {job.notes && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">📝 Notes</h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{job.notes}</p>
              </div>
            )}

            {/* Interview Rounds */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">🎙️ Interview Rounds</h2>
                <button onClick={() => setShowAddIv(v => !v)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium">
                  + Add Round
                </button>
              </div>

              {showAddIv && (
                <form onSubmit={addInterview} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Round Type</label>
                      <select value={newIv.round_type} onChange={e => setNewIv(p => ({ ...p, round_type: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm">
                        {ROUND_TYPES.map(t => <option key={t} value={t}>{ROUND_LABELS[t]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Date & Time</label>
                      <input type="datetime-local" value={newIv.scheduled_date}
                        onChange={e => setNewIv(p => ({ ...p, scheduled_date: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Interviewer</label>
                      <input value={newIv.interviewer} placeholder="Name or team"
                        onChange={e => setNewIv(p => ({ ...p, interviewer: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Outcome</label>
                      <select value={newIv.outcome} onChange={e => setNewIv(p => ({ ...p, outcome: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm">
                        <option value="">Pending</option>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Questions Asked</label>
                    <textarea value={newIv.questions_asked} rows={2} placeholder="List the questions that were asked..."
                      onChange={e => setNewIv(p => ({ ...p, questions_asked: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">My Notes</label>
                    <textarea value={newIv.notes} rows={2} placeholder="How it went, feedback, follow-ups..."
                      onChange={e => setNewIv(p => ({ ...p, notes: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">Add</button>
                    <button type="button" onClick={() => setShowAddIv(false)} className="text-sm text-gray-500 dark:text-gray-400 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                  </div>
                </form>
              )}

              {job.interviews.length === 0
                ? <p className="text-sm text-gray-400 dark:text-gray-500">No interview rounds yet.</p>
                : <div className="space-y-4">
                  {job.interviews.map(iv => (
                    <div key={iv.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{ROUND_LABELS[iv.round_type] ?? iv.round_type}</span>
                          {iv.interviewer && <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">with {iv.interviewer}</span>}
                          {iv.scheduled_date && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{iv.scheduled_date.replace('T', ' ')}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {iv.outcome && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${iv.outcome === 'passed' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                : iv.outcome === 'failed' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                              }`}>{iv.outcome}</span>
                          )}
                          <button onClick={() => deleteInterview(iv.id)} className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300">Remove</button>
                        </div>
                      </div>
                      {iv.questions_asked && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Questions Asked</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{iv.questions_asked}</p>
                        </div>
                      )}
                      {iv.notes && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Notes</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{iv.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>

          {/* Right: Contacts */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">👥 Contacts</h2>
                <button onClick={() => setShowAddC(v => !v)} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium">
                  + Add
                </button>
              </div>

              {showAddC && (
                <form onSubmit={addContact} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4 space-y-2">
                  <input value={newC.name} required placeholder="Name *"
                    onChange={e => setNewC(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1.5 text-sm" />
                  <input value={newC.role} placeholder="Role (Recruiter, Hiring Manager...)"
                    onChange={e => setNewC(p => ({ ...p, role: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1.5 text-sm" />
                  <input value={newC.email} placeholder="Email" type="email"
                    onChange={e => setNewC(p => ({ ...p, email: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1.5 text-sm" />
                  <input value={newC.phone} placeholder="Phone"
                    onChange={e => setNewC(p => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1.5 text-sm" />
                  <div className="flex gap-2">
                    <button type="submit" className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">Add</button>
                    <button type="button" onClick={() => setShowAddC(false)} className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg">Cancel</button>
                  </div>
                </form>
              )}

              {job.contacts.length === 0
                ? <p className="text-sm text-gray-400 dark:text-gray-500">No contacts yet.</p>
                : <div className="space-y-3">
                  {job.contacts.map(c => (
                    <div key={c.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{c.name}</p>
                          {c.role && <p className="text-xs text-gray-400 dark:text-gray-500">{c.role}</p>}
                          {c.email && <a href={`mailto:${c.email}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline block mt-0.5">{c.email}</a>}
                          {c.phone && <p className="text-xs text-gray-500 dark:text-gray-400">{c.phone}</p>}
                        </div>
                        <button onClick={() => deleteContact(c.id)} className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">📅 Activity Timeline</h2>
              <ActivityTimeline items={job.activity} />
            </div>
          </div>
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">➕ Add Note</h2>
              <form onSubmit={addNote} className="space-y-3">
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  rows={4}
                  placeholder="Add a note — e.g. 'Followed up with recruiter', 'Got feedback', ..."
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  Add Note
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEdit && <JobForm job={job} onSave={handleUpdate} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
