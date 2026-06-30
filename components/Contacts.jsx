import Image from 'next/image';
import Reveal from './Reveal';
import Icon from './Icon';
import { WHATSAPP, TELEGRAM, MAX, PHONE, PHONE_HREF, PRODOCTOROV } from '@/lib/content';

export default function Contacts() {
  return (
    <section className="section contacts" id="contacts">
      <div className="container contacts-grid">
        <Reveal className="contacts-copy">
          <p className="eyebrow light">Контакты</p>
          <h2>Запишитесь, это проще, чем кажется</h2>
          <p>
            Напишите в мессенджер, отвечу сам. Или выберите время на ПроДокторов.
          </p>

          <div className="contacts-actions">
            <a href={PRODOCTOROV} className="btn btn-pdr-cta" target="_blank" rel="noopener">
              <Icon name="calendar" width="20" height="20" />
              Запись через ПроДокторов
            </a>
            <div className="contacts-row">
              <a href={MAX} className="btn btn-max" target="_blank" rel="noopener">
                <Icon name="max" width="18" height="18" />MAX
              </a>
              <a href={WHATSAPP} className="btn btn-wa" target="_blank" rel="noopener">
                <Icon name="whatsapp" width="18" height="18" />WhatsApp
              </a>
              <a href={TELEGRAM} className="btn btn-tg" target="_blank" rel="noopener">
                <Icon name="telegram" width="18" height="18" />Telegram
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal className="contacts-card">
          <div className="contacts-photo">
            <Image
              src="/img/ed_med.png"
              alt="Доктор Маркарян в клинике"
              fill
              sizes="(max-width: 960px) 100vw, 420px"
              style={{ objectFit: 'cover', objectPosition: 'center 25%' }}
            />
          </div>
          <ul className="contacts-list">
            <li><span>Телефон</span><a href={PHONE_HREF}>{PHONE}</a></li>
            <li><span>Email</span><a href="mailto:doc.edmarkaryan@yandex.ru">doc.edmarkaryan@yandex.ru</a></li>
            <li><span>Регион приёма</span><strong>КМВ · Кавказские Минеральные Воды</strong></li>
            <li><span>Приём</span><strong>Взрослые пациенты</strong></li>
            <li><span>Часы приёма</span><strong>Пн–Пт, 9:00–18:00</strong></li>
          </ul>
          <p className="disclaimer">Имеются противопоказания, необходима консультация специалиста.</p>
        </Reveal>
      </div>
    </section>
  );
}
