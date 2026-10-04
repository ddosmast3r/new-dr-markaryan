import Link from 'next/link';
import Reveal from './Reveal';
import BookButton from './BookButton';
import FaqList from './FaqList';
import Icon from './Icon';
import { beforeVisit } from '@/lib/content';

const questions = beforeVisit.filter(({ id }) => ['prepare', 'exam-pain', 'surgeon'].includes(id));
const visitSteps = [
  { title: 'Расскажите, что беспокоит', text: 'Обсудим жалобы, прошлые обследования и лечение. Готовый диагноз для записи не нужен.' },
  { title: 'Разберёмся на осмотре', text: 'Объясню каждый этап. Дополнительные исследования обсудим, если они нужны.' },
  { title: 'Договоримся о следующем шаге', text: 'Вы получите объяснение результатов и рекомендации. Если есть варианты лечения — разберём их вместе.' },
];

export default function FirstVisit() {
  // Reuse the existing answers without introducing a second medical wording.
  return (
    <section className="section visit-section" id="first-visit">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Первое посещение</p>
          <h2>Начнём с разговора</h2>
          <p className="section-sub">Можно прийти с вопросами и тревогой. На приёме последовательно разберёмся, что происходит и как действовать дальше.</p>
        </Reveal>
        <div className="visit-grid">
          <Reveal className="visit-story">
            <span className="visit-mark"><Icon name="shield" width="28" height="28" />На каждом этапе — с объяснением</span>
            <ol className="visit-steps">
              {visitSteps.map((step, index) => <li key={step.title}><span>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}
            </ol>
            <Link href="/kak-prohodit" className="btn btn-light">Подробнее о первом приёме<Icon name="arrowRight" width="18" height="18" /></Link>
          </Reveal>
          <Reveal className="visit-questions">
            <p className="eyebrow">До встречи с врачом</p>
            <h3>То, что хочется узнать заранее</h3>
            <FaqList items={questions} />
            <div className="visit-help"><Icon name="doc" width="24" height="24" /><p>Если у вас уже есть заключения и результаты обследований, возьмите их с собой.</p></div>
            <BookButton intent="question" source="first-visit" className="btn btn-ghost">Задать вопрос перед записью<Icon name="arrowRight" width="18" height="18" /></BookButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
