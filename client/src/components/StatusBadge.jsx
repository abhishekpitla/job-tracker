const STYLES = {
  applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  phone_screen: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300',
  oa: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  technical: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  onsite: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
  offer: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  withdrawn: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export const STATUS_LABELS = {
  applied: 'Applied',
  phone_screen: 'Phone Screen',
  oa: 'Online Assessment',
  technical: 'Technical',
  onsite: 'Onsite',
  offer: 'Offer 🎉',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STYLES[status] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
