const CREAM = '#E9E8D5';

interface IconProps {
  size?: number;
  opacity?: number;
}

export function VineGrowIcon({ size = 36, opacity = 0.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 26C14 26 14 20 13.5 16C13 12 12 9 13 6C14 3 14 2 14 2"
        stroke={CREAM}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity={opacity}
      />
      <path
        d="M13.5 16C15 14.5 18 13 20 13.5"
        stroke={CREAM}
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity={opacity * 0.8}
      />
      <path
        d="M13 10C11 9 8.5 9.5 7.5 11"
        stroke={CREAM}
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity={opacity * 0.8}
      />
      <path
        d="M13.5 6.5C15.5 5.5 17 4 17.5 3"
        stroke={CREAM}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity={opacity * 0.6}
      />
      <circle
        cx="20.5" cy="13.5" r="1"
        stroke={CREAM}
        strokeWidth="0.8"
        opacity={opacity * 0.5}
      />
      <circle
        cx="7" cy="11.5" r="1"
        stroke={CREAM}
        strokeWidth="0.8"
        opacity={opacity * 0.5}
      />
    </svg>
  );
}

export function FlowerBloomIcon({ size = 36, opacity = 0.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 26V16"
        stroke={CREAM}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={opacity * 0.7}
      />
      <path
        d="M14 12C14 12 14 9.5 12 8C10 6.5 8.5 7.5 9 9C9.5 10.5 11 11.5 14 12Z"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
      <path
        d="M14 12C14 12 14 9.5 16 8C18 6.5 19.5 7.5 19 9C18.5 10.5 17 11.5 14 12Z"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
      <path
        d="M14 12C14 12 11.5 11 9.5 11.5C7.5 12 7.5 13.5 9 14C10.5 14.5 12.5 13.5 14 12Z"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
      <path
        d="M14 12C14 12 16.5 11 18.5 11.5C20.5 12 20.5 13.5 19 14C17.5 14.5 15.5 13.5 14 12Z"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
      <path
        d="M14 12C14 12 12 13.5 11.5 15.5C11 17.5 12 18.5 13.5 17.5C14.5 16.8 14.5 14.5 14 12Z"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 0.9}
      />
      <path
        d="M14 12C14 12 16 13.5 16.5 15.5C17 17.5 16 18.5 14.5 17.5C13.5 16.8 13.5 14.5 14 12Z"
        stroke={CREAM}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 0.9}
      />
      <circle
        cx="14" cy="12" r="2"
        stroke={CREAM}
        strokeWidth="1"
        opacity={opacity * 0.6}
      />
    </svg>
  );
}

export function LeafSproutIcon({ size = 36, opacity = 0.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 26C14 24 13.5 20 14 17"
        stroke={CREAM}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={opacity * 0.7}
      />
      <path
        d="M14 17C14 17 10 14 7 11C4 8 5 4 5 4C5 4 9 3 13 6C17 9 18 13 14 17Z"
        stroke={CREAM}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
      <path
        d="M14 17C12 14 9 10 5 4"
        stroke={CREAM}
        strokeWidth="1"
        strokeLinecap="round"
        opacity={opacity * 0.5}
      />
      <path
        d="M9 10.5C10.5 10 12 10.5 13 12"
        stroke={CREAM}
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity={opacity * 0.4}
      />
      <path
        d="M7.5 7.5C9 7.5 10.5 8.5 11 10"
        stroke={CREAM}
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity={opacity * 0.4}
      />
      <path
        d="M15 19C17 18 19 18.5 20 20"
        stroke={CREAM}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity={opacity * 0.5}
      />
      <path
        d="M20 20C20 20 21.5 17 20 16C18.5 15 16 17 15 19C16.5 19.5 18.5 19 20 20Z"
        stroke={CREAM}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 0.6}
      />
    </svg>
  );
}
