// English-only guard (a.md rule): the image copy must contain no CJK or fullwidth
// characters. Returns the matched characters, or [] if the text is clean.
const CJK = /[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]/g;

export function findCJK(text) {
  return String(text).match(CJK) || [];
}
