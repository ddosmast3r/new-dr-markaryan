import Image from 'next/image';
import Reveal from './Reveal';
import Icon from './Icon';
import TrackedLink from './TrackedLink';
import {
  WHATSAPP, TELEGRAM, MAX, PHONE, PHONE_HREF, PRODOCTOROV,
  EMAIL, EMAIL_HREF, ADDRESS, HOURS_TEXT, MAP_URL,
} from '@/lib/content';
import { GOALS } from '@/lib/metrika';

// Один блок контактов на весь сайт: и на главной, и на страницах услуг.
// Заголовок и подводка настраиваются, сами контакты — всегда одни и те же.
export default function Contacts({
  heading = 'Приём проктолога в Пятигорске',
  intro = 'Напишите в мессенджер, отвечу сам. Или выберите время на ПроДокторов.',
}) {
  return (
    <section className="section contacts" id="contacts">
      <div className="container contacts-grid">
        <Reveal className="contacts-copy">
          <p className="eyebrow light">Контакты</p>
          <h2>{heading}</h2>
          <p>{intro}</p>

          <div className="contacts-actions">
            <TrackedLink goal={GOALS.PRODOCTOROV} href={PRODOCTOROV} className="btn btn-pdr-cta" target="_blank" rel="noopener">
              <Icon name="calendar" width="20" height="20" />
              Запись через ПроДокторов
            </TrackedLink>
            <div className="contacts-row">
              <TrackedLink goal={GOALS.MAX} href={MAX} className="btn btn-max" target="_blank" rel="noopener">
                <Icon name="max" width="18" height="18" />MAX
              </TrackedLink>
              <TrackedLink goal={GOALS.WHATSAPP} href={WHATSAPP} className="btn btn-wa" target="_blank" rel="noopener">
                <Icon name="whatsapp" width="18" height="18" />WhatsApp
              </TrackedLink>
              <TrackedLink goal={GOALS.TELEGRAM} href={TELEGRAM} className="btn btn-tg" target="_blank" rel="noopener">
                <Icon name="telegram" width="18" height="18" />Telegram
              </TrackedLink>
            </div>
          </div>
        </Reveal>

        <Reveal className="contacts-card">
          <div className="contacts-photo">
            <Image
              src="/img/ed_med.png"
              alt="Эдуард Маркарян в клинике на приёме"
              fill
              sizes="(max-width: 960px) 100vw, 420px"
              style={{ objectFit: 'cover', objectPosition: 'center 25%' }}
            />
          </div>
          <ul className="contacts-list">
            <li><span>Телефон</span><TrackedLink goal={GOALS.PHONE} href={PHONE_HREF}>{PHONE}</TrackedLink></li>
            <li><span>Email</span><a href={EMAIL_HREF}>{EMAIL}</a></li>
            <li><span>Город приёма</span><strong>{ADDRESS.city} · КМВ</strong></li>
            <li>
              <span>Адрес клиники</span>
              <a href={MAP_URL} target="_blank" rel="noopener">{ADDRESS.street}</a>
              <small className="contacts-hint">Открыть на Яндекс Картах</small>
            </li>
            <li><span>Приём</span><strong>Взрослые пациенты</strong></li>
            <li><span>Часы приёма</span><strong>{HOURS_TEXT}</strong></li>
          </ul>
          <p className="disclaimer">Имеются противопоказания, необходима консультация специалиста.</p>
        </Reveal>
      </div>
    </section>
  );
}
