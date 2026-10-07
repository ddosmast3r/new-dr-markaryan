import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Страница не найдена: Доктор Маркарян',
  description: 'Такой страницы нет. Перейдите на главную страницу сайта доктора Маркаряна, чтобы выбрать нужный раздел.',
  alternates: { canonical: null },
  // Next adds noindex to 404 responses; avoid inheriting index from the layout.
  robots: null,
  openGraph: null,
  twitter: null,
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="section not-found-page">
        <div className="container">
          <p className="eyebrow">Ошибка 404</p>
          <h1>Такой страницы нет</h1>
          <p className="section-sub">Возможно, ссылка устарела или в адресе есть опечатка. Вернитесь на главную, чтобы выбрать нужный раздел.</p>
          <Link href="/" className="btn btn-primary">На главную</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
