import Reveal from './Reveal';
import BookButton from './BookButton';
import Icon from './Icon';

export default function TreatmentJourney({ journey }) {
  return (
    <section className="section section-tint svc-block treatment-journey" id="visit-plan">
      <div className="container">
        <Reveal className="section-head"><p className="eyebrow">Ваше посещение</p><h2>{journey.heading}</h2><p className="section-sub">{journey.lead}</p></Reveal>
        <ol className="steps">
          {journey.steps.map((step, index) => <Reveal as="li" key={step.title}><div className="step-head"><span className="step-num">0{index + 1}</span></div><h3>{step.title}</h3><p>{step.text}</p></Reveal>)}
        </ol>
        <Reveal className="journey-prepare">
          <div><h3>Что подготовить к встрече</h3><ul>{journey.checklist.map(item => <li key={item}><Icon name="check" width="16" height="16" />{item}</li>)}</ul></div>
          <BookButton intent="preparation" source="visit-plan" className="btn btn-primary">Уточнить подготовку<Icon name="arrowRight" width="18" height="18" /></BookButton>
        </Reveal>
      </div>
    </section>
  );
}
