const COLORS = {
  Submitted: '#607d8b',
  'Under Review': '#f0ad4e',
  'Additional Info Requested': '#e07a1f',
  Approved: '#3c9d3c',
  Rejected: '#c0392b',
  Paid: '#2e7d32',
  Active: '#3c9d3c',
  Lapsed: '#c0392b',
};

export default function StatusBadge({ status }) {
  const color = COLORS[status] || '#888';
  return (
    <span
      className="status-badge"
      data-testid={`status-badge-${status.replace(/\s+/g, '-').toLowerCase()}`}
      style={{ backgroundColor: color }}
    >
      {status}
    </span>
  );
}
