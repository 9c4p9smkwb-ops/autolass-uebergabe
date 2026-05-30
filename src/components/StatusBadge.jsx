import { STATUS_CONFIG } from '../constants';

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  const pad = size === 'lg' ? '8px 14px' : '4px 10px';
  const fs = size === 'lg' ? 14 : 12;
  return (
    <span style={{
      display: 'inline-block',
      background: cfg.color,
      color: cfg.textColor,
      borderRadius: 20,
      padding: pad,
      fontSize: fs,
      fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {status}. {cfg.label}
    </span>
  );
}
