export function generateOrderNumber() {
  const stamp = Date.now().toString().slice(-8);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LA-${stamp}-${rand}`;
}