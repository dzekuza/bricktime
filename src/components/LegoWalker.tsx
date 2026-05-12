export default function LegoWalker({ size = 100 }: { size?: number }) {
  const h = size * (80 / 60)

  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 60 80"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <style>{`
          @keyframes lw-bob {
            from { transform: translateY(0px); }
            to   { transform: translateY(-2.5px); }
          }
          @keyframes lw-leg-l {
            from { transform: rotate(-24deg); }
            to   { transform: rotate(24deg); }
          }
          @keyframes lw-leg-r {
            from { transform: rotate(24deg); }
            to   { transform: rotate(-24deg); }
          }
          @keyframes lw-arm-l {
            from { transform: rotate(22deg); }
            to   { transform: rotate(-22deg); }
          }
          @keyframes lw-arm-r {
            from { transform: rotate(-22deg); }
            to   { transform: rotate(22deg); }
          }

          .lw-body {
            animation: lw-bob 0.42s ease-in-out infinite alternate;
          }
          .lw-leg-l {
            transform-origin: 21px 52px;
            animation: lw-leg-l 0.42s ease-in-out infinite alternate;
          }
          .lw-leg-r {
            transform-origin: 39px 52px;
            animation: lw-leg-r 0.42s ease-in-out infinite alternate;
          }
          .lw-arm-l {
            transform-origin: 12px 35px;
            animation: lw-arm-l 0.42s ease-in-out infinite alternate;
          }
          .lw-arm-r {
            transform-origin: 48px 35px;
            animation: lw-arm-r 0.42s ease-in-out infinite alternate;
          }
        `}</style>
      </defs>

      {/* ── LEFT LEG ─────────────────────────────────── */}
      <g className="lw-leg-l">
        <rect x="15" y="52" width="12" height="15" rx="2.5" fill="#FFD731" stroke="#001821" strokeWidth="1.2"/>
        <rect x="13" y="63" width="15" height="9"  rx="2"   fill="#001821"/>
        <rect x="11" y="69" width="18" height="5"  rx="2"   fill="#001821"/>
      </g>

      {/* ── RIGHT LEG ────────────────────────────────── */}
      <g className="lw-leg-r">
        <rect x="33" y="52" width="12" height="15" rx="2.5" fill="#FFD731" stroke="#001821" strokeWidth="1.2"/>
        <rect x="32" y="63" width="15" height="9"  rx="2"   fill="#001821"/>
        <rect x="31" y="69" width="18" height="5"  rx="2"   fill="#001821"/>
      </g>

      {/* ── BODY + HEAD + ARMS (bobs together) ───────── */}
      <g className="lw-body">

        {/* ── LEFT ARM ─────────────────────────────────── */}
        <g className="lw-arm-l">
          <rect x="7"  y="35" width="10" height="19" rx="4" fill="#FFD731" stroke="#001821" strokeWidth="1.2"/>
          <ellipse cx="12" cy="55" rx="5" ry="4" fill="#FFD731" stroke="#001821" strokeWidth="1"/>
        </g>

        {/* ── RIGHT ARM ────────────────────────────────── */}
        <g className="lw-arm-r">
          <rect x="43" y="35" width="10" height="19" rx="4" fill="#FFD731" stroke="#001821" strokeWidth="1.2"/>
          <ellipse cx="48" cy="55" rx="5" ry="4" fill="#FFD731" stroke="#001821" strokeWidth="1"/>
        </g>

        {/* ── HIPS ─────────────────────────────────────── */}
        <rect x="15" y="46" width="30" height="8" rx="2.5" fill="#FFD731" stroke="#001821" strokeWidth="1.2"/>

        {/* ── TORSO ────────────────────────────────────── */}
        <rect x="13" y="27" width="34" height="21" rx="3" fill="#FFD731" stroke="#001821" strokeWidth="1.2"/>
        {/* Logo stud */}
        <circle cx="30" cy="37" r="4.5" fill="#DEB300" stroke="#001821" strokeWidth="0.9"/>
        <circle cx="30" cy="37" r="2"   fill="#C6A000"/>

        {/* ── NECK ─────────────────────────────────────── */}
        <rect x="25" y="21" width="10" height="8" rx="1.5" fill="#FFD731" stroke="#001821" strokeWidth="0.9"/>

        {/* ── HEAD ─────────────────────────────────────── */}
        {/* Top stud */}
        <rect x="26" y="2" width="8" height="5" rx="2" fill="#FFD731" stroke="#001821" strokeWidth="1"/>
        <ellipse cx="30" cy="2.5" rx="3" ry="2" fill="#FFD731" stroke="#001821" strokeWidth="0.8"/>

        {/* Head block */}
        <rect x="18" y="5" width="24" height="18" rx="4" fill="white" stroke="#001821" strokeWidth="1.2"/>

        {/* Left eye */}
        <ellipse cx="26" cy="12" rx="3.5" ry="4.5" fill="#001821"/>
        <ellipse cx="27.2" cy="10.5" rx="1.1" ry="1.5" fill="white"/>
        {/* Right eye */}
        <ellipse cx="34" cy="12" rx="3.5" ry="4.5" fill="#001821"/>
        <ellipse cx="35.2" cy="10.5" rx="1.1" ry="1.5" fill="white"/>

        {/* Smile */}
        <path d="M25 18.5 Q30 22.5 35 18.5" stroke="#001821" strokeWidth="1.2" fill="none" strokeLinecap="round"/>

        {/* Cheeks */}
        <ellipse cx="22"  cy="17.5" rx="2.2" ry="1.4" fill="#FFAEE7" opacity="0.55"/>
        <ellipse cx="38"  cy="17.5" rx="2.2" ry="1.4" fill="#FFAEE7" opacity="0.55"/>

      </g>
    </svg>
  )
}
