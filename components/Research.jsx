import Reveal from './Reveal';
import Icon from './Icon';

// Publisher and PubMed both name Eduard Markaryan, Sechenov coloproctology.
// The subject also matches the article listed in the doctor's public profile.
export default function Research() {
  return (
    <section className="section section-tint" id="research">
      <div className="container research-grid">
        <Reveal className="research-intro">
          <p className="eyebrow">Научная работа</p>
          <h2>Внимание к восстановлению</h2>
          <p className="section-sub">Одна из тем моей научной работы связана с контролем боли после вмешательства. Участвовал в исследовании перинеального блока при геморроидэктомии.</p>
        </Reveal>
        <Reveal as="article" className="research-paper">
          <div className="research-meta"><span>ANZ Journal of Surgery</span><span>2024</span></div>
          <Icon name="doc" className="research-icon" />
          <h3>Перинеальный блок и контроль боли после геморроидэктомии</h3>
          <p>Проспективное рандомизированное исследование. Эдуард Маркарян указан среди соавторов; аффилиация: кафедра колопроктологии Сеченовского университета.</p>
          <p className="research-doi">94(10): 1835-1840 · DOI: 10.1111/ans.19136</p>
          <div className="research-links">
            <a href="https://pubmed.ncbi.nlm.nih.gov/39073064/" target="_blank" rel="noopener">Карточка в PubMed<Icon name="arrowRight" width="18" height="18" /></a>
            <a href="https://doi.org/10.1111/ans.19136" target="_blank" rel="noopener">Публикация в журнале<Icon name="arrowRight" width="18" height="18" /></a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
