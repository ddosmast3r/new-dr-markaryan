'use client';

import { useEffect, useRef } from 'react';
import Icon from './Icon';
import { MAX, TELEGRAM, WHATSAPP, PHONE, PHONE_HREF } from '@/lib/content';

const messengers = [
  { key: 'max', cls: 'msg-max', icon: 'max', href: MAX, name: 'MAX', note: 'Российский мессенджер', badge: 'Работает без VPN' },
  { key: 'tg', cls: 'msg-tg', icon: 'telegram', href: TELEGRAM, name: 'Telegram', note: 'Быстрый ответ в чате' },
  { key: 'wa', cls: 'msg-wa', icon: 'whatsapp', href: WHATSAPP, name: 'WhatsApp', note: 'Если удобнее здесь' },
  { key: 'call', cls: 'msg-call', icon: 'phone', href: PHONE_HREF, name: 'Позвонить', note: PHONE, internal: true },
];

export default function BookingModal({ isOpen, onClose }) {
  const firstLinkRef = useRef(null);

  useEffect(() => {
    if (isOpen) firstLinkRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal open" id="booking">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
          <Icon name="close" />
        </button>
        <p className="eyebrow">Запись на приём</p>
        <h3 id="booking-title">Выберите удобный мессенджер</h3>
        <p className="modal-sub">Отвечаю лично, обычно в течение рабочего дня. Всё конфиденциально.</p>

        <div className="msg-list">
          {messengers.map((m, i) => (
            <a
              key={m.key}
              ref={i === 0 ? firstLinkRef : null}
              href={m.href}
              className={`msg ${m.cls}`}
              {...(m.internal ? {} : { target: '_blank', rel: 'noopener' })}
            >
              <span className="msg-ico"><Icon name={m.icon} /></span>
              <span className="msg-body">
                <strong>{m.name}</strong>
                <small>{m.note}</small>
              </span>
              {m.badge ? (
                <span className="msg-badge">{m.badge}</span>
              ) : (
                <span className="msg-arrow"><Icon name="chevronRight" /></span>
              )}
            </a>
          ))}
        </div>

        <p className="modal-foot">Пн–Пт, 9:00–18:00 · Имеются противопоказания, необходима консультация специалиста.</p>
      </div>
    </div>
  );
}
