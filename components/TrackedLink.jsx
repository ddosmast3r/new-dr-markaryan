'use client';

import { reachGoal } from '@/lib/metrika';

// Обычная ссылка, которая при клике отправляет цель в Метрику.
// Нужна, чтобы серверные секции (Contacts и т.п.) не становились клиентскими целиком.
export default function TrackedLink({ goal, children, ...props }) {
  return (
    <a {...props} onClick={() => reachGoal(goal)}>
      {children}
    </a>
  );
}
