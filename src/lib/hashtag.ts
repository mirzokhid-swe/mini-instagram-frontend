export const HASHTAG_REGEX = /#([a-zA-Z0-9_]+)/g

export function splitCaption(caption: string): Array<{ text: string; tag?: string }> {
  const parts: Array<{ text: string; tag?: string }> = []
  let lastIndex = 0
  for (const match of caption.matchAll(HASHTAG_REGEX)) {
    const index = match.index ?? 0
    if (index > lastIndex) parts.push({ text: caption.slice(lastIndex, index) })
    parts.push({ text: match[0], tag: match[1].toLowerCase() })
    lastIndex = index + match[0].length
  }
  if (lastIndex < caption.length) parts.push({ text: caption.slice(lastIndex) })
  return parts
}
