import { Brand } from './Header';
import { nav } from '@/lib/content';

const footerNav = nav.filter((n) => ['#about', '#services', '#diagnostics', '#faq', '#contacts'].includes(n.href));

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <Brand light />
          <nav className="footer-nav">
            {footerNav.map((item) => (
              <a key={item.href} href={item.href}>{item.label}</a>
            ))}
          </nav>
        </div>

        <div className="footer-legal">
          <p>Медицинские услуги оказываются в ООО «ЛПУ-Гармония»</p>
          <p>357502, Ставропольский край, г. Пятигорск, пр-кт Калинина, зд. 90А</p>
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
              © 2026 Все права защищены. Сайт носит исключительно информационный характер.
            </small>
          </div>

          <div className="footer-links">
            <a href="/license">Сведения о лицензии</a>
            <a href="/privacy">Политика конфиденциальности</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
