import type { CollectionEntry } from 'astro:content';
import { legacyRedirects } from '../data/legacyRedirects';

type NewsEntry = CollectionEntry<'news'>;

const preservedNewsIds = new Set([
  ...legacyRedirects.map((redirect) => redirect.destination.match(/^\/news\/([^/]+)\/$/)?.[1]),
  'new-member-2026',
  'site-renewal-test',
]);

const stableRandomNumber = (value: string) => {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return ((hash >>> 0) % 9000) + 1000;
};

/**
 * Keeps migrated article URLs intact. New articles receive a stable, random-looking
 * four-digit post number unless a custom slug is explicitly supplied in frontmatter.
 */
export const getNewsSlug = (entry: NewsEntry) => {
  if (entry.data.slug) return entry.data.slug;
  if (preservedNewsIds.has(entry.id)) return entry.id;

  return `post-${stableRandomNumber(entry.id)}`;
};

export const assertUniqueNewsSlugs = (entries: NewsEntry[]) => {
  const slugs = entries.map(getNewsSlug);
  const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);

  if (duplicates.length) {
    throw new Error(`ニュースURLが重複しています: ${[...new Set(duplicates)].join(', ')}`);
  }
};
