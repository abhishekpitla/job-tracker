import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
    applied: '#3b82f6',
    phone_screen: '#8b5cf6',
    oa: '#eab308',
    technical: '#f97316',
    onsite: '#ec4899',
    offer: '#22c55e',
    rejected: '#ef4444',
    withdrawn: '#9ca3af',
};

const STATUS_LABELS = {
    applied: 'Applied', phone_screen: 'Phone Screen', oa: 'OA',
    technical: 'Technical', onsite: 'Onsite', offer: 'Offer',
    rejected: 'Rejected', withdrawn: 'Withdrawn',
};

// Simple horizontal bar chart
function HBarChart({ data, colorKey }) {
    if (!data || data.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-500">No data</p>;
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="space-y-2">
            {data.map(d => (
                <div key={d.label || d.status || d.source} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-28 flex-shrink-0 truncate text-right">
                        {STATUS_LABELS[d.status] || d.source || d.label || d.status}
                    </span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                        <div
                            className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                            style={{
                                width: `${(d.count / max) * 100}%`,
                                backgroundColor: colorKey ? STATUS_COLORS[d.status] || '#6366f1' : '#6366f1',
                                minWidth: d.count > 0 ? '28px' : '0',
                            }}
                        >
                            <span className="text-[10px] font-bold text-white">{d.count}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Simple line chart using SVG
function WeeklyLineChart({ data }) {
    if (!data || data.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">No weekly data yet</p>;

    const W = 500, H = 140, PAD = { top: 10, right: 20, bottom: 30, left: 30 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const maxVal = Math.max(...data.map(d => d.count), 1);

    const xScale = i => PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
    const yScale = v => H - PAD.bottom - (v / maxVal) * innerH;

    const polyline = data.map((d, i) => `${xScale(i)},${yScale(d.count)}`).join(' ');
    const area = [
        `${xScale(0)},${H - PAD.bottom}`,
        ...data.map((d, i) => `${xScale(i)},${yScale(d.count)}`),
        `${xScale(data.length - 1)},${H - PAD.bottom}`,
    ].join(' ');

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 160 }}>
                <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => (
                    <line key={t}
                        x1={PAD.left} y1={PAD.top + innerH * (1 - t)}
                        x2={W - PAD.right} y2={PAD.top + innerH * (1 - t)}
                        stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4"
                    />
                ))}

                {/* Area fill */}
                <polygon points={area} fill="url(#lineGrad)" />

                {/* Line */}
                <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

                {/* Dots */}
                {data.map((d, i) => (
                    <g key={i}>
                        <circle cx={xScale(i)} cy={yScale(d.count)} r="4" fill="white" stroke="#6366f1" strokeWidth="2" />
                        <text x={xScale(i)} y={yScale(d.count) - 8} textAnchor="middle" fontSize="9" fill="#6366f1" fontWeight="600">
                            {d.count}
                        </text>
                    </g>
                ))}

                {/* X-axis labels */}
                {data.map((d, i) => (
                    <text key={i} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#9ca3af">
                        {(d.week || '').split('-W')[1] ? `W${(d.week || '').split('-W')[1]}` : d.week}
                    </text>
                ))}
            </svg>
        </div>
    );
}

// Donut chart using SVG
function DonutChart({ data }) {
    if (!data || data.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-500">No data</p>;
    const total = data.reduce((s, d) => s + d.count, 0);
    if (total === 0) return <p className="text-sm text-gray-400 dark:text-gray-500">No data</p>;

    const CX = 60, CY = 60, R = 50, INNER_R = 32;
    let angle = -Math.PI / 2;
    const slices = data.map(d => {
        const start = angle;
        const sweep = (d.count / total) * 2 * Math.PI;
        angle += sweep;
        return { ...d, start, sweep };
    });

    const arc = (startA, sweepA) => {
        const x1 = CX + R * Math.cos(startA);
        const y1 = CY + R * Math.sin(startA);
        const x2 = CX + R * Math.cos(startA + sweepA);
        const y2 = CY + R * Math.sin(startA + sweepA);
        const xi1 = CX + INNER_R * Math.cos(startA);
        const yi1 = CY + INNER_R * Math.sin(startA);
        const xi2 = CX + INNER_R * Math.cos(startA + sweepA);
        const yi2 = CY + INNER_R * Math.sin(startA + sweepA);
        const largeArc = sweepA > Math.PI ? 1 : 0;
        return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${xi1} ${yi1} Z`;
    };

    return (
        <div className="flex items-center gap-4">
            <svg viewBox="0 0 120 120" width="120" height="120" className="flex-shrink-0">
                {slices.map((s, i) => (
                    <path key={i} d={arc(s.start, s.sweep)}
                        fill={STATUS_COLORS[s.status] || '#6366f1'}
                        className="hover:opacity-80 transition-opacity cursor-pointer" />
                ))}
                <text x={CX} y={CY - 4} textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor" className="text-gray-800">{total}</text>
                <text x={CX} y={CY + 10} textAnchor="middle" fontSize="7" fill="#9ca3af">total</text>
            </svg>
            <div className="flex-1 space-y-1.5 min-w-0">
                {slices.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[s.status] || '#6366f1' }} />
                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{STATUS_LABELS[s.status] || s.status}</span>
                        <span className="ml-auto text-xs font-semibold text-gray-700 dark:text-gray-200">{s.count}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right">{Math.round((s.count / total) * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Analytics() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetch('/api/stats').then(r => r.json()).then(setStats);
    }, []);

    if (!stats) return (
        <div className="flex items-center justify-center py-32">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400 dark:text-gray-500 text-sm">Loading analytics...</p>
            </div>
        </div>
    );

    const sm = Object.fromEntries(stats.byStatus.map(s => [s.status, s.count]));
    const total = stats.total || 1;
    const offers = sm.offer || 0;
    const responded = stats.byStatus.filter(s => s.status !== 'applied').reduce((a, s) => a + s.count, 0);
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
    const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;
    const activeCount = ['phone_screen', 'oa', 'technical', 'onsite'].reduce((s, k) => s + (sm[k] || 0), 0);

    const kpis = [
        { label: 'Total Applied', value: stats.total, sub: 'all time', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
        { label: 'Response Rate', value: `${responseRate}%`, sub: `${responded} responded`, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30' },
        { label: 'Active Pipeline', value: activeCount, sub: 'in progress', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
        { label: 'Offer Rate', value: `${offerRate}%`, sub: `${offers} offers`, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
        { label: 'Rejected', value: sm.rejected || 0, sub: `${total > 0 ? Math.round(((sm.rejected || 0) / total) * 100) : 0}% rejection rate`, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Insights into your job search performance</p>
                </div>
                <a
                    href="/api/export/csv"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    ⬇ Export CSV
                </a>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {kpis.map(k => (
                    <div key={k.label} className={`rounded-xl p-5 ${k.bg} border border-transparent`}>
                        <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-1">{k.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{k.sub}</div>
                    </div>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Pipeline Funnel */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Pipeline by Stage</h2>
                    <HBarChart data={stats.byStatus} colorKey />
                </div>

                {/* Status Donut */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Status Breakdown</h2>
                    <DonutChart data={stats.byStatus} />
                </div>

                {/* Weekly trend */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Applications per Week</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Last 8 weeks</p>
                    <WeeklyLineChart data={stats.weeklyApps} />
                </div>

                {/* Source breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Applications by Source</h2>
                    {stats.bySource && stats.bySource.length > 0
                        ? <HBarChart data={stats.bySource.map(s => ({ ...s, label: s.source }))} />
                        : (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">No source data yet</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Add a "Source" when creating jobs to see where your applications come from</p>
                            </div>
                        )
                    }
                </div>
            </div>

            {/* Upcoming summary */}
            {(stats.upcoming.length > 0 || stats.upcomingInterviews.length > 0) && (
                <div className="grid md:grid-cols-2 gap-6">
                    {stats.upcoming.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">⏰ Upcoming Deadlines</h2>
                            <ul className="space-y-3">
                                {stats.upcoming.map(job => (
                                    <li key={job.id} className="flex items-center justify-between">
                                        <Link to={`/jobs/${job.id}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                            {job.company} — {job.position}
                                        </Link>
                                        <span className="text-sm text-red-500 font-medium">{job.deadline}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {stats.upcomingInterviews.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">🗓 Upcoming Interviews</h2>
                            <ul className="space-y-3">
                                {stats.upcomingInterviews.map(iv => (
                                    <li key={iv.id} className="flex items-center justify-between">
                                        <Link to={`/jobs/${iv.job_id}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                            {iv.company}
                                        </Link>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{iv.scheduled_date?.replace('T', ' ')}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
