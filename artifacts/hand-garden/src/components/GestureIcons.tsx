const CREAM = '#E9E8D5';

interface IconProps {
  size?: number;
  opacity?: number;
}

export function FistRotateIcon({ size = 36, opacity = 0.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="8" y="9" width="10" height="11" rx="3"
        stroke={CREAM}
        strokeWidth="1.8"
        opacity={opacity}
      />
      <path
        d="M8 13h-1.5a1.5 1.5 0 0 1 0-3H8"
        stroke={CREAM}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={opacity * 0.7}
      />
      <path
        d="M3 20c1.5-1 3-1 4.5 0"
        stroke={CREAM}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={opacity * 0.5}
      />
      <path
        d="M22 8v4"
        stroke={CREAM}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={opacity * 0.6}
      />
      <path
        d="M20 6l2 2 2-2"
        stroke={CREAM}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 0.6}
      />
      <path
        d="M22 20v-4"
        stroke={CREAM}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={opacity * 0.6}
      />
      <path
        d="M20 22l2-2 2 2"
        stroke={CREAM}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 0.6}
      />
    </svg>
  );
}

export function RotateIcon({ size = 36, opacity = 0.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 4C8.477 4 4 8.477 4 14s4.477 10 10 10 10-4.477 10-10"
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M24 4v6h-6"
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
      <path
        d="M24 10c-1.5-3.5-5-6-9.5-6"
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={opacity}
      />
    </svg>
  );
}

export function OpenPalmIcon({ size = 36, opacity = 0.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 24v-8"
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M14 16V4"
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M10 16V6"
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M18 16V6"
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M6 16V10"
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M22 16V10"
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M6 16c0 4.418 3.582 8 8 8s8-3.582 8-8"
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={opacity}
      />
    </svg>
  );
}

export function PinchIcon({ size = 36, opacity = 0.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 10l5 5"
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M20 10l-5 5"
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={opacity}
      />
      <circle
        cx="14"
        cy="16"
        r="2"
        stroke={CREAM}
        strokeWidth="1.5"
        opacity={opacity}
      />
      <path
        d="M14 18v4"
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M6 6l2 1M22 6l-2 1M14 4v2"
        stroke={CREAM}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={opacity * 0.6}
      />
    </svg>
  );
}
