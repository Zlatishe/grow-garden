const CREAM = '#E9E8D5';

interface IconProps {
  size?: number;
  opacity?: number;
}

export function RotateIcon({ size = 28, opacity = 0.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 4C8.477 4 4 8.477 4 14s4.477 10 10 10 10-4.477 10-10"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M24 4v6h-6"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
      <path
        d="M24 10c-1.5-3.5-5-6-9.5-6"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity}
      />
    </svg>
  );
}

export function OpenPalmIcon({ size = 28, opacity = 0.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 24v-8"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M14 16V4"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M10 16V6"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M18 16V6"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M6 16V10"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M22 16V10"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M6 16c0 4.418 3.582 8 8 8s8-3.582 8-8"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity}
      />
    </svg>
  );
}

export function PinchIcon({ size = 28, opacity = 0.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 10l5 5"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M20 10l-5 5"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity}
      />
      <circle
        cx="14"
        cy="16"
        r="2"
        stroke={CREAM}
        strokeWidth="1"
        opacity={opacity}
      />
      <path
        d="M14 18v4"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M6 6l2 1M22 6l-2 1M14 4v2"
        stroke={CREAM}
        strokeWidth="1"
        strokeLinecap="round"
        opacity={opacity * 0.6}
      />
    </svg>
  );
}
