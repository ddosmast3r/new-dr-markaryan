'use client';

import { useState } from 'react';
import Reveal from './Reveal';
import BookButton from './BookButton';
import { faq } from '@/lib/content';

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="section section-tint" id="faq">
      <div className="container faq-grid">
        <Reveal className="faq-intro">
          <p className="eyebrow">Вопросы</p>
          <h2>То, о чём неловко спросить вслух</h2>
          <p className="section-sub">Честные ответы на самые частые тревоги пациентов.</p>
          <BookButton className="btn btn-ghost">Задать свой вопрос</BookButton>
        </Reveal>

        <Reveal className="faq-list">
          {faq.map((item, i) => (
            <details key={i} open={openIndex === i}>
              <summary
                onClick={(e) => {
                  e.preventDefault();
                  setOpenIndex(openIndex === i ? null : i);
                }}
              >
                {item.q}
                <span className="chev" />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
