import clsx from 'clsx';

const SIZES = {
  xs: { wh: 'w-6 h-6',   fs: 'text-[10px]', r: 'rounded' },
  sm: { wh: 'w-8 h-8',   fs: 'text-xs',     r: 'rounded-lg' },
  md: { wh: 'w-9 h-9',   fs: 'text-sm',     r: 'rounded-lg' },
  lg: { wh: 'w-10 h-10', fs: 'text-base',   r: 'rounded-xl' },
};

const ONLINE_COLORS = {
  online:  '#2eb67d',
  busy:    '#e01e5a',
  away:    '#ecb22e',
  offline: '#9ca3af',
};

export function Avatar({ initials, color, status, size = 'md', borderColor = '#1a1d2e', className }) {
  const s = SIZES[size] ?? SIZES.md;
  const dotSize = (size === 'xs' || size === 'sm') ? 8 : 10;

  return (
    <div className={clsx('relative inline-flex flex-shrink-0', className)}>
      <div
        className={clsx('av', s.wh, s.fs, s.r)}
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      {status && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width:  dotSize,
            height: dotSize,
            backgroundColor: ONLINE_COLORS[status] ?? ONLINE_COLORS.offline,
            borderColor,
          }}
        />
      )}
    </div>
  );
}
