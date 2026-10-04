'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import BookingModal from './BookingModal';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState({});

  const open = useCallback((nextContext = {}) => {
    setContext(nextContext);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  // Lock body scroll and close on Escape while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open');
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, close]);

  return (
    <BookingContext.Provider value={{ open, close }}>
      {children}
      {isOpen && <BookingModal context={context} onClose={close} />}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within <BookingProvider>');
  return ctx;
}
