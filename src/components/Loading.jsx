export default function Loading({ text = 'Загрузка...' }) {
  return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>{text}</div>;
}
