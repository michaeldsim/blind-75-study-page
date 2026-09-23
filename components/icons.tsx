/* Single-stroke 16px icon set, sized by font-size at the call site. */
type P = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const ChevronRight = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}><polyline points="9 18 15 12 9 6" /></svg>
);
export const Search = ({ size = 15 }: P) => (
  <svg {...base(size)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const Check = ({ size = 13 }: P) => (
  <svg {...base(size)} strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>
);
export const Star = ({ size = 15, filled = false }: P & { filled?: boolean }) => (
  <svg {...base(size)} fill={filled ? "currentColor" : "none"}>
    <path d="M12 2.5l2.9 5.9 6.6.9-4.8 4.6 1.2 6.5L12 17.3 6.1 20.4l1.2-6.5L2.5 9.3l6.6-.9z" />
  </svg>
);
export const Flame = ({ size = 13 }: P) => (
  <svg {...base(size)}><path d="M12 2s4 4.5 4 8a4 4 0 0 1-8 0c0-1 .5-2 .5-2S6 11 6 14a6 6 0 0 0 12 0c0-5-6-12-6-12Z" /></svg>
);
export const Clock = ({ size = 13 }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
);
export const Play = ({ size = 13 }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none"><path d="M8 5.5v13l11-6.5z" /></svg>
);
export const Pause = ({ size = 13 }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none"><rect x="7" y="5" width="3.5" height="14" rx="1" /><rect x="13.5" y="5" width="3.5" height="14" rx="1" /></svg>
);
export const Rotate = ({ size = 13 }: P) => (
  <svg {...base(size)}><path d="M3 12a9 9 0 1 0 2.6-6.4" /><polyline points="3 4 3 10 9 10" /></svg>
);
export const Close = ({ size = 16 }: P) => (
  <svg {...base(size)}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const Shuffle = ({ size = 15 }: P) => (
  <svg {...base(size)}><path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="m15 15 6 6" /><path d="M4 4l5 5" /></svg>
);
export const BarChart = ({ size = 16 }: P) => (
  <svg {...base(size)}><line x1="6" y1="20" x2="6" y2="13" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="18" y1="20" x2="18" y2="9" /></svg>
);
export const Sun = ({ size = 16 }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const Moon = ({ size = 16 }: P) => (
  <svg {...base(size)}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
);
export const External = ({ size = 13 }: P) => (
  <svg {...base(size)}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
);
export const Lock = ({ size = 12 }: P) => (
  <svg {...base(size)}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const Settings = ({ size = 16 }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H7a1.7 1.7 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H23a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
);
export const Collapse = ({ size = 15 }: P) => (
  <svg {...base(size)}><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
);
export const Expand = ({ size = 15 }: P) => (
  <svg {...base(size)}><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
);
