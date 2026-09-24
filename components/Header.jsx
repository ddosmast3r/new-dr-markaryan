'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BookButton from './BookButton';
import Icon from './Icon';
import { nav } from '@/lib/nav';

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

/**
 * transparent — шапка ложится поверх первого экрана стеклянной панелью
 * (главная). Как только тёмный кадр уехал вверх, она становится обычной
 * непрозрачной: на бежевом фоне светлые ссылки были бы нечитаемы.
 */
export default function Header({ transparent = false }) {
  const [open, setOpen] = useState(false);
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (!transparent) return undefined;
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.82);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparent]);

  // Открытое мобильное меню всегда на непрозрачной подложке: выпадающий
  // список поверх фотографии не читается.
  const light = transparent && !past && !open;

  return (
    <header
      className={`site-header${transparent ? ' site-header--over' : ''} ${light ? 'is-light' : 'is-solid'}`}
      id="top"
    >
      <div className="header-shell">
        <div className="header-nav">
          <Brand light={light} />

          <nav className={`main-nav${open ? ' open' : ''}`} aria-label="Основная навигация">
            {nav.map((item) =>
              item.children.length ? (
                // Раздел со своими страницами: сам пункт ведёт на хаб,
                // подменю раскрывается по наведению и по фокусу с клавиатуры
                // (чистый CSS, см. .nav-item в styles/layout.css).
                // На узком экране подменю всегда развёрнуто списком.
                <div className="nav-item" key={item.href}>
                  <Link className="nav-top" href={item.href} onClick={() => setOpen(false)}>
                    {item.label}
                    <Icon className="nav-chev" name="chevronRight" width="14" height="14" />
                  </Link>
                  <ul className="nav-sub">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link href={child.href} onClick={() => setOpen(false)}>
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              )
            )}
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
      </div>
    </header>
  );
}

export { Brand };
