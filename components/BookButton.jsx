'use client';

import { useBooking } from './BookingProvider';
import { reachGoal, GOALS } from '@/lib/metrika';

// Any "Записаться" trigger across the site routes through this client button,
// so section components can stay server-rendered.
export default function BookButton({ className = 'btn btn-primary', children, ...props }) {
  const { open } = useBooking();
  const handleClick = () => {
    reachGoal(GOALS.BOOKING_OPEN);
    open();
  };
  return (
    <button type="button" className={className} onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
