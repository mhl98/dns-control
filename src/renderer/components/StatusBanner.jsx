export function StatusBanner({ message }) {
  if (!message) return null
  const variant = message.type === 'error' ? 'error' : 'ok'
  return <div className={`status ${variant}`}>{message.text}</div>
}
