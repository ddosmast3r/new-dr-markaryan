'use client';

import { useBooking } from './BookingProvider';

// Any "Записаться" trigger across the site routes through this client button,
// so section components can stay server-rendered.
export default function BookButton({ className = 'btn btn-primary', children, ...props }) {
  const { open } = useBooking();
  return (
    <button type="button" className={className} onClick={open} {...props}>
      {children}
    </button>
  );
}
