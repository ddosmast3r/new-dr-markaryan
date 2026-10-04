'use client';

import { reachGoal } from '@/lib/metrika';

// Обычная ссылка, которая при клике отправляет цель в Метрику.
// Нужна, чтобы серверные секции (Contacts и т.п.) не становились клиентскими целиком.
export default function TrackedLink({ goal, children, onClick, ...props }) {
  return (
    <a {...props} onClick={(event) => {
      onClick?.(event);
      if (!event.defaultPrevented) reachGoal(goal, {
        page: window.location.pathname,
        source: event.currentTarget.closest('section, header')?.id || 'page',
      });
    }}>
      {children}
    </a>
  );
}
