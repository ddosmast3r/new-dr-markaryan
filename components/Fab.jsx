import BookButton from './BookButton';

// Floating "Записаться" button, shown on mobile (visibility handled in CSS).
export default function Fab() {
  return (
    <BookButton className="fab" aria-label="Записаться на приём">
      <span>Записаться</span>
    </BookButton>
  );
}
