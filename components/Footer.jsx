import Link from 'next/link';
import { Brand } from './Header';
import { nav, ADDRESS, CLINIC } from '@/lib/content';
import { servicePages } from '@/lib/pages';

const footerNav = nav.filter((n) =>
  ['/#about', '/#services', '/#diagnostics', '/#faq', '/#contacts'].includes(n.href)
);

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <Brand light />
          <nav className="footer-nav">
            {footerNav.map((item) => (
              <Link key={item.href} href={item.href}>{item.label}</Link>
            ))}
          </nav>
        </div>

        {/* Отдельные страницы направлений доступны обычными ссылками с любой страницы */}
        <nav className="footer-services" aria-label="Направления приёма">
          <span>Направления</span>
          <ul>
            {servicePages.map((page) => (
              <li key={page.slug}>
                <Link href={`/${page.slug}`}>{page.crumb}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-legal">
          <p>Медицинские услуги оказываются в {CLINIC.name}</p>
          <p className="footer-address">{ADDRESS.full}</p>
          <p>
            Лицензия на осуществление медицинской деятельности
            № Л041-01197-26/01072904 от 27.02.2024, выдана Министерством
            здравоохранения Ставропольского края. Срок действия бессрочный.
          </p>
        </div>

        <div className="footer-bottom">
          <div className="footer-final">
            <svg
              className="footer-disclaimer"
              viewBox="0 0 100 27"
              role="img"
              aria-label="Имеются противопоказания. Перед применением проконсультируйтесь со специалистом"
            >
              <text x="0" y="7.2" textLength="100" lengthAdjust="spacingAndGlyphs" className="fd-line fd-lg">ИМЕЮТСЯ ПРОТИВОПОКАЗАНИЯ.</text>
              <text x="0" y="13.6" textLength="100" lengthAdjust="spacingAndGlyphs" className="fd-line fd-sm">ПЕРЕД ПРИМЕНЕНИЕМ ПРОКОНСУЛЬТИРУЙТЕСЬ</text>
              <text x="0" y="25" textLength="100" lengthAdjust="spacingAndGlyphs" className="fd-line fd-xl">СО СПЕЦИАЛИСТОМ.</text>
            </svg>
            <small className="copyright">
              <span>© 2026 Все права защищены.</span>{' '}
              <span>Сайт носит исключительно информационный характер.</span>
            </small>
          </div>

          <div className="footer-links">
            <Link href="/license">Сведения о лицензии</Link>
            <Link href="/privacy">Политика конфиденциальности</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
