/** "after Track the parcel" as the start of a line: "After Track the parcel". */
export function capitalized(text: string) {
  const first = text.charAt(0);
  const rest = text.slice(1);
  return `${first.toUpperCase()}${rest}`;
}
