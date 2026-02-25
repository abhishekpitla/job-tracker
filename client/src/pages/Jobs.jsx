import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge, { STATUS_LABELS } from '../components/StatusBadge';
import JobForm from '../components/JobForm';

const STATUSES = ['all', 'applied', 'phone_screen', 'oa', 'technical', 'onsite', 'offer', 'rejected', 'withdrawn'];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (status !== 'all') p.set('status', status);
    if (search) p.set('search', search);
    const res = await fetch(`/api/jobs?${p}`);
    setJobs(await res.json());
  }, [status, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const job = await res.json();
    setShowForm(false);
    navigate(`/jobs/${job.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + Add Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Search company or role..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex flex-wrap gap-1">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">No jobs found</p>
            <p className="text-sm">Click "+ Add Job" to track your first application</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Company', 'Position', 'Status', 'Applied', 'Deadline', 'Location'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {jobs.map(job => (
                <tr key={job.id}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/jobs/${job.id}`)}>
                  <td className="px-6 py-4 font-medium text-gray-900">{job.company}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{job.position}</td>
                  <td className="px-6 py-4"><StatusBadge status={job.status} /></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{job.applied_date || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    {job.deadline
                      ? <span className="text-red-500 font-medium">{job.deadline}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {job.location || (job.remote ? 'Remote' : '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && <JobForm onSave={handleCreate} onClose={() => setShowForm(false)} />}
    </div>
  );
}
