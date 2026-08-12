import Link from 'next/link';

// Хлебные крошки внутренних страниц. Последний элемент — текущая страница,
// поэтому он не ссылка.
export default function Breadcrumbs({ items }) {
  return (
    <nav className="crumbs" aria-label="Хлебные крошки">
      <ol>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.href}>
              {isLast ? (
                <span aria-current="page">{item.label}</span>
              ) : (
                <Link href={item.href}>{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
