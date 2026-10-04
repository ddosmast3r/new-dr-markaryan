'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { MAX, TELEGRAM, WHATSAPP, PHONE, PHONE_HREF, PRODOCTOROV, HOURS_TEXT } from '@/lib/content';
import { reachGoal, GOALS } from '@/lib/metrika';

export default function BookingModal({ context, onClose }) {
  const dialogRef = useRef(null);
  const messageRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState('');
  const isAppointment = context.intent === 'appointment';
  const whatsappHref = `${WHATSAPP}?text=${encodeURIComponent(context.message)}`;
  const track = (goal) => reachGoal(goal, {
    page: context.pathname, service: context.service, intent: context.intent, source: context.source,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(context.message);
      if (messageRef.current?.isConnected) setCopyStatus('Сообщение скопировано');
    } catch {
      // Permission may be denied after the user has already closed the dialog.
      const message = messageRef.current;
      if (!message?.isConnected) return;
      const selection = window.getSelection();
      if (!selection) {
        setCopyStatus('Скопируйте сообщение вручную');
        return;
      }
      const range = document.createRange();
      range.selectNodeContents(message);
      selection.removeAllRanges();
      selection.addRange(range);
      setCopyStatus('Выделили сообщение — скопируйте его вручную');
    }
  }

  return (
    <dialog ref={dialogRef} className="modal open" id="booking" aria-labelledby="booking-title" aria-describedby="booking-description" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-sheet">
        <div className="modal-topline">
          <p className="eyebrow">{context.eyebrow}</p>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть"><Icon name="close" /></button>
        </div>
        <div className="modal-card">
          <h2 id="booking-title">{context.title}</h2>
          <p className="booking-subject"><Icon name={context.intent === 'preparation' ? 'doc' : 'calendar'} width="18" height="18" />{context.service}</p>
          <p className="modal-sub" id="booking-description">
            {isAppointment ? 'Запишитесь через ПроДокторов, позвоните или напишите мне напрямую.' : 'Напишите мне: уточним детали именно вашего посещения. Обычно отвечаю в течение рабочего дня.'}
          </p>
          <a className="msg booking-primary" href={isAppointment ? PRODOCTOROV : whatsappHref} target="_blank" rel="noopener" onClick={() => track(isAppointment ? GOALS.PRODOCTOROV : GOALS.WHATSAPP)}>
            <span className="msg-ico"><Icon name={isAppointment ? 'calendar' : 'whatsapp'} /></span>
            <span className="msg-body"><strong>{isAppointment ? 'Запись на ПроДокторов' : 'Написать в WhatsApp'}</strong><small>{isAppointment ? 'Открыть профиль и варианты записи' : 'Сообщение уже подготовлено'}</small></span>
            <span className="msg-arrow"><Icon name="arrowRight" /></span>
          </a>
          <div className="booking-channels" aria-label="Мессенджеры">
            <a className="booking-channel" href={MAX} target="_blank" rel="noopener" onClick={() => track(GOALS.MAX)}><Icon name="max" />MAX</a>
            <a className="booking-channel" href={TELEGRAM} target="_blank" rel="noopener" onClick={() => track(GOALS.TELEGRAM)}><Icon name="telegram" />Telegram</a>
            {isAppointment && <a className="booking-channel" href={whatsappHref} target="_blank" rel="noopener" onClick={() => track(GOALS.WHATSAPP)}><Icon name="whatsapp" />WhatsApp</a>}
          </div>
          <a className="booking-call" href={PHONE_HREF} onClick={() => track(GOALS.PHONE)}><Icon name="phone" width="18" height="18" /><span>Позвонить<strong>{PHONE}</strong></span><Icon name="chevronRight" width="18" height="18" /></a>
          <details className="booking-message">
            <summary>Готовое сообщение для врача</summary>
            <p ref={messageRef}>{context.message}</p>
            <button type="button" onClick={copyMessage}>Скопировать сообщение</button>
            <span role="status">{copyStatus}</span>
          </details>
          <p className="modal-foot">{HOURS_TEXT} · Всё конфиденциально.<br />Имеются противопоказания, необходима консультация специалиста.</p>
        </div>
      </div>
    </dialog>
  );
}
