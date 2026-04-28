const mentionRegex = /@([a-zA-Z0-9._-]+)/g;

export function extractMentions(text: string): string[] {
  const mentions = new Set<string>();
  for (const match of text.matchAll(mentionRegex)) {
    const username = match[1]?.trim().toLowerCase();
    if (username) {
      mentions.add(username);
    }
  }
  return [...mentions];
}
