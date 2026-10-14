import { R } from './geometry.js'

const Arrow = ({ id, size, fill }) => (
  <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth={size} markerHeight={size} orient="auto-start-reverse">
    <path d="M0,1 L9,5 L0,9 z" fill={fill} />
  </marker>
)

export const GraphDefs = () => (
  <defs>
    <clipPath id="clipc"><circle r={R - 3} /></clipPath>
    <Arrow id="arrowg" size={6} fill="#6f8794" />
    <Arrow id="arrowy" size={6} fill="var(--gold)" />
    <Arrow id="arrow" size={7} fill="var(--amber)" />
  </defs>
)
