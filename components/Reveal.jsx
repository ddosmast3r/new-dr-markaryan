'use client';

import { useEffect, useRef } from 'react';

// Wraps content and fades it in on scroll. The hidden initial state is gated
// behind `body.reveal-ready`, so content stays visible if JS never runs (SSR/no-JS).
export default function Reveal({ as: Tag = 'div', className = '', children, ...props }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    document.body.classList.add('reveal-ready');

    // Already in view on load → reveal immediately (no wait on async IO delivery).
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      el.classList.add('in');
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in');
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}
