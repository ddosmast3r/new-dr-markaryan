'use client';

import { useBooking } from './BookingProvider';
import { reachGoal, GOALS } from '@/lib/metrika';
import { usePathname } from 'next/navigation';
import { bookingDetails } from '@/lib/booking';

// Any "Записаться" trigger across the site routes through this client button,
// so section components can stay server-rendered.
export default function BookButton({ className = 'btn btn-primary', children, intent = 'appointment', service, source, onClick, ...props }) {
  const { open } = useBooking();
  const pathname = usePathname();
  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    // Safari does not focus buttons on pointer activation by default.
    // Give the dialog a reliable return target before it takes focus.
    event.currentTarget.focus({ preventScroll: true });
    const details = bookingDetails({ intent, service, pathname });
    const placement = source || event.currentTarget.closest('section, header')?.id || 'page';
    const context = { ...details, source: placement };
    reachGoal(GOALS.BOOKING_OPEN, { page: pathname, service: details.service, intent: details.intent, source: placement });
    open(context);
  };
  return (
    <button type="button" className={className} {...props} onClick={handleClick}>
      {children}
    </button>
  );
}
