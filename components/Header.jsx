'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BookButton from './BookButton';
import { nav } from '@/lib/content';

function Brand({ light = false }) {
  return (
    <Link href="/" className="brand">
      <Image
        src={light ? '/img/logo-white.png' : '/img/logo.png'}
        className="brand-mark"
        alt="Логотип Эдуарда Маркаряна"
        width={52}
        height={38}
      />
      <span className="brand-text">
        <strong>Эдуард Маркарян</strong>
        <small>хирург-колопроктолог</small>
      </span>
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header" id="top">
      <div className="container header-inner">
        <Brand />

        <nav className={`main-nav${open ? ' open' : ''}`} aria-label="Основная навигация">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <BookButton className="btn btn-primary header-cta">Записаться</BookButton>

        <button
          className={`burger${open ? ' open' : ''}`}
          aria-label="Меню"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}

export { Brand };
