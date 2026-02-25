const STYLES = {
  applied:      'bg-blue-100 text-blue-800',
  phone_screen: 'bg-yellow-100 text-yellow-800',
  oa:           'bg-indigo-100 text-indigo-800',
  technical:    'bg-orange-100 text-orange-800',
  onsite:       'bg-purple-100 text-purple-800',
  offer:        'bg-green-100 text-green-800',
  rejected:     'bg-red-100 text-red-800',
  withdrawn:    'bg-gray-100 text-gray-800',
};

export const STATUS_LABELS = {
  applied:      'Applied',
  phone_screen: 'Phone Screen',
  oa:           'Online Assessment',
  technical:    'Technical',
  onsite:       'Onsite',
  offer:        'Offer',
  rejected:     'Rejected',
  withdrawn:    'Withdrawn',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STYLES[status] ?? 'bg-gray-100 text-gray-800'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
