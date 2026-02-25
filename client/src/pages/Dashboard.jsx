import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

const ROUND_LABELS = {
  hr_screen: 'HR Screen', phone_screen: 'Phone Screen', online_assessment: 'OA',
  technical: 'Technical', system_design: 'System Design', behavioral: 'Behavioral',
  onsite: 'Onsite', other: 'Other',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats);
  }, []);

  if (!stats) return <div className="text-center py-16 text-gray-400">Loading...</div>;

  const sm = Object.fromEntries(stats.byStatus.map(s => [s.status, s.count]));
  const active = ['applied', 'phone_screen', 'oa', 'technical', 'onsite'].reduce((sum, s) => sum + (sm[s] || 0), 0);

  const cards = [
    { label: 'Total Applied', value: stats.total, color: 'bg-blue-500', text: 'text-blue-700' },
    { label: 'In Progress', value: active, color: 'bg-yellow-500', text: 'text-yellow-700' },
    { label: 'Offers', value: sm.offer || 0, color: 'bg-green-500', text: 'text-green-700' },
    { label: 'Rejected', value: sm.rejected || 0, color: 'bg-red-500', text: 'text-red-700' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/jobs" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Job
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(({ label, value, color, text }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className={`w-8 h-1.5 ${color} rounded-full mb-4`} />
            <div className={`text-4xl font-bold ${text}`}>{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline breakdown */}
      {stats.byStatus.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Breakdown</h2>
          <div className="flex flex-wrap gap-3">
            {stats.byStatus.map(({ status, count }) => (
              <div key={status} className="flex items-center gap-2">
                <StatusBadge status={status} />
                <span className="text-sm font-semibold text-gray-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming deadlines */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
          {stats.upcoming.length === 0
            ? <p className="text-sm text-gray-400">No upcoming deadlines</p>
            : <ul className="space-y-3">
                {stats.upcoming.map(job => (
                  <li key={job.id} className="flex items-center justify-between">
                    <Link to={`/jobs/${job.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {job.company} — {job.position}
                    </Link>
                    <span className="text-sm text-red-500 font-medium">{job.deadline}</span>
                  </li>
                ))}
              </ul>
          }
        </div>

        {/* Upcoming interviews */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Interviews</h2>
          {stats.upcomingInterviews.length === 0
            ? <p className="text-sm text-gray-400">No upcoming interviews</p>
            : <ul className="space-y-3">
                {stats.upcomingInterviews.map(iv => (
                  <li key={iv.id} className="flex items-center justify-between">
                    <div>
                      <Link to={`/jobs/${iv.job_id}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {iv.company}
                      </Link>
                      <p className="text-xs text-gray-400">{ROUND_LABELS[iv.round_type] ?? iv.round_type}</p>
                    </div>
                    <span className="text-xs text-gray-500">{iv.scheduled_date?.replace('T', ' ')}</span>
                  </li>
                ))}
              </ul>
          }
        </div>
      </div>
    </div>
  );
}
