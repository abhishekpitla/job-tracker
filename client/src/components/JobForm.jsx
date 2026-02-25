import { useState } from 'react';
import { STATUS_LABELS } from './StatusBadge';

const STATUSES = ['applied', 'phone_screen', 'oa', 'technical', 'onsite', 'offer', 'rejected', 'withdrawn'];

export default function JobForm({ job, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    company:      job?.company      ?? '',
    position:     job?.position     ?? '',
    location:     job?.location     ?? '',
    remote:       job?.remote       ?? false,
    url:          job?.url          ?? '',
    status:       job?.status       ?? 'applied',
    applied_date: job?.applied_date ?? today,
    deadline:     job?.deadline     ?? '',
    salary_min:   job?.salary_min   ?? '',
    salary_max:   job?.salary_max   ?? '',
    notes:        job?.notes        ?? '',
  });

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">{job ? 'Edit Job' : 'Add New Job'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <input name="company" value={form.company} onChange={set} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Google" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
              <input name="position" value={form.position} onChange={set} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Software Engineer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input name="location" value={form.location} onChange={set}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mountain View, CA" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={form.status} onChange={set}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Posting URL</label>
              <input name="url" value={form.url} onChange={set}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applied Date</label>
              <input name="applied_date" type="date" value={form.applied_date} onChange={set}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
              <input name="deadline" type="date" value={form.deadline} onChange={set}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Min ($)</label>
              <input name="salary_min" type="number" value={form.salary_min} onChange={set}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Max ($)</label>
              <input name="salary_max" type="number" value={form.salary_max} onChange={set}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="150000" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input name="remote" type="checkbox" checked={form.remote} onChange={set} id="remote"
              className="rounded border-gray-300" />
            <label htmlFor="remote" className="text-sm font-medium text-gray-700">Remote position</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" value={form.notes} onChange={set} rows={3} placeholder="Any notes about this job..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
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
