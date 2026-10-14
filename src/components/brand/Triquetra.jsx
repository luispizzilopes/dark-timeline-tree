// Triquetra de Dark: três ovais entrelaçadas (sem anel externo)
const TQ_PATHS = ["M50.00,65.59A27,27 0 0 1 50.00,18.82A27,27 0 0 1 50.00,65.59Z", "M36.50,42.21A27,27 0 0 1 77.00,65.59A27,27 0 0 1 36.50,42.21Z", "M63.50,42.21A27,27 0 0 1 23.00,65.59A27,27 0 0 1 63.50,42.21Z"]
const TQ_CROSS = [[63.5, 42.2, 0], [36.5, 42.2, 1], [50.0, 65.6, 2]]

export const Triquetra = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="18 14 64 64" fill="none" strokeLinejoin="round" aria-hidden>
    {TQ_PATHS.map((d, i) => <path key={i} d={d} pathLength="1" stroke="currentColor" strokeWidth="2.6" />)}
    {TQ_CROSS.map(([x, y, o], i) => (
      <g key={i} clipPath={`url(#tqc${i})`}>
        <clipPath id={`tqc${i}`}><circle cx={x} cy={y} r="3.4" /></clipPath>
        <path d={TQ_PATHS[o]} pathLength="1" stroke="#05070a" strokeWidth="5" />
        <path d={TQ_PATHS[o]} pathLength="1" stroke="currentColor" strokeWidth="2.6" />
      </g>
    ))}
  </svg>
)
