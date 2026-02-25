import { useState } from 'react';
import { STATUS_LABELS } from './StatusBadge';

const STATUSES = ['applied', 'phone_screen', 'oa', 'technical', 'onsite', 'offer', 'rejected', 'withdrawn'];
const SOURCES = ['LinkedIn', 'Company Website', 'Referral', 'Indeed', 'Glassdoor', 'AngelList / Wellfound', 'Handshake', 'Recruiter', 'Job Fair', 'Other'];

export default function JobForm({ job, onSave, onClose }) {
  const [aiText, setAiText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [aiError, setAiError] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    company: job?.company ?? '',
    position: job?.position ?? '',
    location: job?.location ?? '',
    remote: job?.remote ?? false,
    url: job?.url ?? '',
    status: job?.status ?? 'applied',
    applied_date: job?.applied_date ?? today,
    deadline: job?.deadline ?? '',
    salary_min: job?.salary_min ?? '',
    salary_max: job?.salary_max ?? '',
    notes: job?.notes ?? '',
    priority: job?.priority ?? 0,
    source: job?.source ?? '',
  });

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const inputCls = "w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    setIsParsing(true);
    setAiError('');
    try {
      const res = await fetch('http://localhost:3001/api/ai/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse');

      setForm(p => ({
        ...p,
        company: data.company || p.company,
        position: data.position || p.position,
        location: data.location || p.location,
        remote: data.remote ?? p.remote,
        salary_min: data.salary_min || p.salary_min,
        salary_max: data.salary_max || p.salary_max,
        notes: data.notes ? (p.notes ? p.notes + '\\n\\n' + data.notes : data.notes) : p.notes
      }));
      setAiText('');
    } catch (err) {
      setAiError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{job ? '✏️ Edit Job' : '➕ Add New Job'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
        </div>

        {!job && (
          <div className="mx-6 mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
            <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
              <span>✨</span> AI Auto-Fill
            </h3>
            <p className="text-xs text-indigo-700 dark:text-indigo-400 mb-3">Paste a job description to automatically extract details.</p>
            <div className="flex gap-2">
              <textarea
                rows="2"
                value={aiText}
                onChange={e => setAiText(e.target.value)}
                placeholder="Paste job description text here..."
                className="flex-1 w-full border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAiParse}
                disabled={isParsing || !aiText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors break-keep"
              >
                {isParsing ? 'Processing...' : 'Auto-Fill'}
              </button>
            </div>
            {aiError && <p className="text-xs text-red-500 mt-2 font-medium">{aiError}</p>}
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Company *</label>
              <input name="company" value={form.company} onChange={set} required className={inputCls} placeholder="Google" />
            </div>
            <div>
              <label className={labelCls}>Position *</label>
              <input name="position" value={form.position} onChange={set} required className={inputCls} placeholder="Software Engineer" />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input name="location" value={form.location} onChange={set} className={inputCls} placeholder="Mountain View, CA" />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select name="status" value={form.status} onChange={set} className={inputCls}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Job Posting URL</label>
              <input name="url" value={form.url} onChange={set} className={inputCls} placeholder="https://..." />
            </div>
            <div>
              <label className={labelCls}>Applied Date</label>
              <input name="applied_date" type="date" value={form.applied_date} onChange={set} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Application Deadline</label>
              <input name="deadline" type="date" value={form.deadline} onChange={set} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Salary Min ($)</label>
              <input name="salary_min" type="number" value={form.salary_min} onChange={set} className={inputCls} placeholder="100000" />
            </div>
            <div>
              <label className={labelCls}>Salary Max ($)</label>
              <input name="salary_max" type="number" value={form.salary_max} onChange={set} className={inputCls} placeholder="150000" />
            </div>
            <div>
              <label className={labelCls}>Source</label>
              <select name="source" value={form.source} onChange={set} className={inputCls}>
                <option value="">— Select source —</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority (1–5 stars)</label>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button"
                    onClick={() => setForm(p => ({ ...p, priority: star === p.priority ? 0 : star }))}
                    className="text-2xl transition-transform hover:scale-110"
                  >
                    <span className={star <= (form.priority || 0) ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-600'}>★</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input name="remote" type="checkbox" checked={form.remote} onChange={set} id="remote" className="rounded border-gray-300" />
            <label htmlFor="remote" className="text-sm font-medium text-gray-700 dark:text-gray-300">Remote position</label>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={set} rows={3} placeholder="Any notes about this job..."
              className={`${inputCls} resize-none`} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              {job ? 'Save Changes' : 'Add Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
