import logo from "@/assets/somatic-pause-logo.png";

const sizes = {
  sm: { img: 36, fontSize: '11px', gap: '10px', pl: '10px' },
  md: { img: 72, fontSize: '15px', gap: '14px', pl: '14px' },
  lg: { img: 88, fontSize: '17px', gap: '16px', pl: '16px' },
};

export default function SomaticLogo({ size = 'md' }) {
  const s = sizes[size];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.gap }}>
      <div style={{
        width: s.img, height: s.img,
        borderRadius: '50%', overflow: 'hidden',
        background: '#f5f3ef', flexShrink: 0,
        filter: 'drop-shadow(0 4px 12px rgba(155,142,196,0.3))',
      }}>
        <img
          src={logo}
          alt="Somatic Pause"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 12%' }}
        />
      </div>
      <div style={{ borderLeft: '2px solid #e0dcea', paddingLeft: s.pl }}>
        <div style={{ fontSize: s.fontSize, fontWeight: 800, color: '#2d2840', letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1.25 }}>Somatic</div>
        <div style={{ fontSize: s.fontSize, fontWeight: 800, color: '#9b8ec4', letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1.25 }}>Pause</div>
      </div>
    </div>
  );
}
