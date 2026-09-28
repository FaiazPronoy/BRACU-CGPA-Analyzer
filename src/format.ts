// A CGPA always shows two decimals; changes are in hundredths from the engine.
export const two = (v: number) => v.toFixed(2);
export const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
// + or a real minus sign, never a hyphen
export const signed = (hundredths: number) => `${hundredths > 0 ? '+' : '−'}${two(Math.abs(hundredths) / 100)}`;
export const signedValue = (v: number) => `${v > 0 ? '+' : '−'}${two(Math.abs(v))}`;
