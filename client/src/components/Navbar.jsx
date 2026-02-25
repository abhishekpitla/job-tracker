import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/jobs', label: 'Jobs' },
  { path: '/prep', label: 'Interview Prep' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">Job Tracker</span>
          </div>
          <div className="flex gap-1">
            {navItems.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
