'use client';

import { useEffect, useRef, useState } from 'react';
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
 * На телефоне шапка становится непрозрачной в начале прокрутки,
 * на большом экране — когда первый экран уехал вверх.
 */
export default function Header({ transparent = false }) {
  const [open, setOpen] = useState(false);
  const [past, setPast] = useState(false);
  const headerRef = useRef(null);
  const burgerRef = useRef(null);

  useEffect(() => {
    if (!transparent) return undefined;
    const hero = document.querySelector('.hero-stage');
    const header = headerRef.current;
    if (!hero || !header) return undefined;
    const mobile = window.matchMedia('(max-width: 1180px)');
    const onScroll = () => {
      // A queued observer callback can arrive while a route is unmounting.
      if (!hero.isConnected || !header.isConnected) return;
      setPast(
        (mobile.matches && window.scrollY > 24) ||
        hero.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom
      );
    };
    const observer = new ResizeObserver(onScroll);
    observer.observe(hero);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [transparent]);

  useEffect(() => {
    if (!open) return undefined;
    headerRef.current?.querySelector('.main-nav a')?.focus({ preventScroll: true });
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    const onPointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) setOpen(false);
    };
    const onFocusIn = (event) => {
      if (!headerRef.current?.contains(event.target)) setOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 1181px)');
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    desktop.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
      desktop.removeEventListener('change', onResize);
    };
  }, [open]);

  // Открытое мобильное меню всегда на непрозрачной подложке: выпадающий
  // список поверх фотографии не читается.
  const light = transparent && !past && !open;

  return (
    <header
      ref={headerRef}
      className={`site-header${transparent ? ' site-header--over' : ''} ${light ? 'is-light' : 'is-solid'}`}
      id="top"
    >
      <div className="header-shell">
        <div className="header-nav">
          <Brand light={light} />

          <nav id="main-navigation" className={`main-nav${open ? ' open' : ''}`} aria-label="Основная навигация">
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
            ref={burgerRef}
            type="button"
            className={`burger${open ? ' open' : ''}`}
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            aria-controls="main-navigation"
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
