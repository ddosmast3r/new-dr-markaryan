// Single inline-SVG icon set. Stroke styling comes from the global `svg` rule.
const paths = {
  shield: <><path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z" /><path d="M9.2 12l2 2 3.6-3.8" /></>,
  pulse: <path d="M3 12h4l2 5 4-12 2 7h4" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  pin: <><path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.6" /></>,
  drop: <path d="M12 3s6 6.5 6 10.5a6 6 0 01-12 0C6 9.5 12 3 12 3z" />,
  bolt: <path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z" />,
  branch: <><path d="M6 3v12" /><circle cx="6" cy="18" r="2.6" /><circle cx="18" cy="7" r="2.6" /><path d="M18 9.6c0 5-5 6.4-9 6.4" /></>,
  refresh: <><path d="M20.5 12a8.5 8.5 0 11-2.7-6.2" /><path d="M21 4v5h-5" /></>,
  wave: <path d="M3 12h3l2-6 3 12 2-8 2 4h4" />,
  arrowDown: <><circle cx="12" cy="12" r="9" /><path d="M12 8v6M9 11l3 3 3-3" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  doc: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  scan: <><path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3" /><path d="M4 12h16" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></>,
  waves: <><circle cx="12" cy="12" r="2" /><path d="M7.8 7.8a6 6 0 000 8.4M16.2 7.8a6 6 0 010 8.4M5 5a10 10 0 000 14M19 5a10 10 0 010 14" /></>,
  gauge: <><path d="M4.5 18a9 9 0 1115 0" /><path d="M12 13l4-4" /><circle cx="12" cy="18" r="1" /></>,
  flask: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 001.8 3h10.4a2 2 0 001.8-3l-5-9V3" /><path d="M8 15h8" /></>,
  tube: <><path d="M10 2h4v5l4 9a3 3 0 01-2.7 4.3H8.7A3 3 0 016 16l4-9V2z" /><path d="M8.5 14h7" /></>,
  trophy: <><path d="M7 4h10v3a5 5 0 01-10 0V4z" /><path d="M7 6H4.5v.8A3 3 0 007 9.7M17 6h2.5v.8A3 3 0 0117 9.7M9 21h6M12 17v4" /></>,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  max: <><path d="M21 11.5a8.5 8.5 0 01-12.3 7.6L3 20.5l1.5-5.4A8.5 8.5 0 1121 11.5z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" /></>,
  telegram: <><path d="M21.5 4.3L2.8 11.5c-.7.3-.6 1.3.1 1.5l4.7 1.4 1.8 5.4c.2.6 1 .7 1.4.2l2.5-2.6 4.6 3.4c.5.4 1.2.1 1.3-.5L22.7 5c.1-.7-.6-1.1-1.2-.7z" /><path d="M8 13.5L17 8l-6.5 6.5" /></>,
  whatsapp: <><path d="M12 3a9 9 0 00-7.7 13.7L3 21l4.4-1.3A9 9 0 1012 3z" /><path d="M8.5 8.3c-.3 1 .1 2.3 1.2 3.6 1.1 1.3 2.4 2 3.4 1.9.5 0 1-.4 1.2-.9l-1.8-1.1-1 .6c-.6-.3-1.1-.8-1.5-1.5l.6-1-1.1-1.8c-.5.1-.8.4-1 .7z" /></>,
  phone: <path d="M5 4h3.5l1.5 4.5-2 1.3a12 12 0 005.2 5.2l1.3-2L23 18.5V22a2 2 0 01-2 2A18 18 0 013 6a2 2 0 012-2z" />,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 16l-5-5L5 20" /></>,
  calendar: <><rect x="3" y="4.5" width="18" height="16.5" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /><path d="M11.5 14l1.4 1.4 2.6-2.8" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.6v.2" /></>,
};

export default function Icon({ name, className, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}
