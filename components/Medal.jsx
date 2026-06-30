// Award "medal" — a rosette emblem with ribbon and year. Pure SVG, no emoji.
const petalAngles = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);

export default function Medal({ year, title }) {
  return (
    <figure className="medal">
      <div className="medal-emblem">
        <svg viewBox="0 0 120 150" aria-hidden="true">
          {/* ribbon tails */}
          <path className="medal-ribbon" d="M45 94 L36 142 L52 131 L60 142 L68 131 L84 142 L75 94 Z" />
          {/* rosette petals */}
          <g className="medal-petals">
            {petalAngles.map((a) => (
              <ellipse key={a} cx="60" cy="22" rx="4.2" ry="9" transform={`rotate(${a} 60 60)`} />
            ))}
          </g>
          {/* medallion */}
          <circle className="medal-disc" cx="60" cy="60" r="33" />
          <circle className="medal-ring" cx="60" cy="60" r="28" />
          {/* small stars flanking */}
          <circle className="medal-dot" cx="60" cy="34" r="2.4" />
        </svg>
        <span className="medal-year">{year}</span>
      </div>
      <figcaption className="medal-label">{title}</figcaption>
    </figure>
  );
}
