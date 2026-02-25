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

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddIv, setShowAddIv] = useState(false);
  const [showAddC, setShowAddC] = useState(false);
  const [newIv, setNewIv] = useState(BLANK_INTERVIEW);
  const [newC, setNewC] = useState(BLANK_CONTACT);

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

  if (!job) return <div className="text-center py-16 text-gray-400">Loading...</div>;

  const salary = job.salary_min || job.salary_max
    ? `$${(job.salary_min || '?').toLocaleString()} – $${(job.salary_max || '?').toLocaleString()}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/jobs')} className="text-sm text-blue-600 hover:underline mb-3 block">
          ← Back to Jobs
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.company}</h1>
            <p className="text-xl text-gray-500 mt-1">{job.position}</p>
            <div className="flex items-center flex-wrap gap-2 mt-3">
              <StatusBadge status={job.status} />
              {job.location && <span className="text-sm text-gray-500">{job.location}</span>}
              {job.remote ? <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-medium">Remote</span> : null}
              {salary && <span className="text-sm text-gray-600 font-medium">{salary}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setShowEdit(true)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
              Edit
            </button>
            <button onClick={handleDelete}
              className="px-3 py-2 text-sm border border-red-200 rounded-lg hover:bg-red-50 text-red-500">
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: details + interviews */}
        <div className="md:col-span-2 space-y-6">

          {/* Job info */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
            <dl className="grid grid-cols-2 gap-y-3 gap-x-6">
              {job.applied_date && <div><dt className="text-xs font-medium text-gray-400 uppercase">Applied</dt><dd className="text-sm text-gray-800 mt-0.5">{job.applied_date}</dd></div>}
              {job.deadline && <div><dt className="text-xs font-medium text-gray-400 uppercase">Deadline</dt><dd className="text-sm text-red-500 font-medium mt-0.5">{job.deadline}</dd></div>}
              {job.url && (
                <div className="col-span-2">
                  <dt className="text-xs font-medium text-gray-400 uppercase">Job Posting</dt>
                  <dd className="mt-0.5">
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{job.url}</a>
                  </dd>
                </div>
              )}
            </dl>
            {job.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.notes}</p>
              </div>
            )}
          </div>

          {/* Interview Rounds */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Interview Rounds</h2>
              <button onClick={() => setShowAddIv(v => !v)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                + Add Round
              </button>
            </div>

            {showAddIv && (
              <form onSubmit={addInterview} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Round Type</label>
                    <select value={newIv.round_type} onChange={e => setNewIv(p => ({...p, round_type: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {ROUND_TYPES.map(t => <option key={t} value={t}>{ROUND_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Date & Time</label>
                    <input type="datetime-local" value={newIv.scheduled_date}
                      onChange={e => setNewIv(p => ({...p, scheduled_date: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Interviewer</label>
                    <input value={newIv.interviewer} placeholder="Name or team"
                      onChange={e => setNewIv(p => ({...p, interviewer: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Outcome</label>
                    <select value={newIv.outcome} onChange={e => setNewIv(p => ({...p, outcome: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="">Pending</option>
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Questions Asked</label>
                  <textarea value={newIv.questions_asked} rows={2} placeholder="List the questions that were asked..."
                    onChange={e => setNewIv(p => ({...p, questions_asked: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">My Notes</label>
                  <textarea value={newIv.notes} rows={2} placeholder="How it went, feedback, follow-ups..."
                    onChange={e => setNewIv(p => ({...p, notes: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">Add</button>
                  <button type="button" onClick={() => setShowAddIv(false)} className="text-sm text-gray-500 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            )}

            {job.interviews.length === 0
              ? <p className="text-sm text-gray-400">No interview rounds yet. Add one above.</p>
              : <div className="space-y-4">
                  {job.interviews.map(iv => (
                    <div key={iv.id} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-medium text-gray-900 text-sm">{ROUND_LABELS[iv.round_type] ?? iv.round_type}</span>
                          {iv.interviewer && <span className="text-sm text-gray-500 ml-2">with {iv.interviewer}</span>}
                          {iv.scheduled_date && <p className="text-xs text-gray-400 mt-0.5">{iv.scheduled_date.replace('T', ' ')}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {iv.outcome && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                              iv.outcome === 'passed' ? 'bg-green-100 text-green-700'
                              : iv.outcome === 'failed' ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                            }`}>{iv.outcome}</span>
                          )}
                          <button onClick={() => deleteInterview(iv.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                        </div>
                      </div>
                      {iv.questions_asked && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-400 uppercase mb-1">Questions Asked</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{iv.questions_asked}</p>
                        </div>
                      )}
                      {iv.notes && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-400 uppercase mb-1">Notes</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{iv.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>

        {/* Right: contacts */}
        <div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
              <button onClick={() => setShowAddC(v => !v)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                + Add
              </button>
            </div>

            {showAddC && (
              <form onSubmit={addContact} className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
                <input value={newC.name} required placeholder="Name *"
                  onChange={e => setNewC(p => ({...p, name: e.target.value}))}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                <input value={newC.role} placeholder="Role (Recruiter, Hiring Manager...)"
                  onChange={e => setNewC(p => ({...p, role: e.target.value}))}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                <input value={newC.email} placeholder="Email" type="email"
                  onChange={e => setNewC(p => ({...p, email: e.target.value}))}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                <input value={newC.phone} placeholder="Phone"
                  onChange={e => setNewC(p => ({...p, phone: e.target.value}))}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                <div className="flex gap-2">
                  <button type="submit" className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">Add</button>
                  <button type="button" onClick={() => setShowAddC(false)} className="text-xs text-gray-500 px-3 py-1.5 border border-gray-200 rounded-lg">Cancel</button>
                </div>
              </form>
            )}

            {job.contacts.length === 0
              ? <p className="text-sm text-gray-400">No contacts yet.</p>
              : <div className="space-y-3">
                  {job.contacts.map(c => (
                    <div key={c.id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{c.name}</p>
                          {c.role && <p className="text-xs text-gray-400">{c.role}</p>}
                          {c.email && <a href={`mailto:${c.email}`} className="text-xs text-blue-600 hover:underline block">{c.email}</a>}
                          {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
                        </div>
                        <button onClick={() => deleteContact(c.id)} className="text-xs text-red-400 hover:text-red-600">×</button>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      </div>

      {showEdit && <JobForm job={job} onSave={handleUpdate} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
