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

export function BloomIcon({ size = 28, opacity = 0.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="2.5" stroke={CREAM} strokeWidth="1" opacity={opacity} />
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const tipX = 14 + Math.cos(rad) * 9;
        const tipY = 14 + Math.sin(rad) * 9;
        const cp1x = 14 + Math.cos(rad - 0.4) * 5;
        const cp1y = 14 + Math.sin(rad - 0.4) * 5;
        const cp2x = 14 + Math.cos(rad + 0.4) * 5;
        const cp2y = 14 + Math.sin(rad + 0.4) * 5;
        return (
          <path
            key={angle}
            d={`M14 14 Q${cp1x} ${cp1y} ${tipX} ${tipY} Q${cp2x} ${cp2y} 14 14`}
            stroke={CREAM}
            strokeWidth="1"
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}

export function SwooshIcon({ size = 28, opacity = 0.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 14h20"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M7 10l-3 4 3 4"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
      <path
        d="M21 10l3 4-3 4"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
    </svg>
  );
}

export function InfoIcon({ size = 20, opacity = 0.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" stroke={CREAM} strokeWidth="1.2" opacity={opacity} />
      <path
        d="M10 9v5M10 6.5v0"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity}
      />
    </svg>
  );
}
