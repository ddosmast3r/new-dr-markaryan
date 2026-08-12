// Один общий способ вставки JSON-LD, чтобы разметка не разъезжалась по страницам.
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
