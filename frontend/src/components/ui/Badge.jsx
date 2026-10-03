const VARIANT_MAP = {
  Active:   'success',
  Inactive: 'muted',
  Paid:     'success',
  Pending:  'warning',
  Overdue:  'danger',
  Partial:  'info',
  Present:  'success',
  Absent:   'danger',
  Late:     'warning',
  Leave:    'info',
  'On Leave': 'warning',
  Transferred: 'info',
  Male:   'info',
  Female: 'purple',
  A:   'success',
  'A+': 'success',
  B:   'info',
  'B+': 'info',
  C:   'warning',
  D:   'warning',
  F:   'danger',
};

export default function Badge({ text }) {
  const variant = VARIANT_MAP[text] || 'muted';
  return <span className={`badge badge-${variant}`}>{text}</span>;
}
