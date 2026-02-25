import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const COLUMNS = [
  { status: 'applied',      label: 'Applied',       color: 'border-blue-500',   bg: 'bg-blue-50',   count_bg: 'bg-blue-100 text-blue-700' },
  { status: 'phone_screen', label: 'Phone Screen',   color: 'border-violet-500', bg: 'bg-violet-50', count_bg: 'bg-violet-100 text-violet-700' },
  { status: 'oa',           label: 'OA',             color: 'border-yellow-500', bg: 'bg-yellow-50', count_bg: 'bg-yellow-100 text-yellow-700' },
  { status: 'technical',    label: 'Technical',      color: 'border-orange-500', bg: 'bg-orange-50', count_bg: 'bg-orange-100 text-orange-700' },
  { status: 'onsite',       label: 'Onsite',         color: 'border-pink-500',   bg: 'bg-pink-50',   count_bg: 'bg-pink-100 text-pink-700' },
  { status: 'offer',        label: '🎉 Offer',       color: 'border-green-500',  bg: 'bg-green-50',  count_bg: 'bg-green-100 text-green-700' },
  { status: 'rejected',     label: 'Rejected',       color: 'border-red-400',    bg: 'bg-red-50',    count_bg: 'bg-red-100 text-red-600' },
  { status: 'withdrawn',    label: 'Withdrawn',      color: 'border-gray-400',   bg: 'bg-gray-50',   count_bg: 'bg-gray-200 text-gray-600' },
];

function JobCard({ job, onDragStart, onDragEnd, isDragging }) {
  const navigate = useNavigate();
  const salaryStr = job.salary_min || job.salary_max
    ? `$${Math.round((job.salary_min || 0) / 1000)}k${job.salary_max ? ` – $${Math.round(job.salary_max / 1000)}k` : '+'}`
    : null;

  const daysAgo = job.applied_date
    ? Math.round((Date.now() - new Date(job.applied_date)) / 86400000)
    : null;

  const isUrgent = job.deadline && new Date(job.deadline) <= new Date(Date.now() + 3 * 86400000);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => navigate(`/jobs/${job.id}`)}
      className={`bg-white rounded-xl p-3.5 shadow-sm border cursor-pointer group transition-all duration-150 select-none
        ${isDragging ? 'opacity-40 scale-95 rotate-1 shadow-lg border-blue-300' : 'border-gray-100 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-200'}
      `}
    >
      {/* Company + remote badge */}
      <div className="flex items-start justify-between gap-1 mb-0.5">
        <p className="font-semibold text-sm text-gray-900 leading-tight line-clamp-1">{job.company}</p>
        {job.remote === 1 && (
          <span className="flex-shrink-0 text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">Remote</span>
        )}
      </div>

      {/* Position */}
      <p className="text-xs text-gray-500 leading-tight line-clamp-2 mb-2">{job.position}</p>

      {/* Salary */}
      {salaryStr && (
        <p className="text-xs font-semibold text-emerald-600 mb-1.5">{salaryStr}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1.5">
        {job.location && (
          <span className="text-[10px] text-gray-400 truncate max-w-[80px]">📍 {job.location}</span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {isUrgent && (
            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Due {job.deadline}</span>
          )}
          {daysAgo !== null && !isUrgent && (
            <span className="text-[10px] text-gray-400">{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoard({ jobs, onStatusChange }) {
  const [draggedJobId, setDraggedJobId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const byStatus = {};
  COLUMNS.forEach(col => {
    byStatus[col.status] = jobs.filter(j => j.status === col.status);
  });

  const handleDragStart = (e, jobId) => {
    setDraggedJobId(jobId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverColumn(status);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (draggedJobId !== null) {
      const job = jobs.find(j => j.id === draggedJobId);
      if (job && job.status !== newStatus) {
        onStatusChange(draggedJobId, newStatus);
      }
    }
    setDraggedJobId(null);
    setOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedJobId(null);
    setOverColumn(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
      {COLUMNS.map(col => {
        const colJobs = byStatus[col.status] || [];
        const isOver = overColumn === col.status;
        return (
          <div
            key={col.status}
            className={`flex-shrink-0 w-52 rounded-xl flex flex-col border-t-[3px] transition-all duration-150 ${col.color} ${
              isOver ? 'ring-2 ring-blue-400 ring-offset-1 bg-blue-50/60 scale-[1.01]' : col.bg
            }`}
            onDragOver={e => handleDragOver(e, col.status)}
            onDrop={e => handleDrop(e, col.status)}
            onDragLeave={e => {
              if (!e.currentTarget.contains(e.relatedTarget)) setOverColumn(null);
            }}
          >
            {/* Column header */}
            <div className="px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 tracking-wide">{col.label}</span>
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${col.count_bg}`}>
                {colJobs.length}
              </span>
            </div>

            {/* Cards drop zone */}
            <div className={`flex-1 px-2 pb-3 space-y-2 min-h-[80px] transition-colors rounded-b-xl ${
              isOver && colJobs.length === 0 ? 'bg-blue-100/50' : ''
            }`}>
              {colJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onDragStart={e => handleDragStart(e, job.id)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedJobId === job.id}
                />
              ))}
              {isOver && colJobs.length === 0 && (
                <div className="border-2 border-dashed border-blue-300 rounded-xl h-16 flex items-center justify-center">
                  <span className="text-xs text-blue-400 font-medium">Drop here</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
