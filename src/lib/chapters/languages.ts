export const ALLOWED_CHAPTER_LANGUAGES = ["en", "id"] as const;

export type AllowedChapterLanguage = (typeof ALLOWED_CHAPTER_LANGUAGES)[number];

const ALLOWED_CHAPTER_LANGUAGE_SET = new Set<string>(ALLOWED_CHAPTER_LANGUAGES);

export function isAllowedChapterLanguage(
  language: string | null | undefined,
): language is AllowedChapterLanguage {
  if (!language) return false;
  return ALLOWED_CHAPTER_LANGUAGE_SET.has(language.toLowerCase());
}

export function filterChaptersByLanguage<T extends { language: string | null }>(
  chapters: T[],
): T[] {
  return chapters.filter((chapter) => isAllowedChapterLanguage(chapter.language));
}
