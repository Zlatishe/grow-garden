const CREAM = '#E9E8D5';

function VineGrowIcon({ size = 36, opacity = 0.7 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 26C14 26 13.8 20 13.5 16C13.2 12 13 8 14 4" stroke={CREAM} strokeWidth="1.5" strokeLinecap="round" opacity={opacity} />
      <path d="M13.4 18C15 16.5 17.5 16 19 16.5" stroke={CREAM} strokeWidth="1.2" strokeLinecap="round" opacity={opacity * 0.8} />
      <path d="M13.2 12C11.5 11 9 11.5 8 13" stroke={CREAM} strokeWidth="1.2" strokeLinecap="round" opacity={opacity * 0.8} />
      <path d="M13.8 7C15.5 6 17.5 5.5 19 6" stroke={CREAM} strokeWidth="1.1" strokeLinecap="round" opacity={opacity * 0.7} />
    </svg>
  );
}

function FlowerBloomIcon({ size = 36, opacity = 0.7 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 26V16" stroke={CREAM} strokeWidth="1.4" strokeLinecap="round" opacity={opacity * 0.6} />
      <path d="M14.8 11.5C15.5 10 16.8 7.5 19 7C18.8 9 17.5 11 14.8 11.5Z" stroke={CREAM} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
      <path d="M13.2 11.5C12.5 10 11.2 7.5 9 7C9.2 9 10.5 11 13.2 11.5Z" stroke={CREAM} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
      <path d="M15 12.5C16.5 12.5 19 13 20 15C18 14.8 15.8 13.8 15 12.5Z" stroke={CREAM} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
      <path d="M13 12.5C11.5 12.5 9 13 8 15C10 14.8 12.2 13.8 13 12.5Z" stroke={CREAM} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
      <circle cx="14" cy="12" r="1.3" stroke={CREAM} strokeWidth="0.8" opacity={opacity * 0.6} />
    </svg>
  );
}

function LeafSproutIcon({ size = 36, opacity = 0.7 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 26C14 24 13.8 21 14 19" stroke={CREAM} strokeWidth="1.4" strokeLinecap="round" opacity={opacity * 0.6} />
      <path d="M14 19C11.5 16.5 8 13 6 10C8 9.5 12 9 16 11.5C20 14 20 17 14 19Z" stroke={CREAM} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
      <path d="M6.5 10.5L14 19" stroke={CREAM} strokeWidth="0.9" strokeLinecap="round" opacity={opacity * 0.5} />
      <path d="M9 12.5L10.5 14.5" stroke={CREAM} strokeWidth="0.7" strokeLinecap="round" opacity={opacity * 0.35} />
      <path d="M8.5 14.5L10.5 16" stroke={CREAM} strokeWidth="0.7" strokeLinecap="round" opacity={opacity * 0.35} />
      <path d="M11.5 13L13 15" stroke={CREAM} strokeWidth="0.7" strokeLinecap="round" opacity={opacity * 0.35} />
    </svg>
  );
}

export default function GestureIconsPreview() {
  return (
    <div style={{
      background: '#33442A',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 48,
      fontFamily: "'Josefin Sans', sans-serif",
    }}>
      <div style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
        {[
          { icon: <VineGrowIcon size={48} opacity={0.8} />, label: 'Grow' },
          { icon: <FlowerBloomIcon size={48} opacity={0.8} />, label: 'Bloom' },
          { icon: <LeafSproutIcon size={48} opacity={0.8} />, label: 'Leaf' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {item.icon}
            <span style={{ color: CREAM, fontSize: 16, opacity: 0.7, letterSpacing: 2 }}>{item.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
        {[
          { icon: <VineGrowIcon size={32} opacity={0.7} />, label: 'Small' },
          { icon: <FlowerBloomIcon size={32} opacity={0.7} />, label: 'Small' },
          { icon: <LeafSproutIcon size={32} opacity={0.7} />, label: 'Small' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {item.icon}
            <span style={{ color: CREAM, fontSize: 13, opacity: 0.5 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
