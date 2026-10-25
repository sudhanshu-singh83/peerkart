// Shows a rating as stars. With onChange it becomes a clickable star picker.
export default function Stars({ value = 0, onChange, size = 16 }) {
  return (
    <span className="stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? 'star on' : 'star'} onClick={onChange ? () => onChange(n) : undefined}
          style={onChange ? { cursor: 'pointer' } : {}}>★</span>
      ))}
    </span>
  );
}
