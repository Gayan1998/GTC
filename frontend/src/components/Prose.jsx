/** Render a stored multi-paragraph body field. */
export default function Prose({ text, className = '' }) {
  if (!text) return null;
  const paragraphs = String(text)
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className={`space-y-4 ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-[15px] leading-7 text-muted">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
