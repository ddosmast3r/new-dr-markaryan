import posts from './instagram-feed.json';

const find = id => posts.find(post => post.id === id);
const select = (...ids) => ids.map(find).filter(Boolean);
const preparation = find('Dfpb1RACLEM');
// Only cards about health history, previous tests and medicines are relevant
// here. The full carousel is about a proctology consultation, not endoscopy.
const endoscopyCardIds = ['DfpbzdXIy25', 'DfpbzduIbsK', 'DfpbzeGoUtp'];
const endoscopyCards = preparation ? {
  ...preparation,
  title: 'Здоровье, лекарства и прошлые обследования',
  summary: 'Что сообщить врачу и какие документы взять с собой.',
  media: preparation.media.filter(item => endoscopyCardIds.some(id => item.src.endsWith(`/${id}.jpg`))),
} : null;

export const relatedPublications = {
  consultation: {
    heading: 'Врач отвечает перед первым приёмом',
    lead: 'Видео об ощущениях на осмотре и памятка о подготовке к консультации проктолога.',
    items: select('DfxSQCcI2G1', 'Dfpb1RACLEM'),
  },
  endoscopy: {
    heading: 'Что подготовить для беседы с врачом',
    lead: 'Карточки о лекарствах, здоровье и прежних обследованиях. Индивидуальную схему подготовки к исследованию уточните при записи.',
    items: endoscopyCards?.media.length ? [endoscopyCards] : [],
  },
  hemorrhoids: {
    heading: 'Разбор советов — в видео',
    lead: 'Комментарий врача к популярным советам о лечении геморроя.',
    items: select('Dfe1hHdIKny'),
  },
  doctor: {
    heading: 'Познакомимся перед встречей',
    lead: 'Эдуард Маркарян о своей работе и приёме пациентов.',
    items: select('DfckO2QIyNl'),
  },
};
