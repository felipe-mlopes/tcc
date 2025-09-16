export function generateCPF() {
  const digits = [];
  for (let i = 0; i < 9; i++) digits.push(Math.floor(Math.random() * 10));

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  digits.push(sum % 11 < 2 ? 0 : 11 - (sum % 11));

  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  digits.push(sum % 11 < 2 ? 0 : 11 - (sum % 11));

  return digits.join('').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}