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

  if (!stats) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 dark:text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  );

  const sm = Object.fromEntries(stats.byStatus.map(s => [s.status, s.count]));
  const active = ['applied', 'phone_screen', 'oa', 'technical', 'onsite'].reduce((sum, s) => sum + (sm[s] || 0), 0);

  const cards = [
    { label: 'Total Applied', value: stats.total, icon: '📋', color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'In Progress', value: active, icon: '⚡', color: 'bg-yellow-500', textColor: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
    { label: 'Offers', value: sm.offer || 0, icon: '🎉', color: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
    { label: 'Rejected', value: sm.rejected || 0, icon: '❌', color: 'bg-red-400', textColor: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your job search at a glance</p>
        </div>
        <Link to="/jobs"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + Add Job
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon, textColor, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-6 border border-transparent`}>
            <div className="text-2xl mb-2">{icon}</div>
            <div className={`text-4xl font-bold ${textColor}`}>{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline breakdown */}
      {stats.byStatus.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Pipeline Breakdown</h2>
          <div className="flex flex-wrap gap-3">
            {stats.byStatus.map(({ status, count }) => (
              <Link key={status} to={`/jobs`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <StatusBadge status={status} />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming deadlines */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">⏰ Upcoming Deadlines</h2>
          {stats.upcoming.length === 0
            ? <p className="text-sm text-gray-400 dark:text-gray-500">No upcoming deadlines 🎉</p>
            : <ul className="space-y-3">
              {stats.upcoming.map(job => (
                <li key={job.id} className="flex items-center justify-between">
                  <Link to={`/jobs/${job.id}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate flex-1 mr-3">
                    {job.company} — {job.position}
                  </Link>
                  <span className="text-sm text-red-500 font-medium flex-shrink-0">{job.deadline}</span>
                </li>
              ))}
            </ul>
          }
        </div>

        {/* Upcoming interviews */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">🗓 Upcoming Interviews</h2>
          {stats.upcomingInterviews.length === 0
            ? <p className="text-sm text-gray-400 dark:text-gray-500">No upcoming interviews scheduled</p>
            : <ul className="space-y-3">
              {stats.upcomingInterviews.map(iv => (
                <li key={iv.id} className="flex items-center justify-between">
                  <div>
                    <Link to={`/jobs/${iv.job_id}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {iv.company}
                    </Link>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{ROUND_LABELS[iv.round_type] ?? iv.round_type}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{iv.scheduled_date?.replace('T', ' ')}</span>
                </li>
              ))}
            </ul>
          }
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        <Link to="/jobs?view=kanban" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group">
          <div className="text-2xl mb-2">⊞</div>
          <div className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">Kanban Board</div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Drag & drop your pipeline</p>
        </Link>
        <Link to="/analytics" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group">
          <div className="text-2xl mb-2">📈</div>
          <div className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">Analytics</div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Stats & insights</p>
        </Link>
        <Link to="/prep" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group">
          <div className="text-2xl mb-2">🃏</div>
          <div className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">Practice Cards</div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Flashcard practice mode</p>
        </Link>
      </div>
    </div>
  );
}
