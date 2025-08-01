export function formatPastComment({ date, track, comment, driver }) {
  const d = date ? new Date(date).toISOString().split('T')[0] : '';
  const driverPart = driver ? ` (${driver})` : '';
  return `${d}, ${track}: "${comment}${driverPart}"`;
}
