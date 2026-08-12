'use client';

import { useState } from 'react';

// Аккордеон вопросов. Ответы всегда есть в разметке (внутри <details>),
// поэтому их видно и поисковику, и пользователю без JS.
export default function FaqList({ items, className = 'faq-list' }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className={className}>
      {items.map((item, i) => (
        <details key={item.q} open={openIndex === i}>
          <summary
            onClick={(e) => {
              e.preventDefault();
              setOpenIndex(openIndex === i ? null : i);
            }}
          >
            {item.q}
            <span className="chev" />
          </summary>
          {/* Ответ бывает из нескольких абзацев — тогда это массив строк */}
          {(Array.isArray(item.a) ? item.a : [item.a]).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </details>
      ))}
    </div>
  );
}
