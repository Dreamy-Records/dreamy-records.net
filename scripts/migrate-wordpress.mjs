import fs from 'node:fs/promises';
import path from 'node:path';
import TurndownService from 'turndown';

const siteUrl = 'https://dreamy-records.net';
const apiUrl = `${siteUrl}/wp-json/wp/v2`;
const projectRoot = process.cwd();
const newsDirectory = path.join(projectRoot, 'src/content/news');
const imageDirectory = path.join(projectRoot, 'public/assets/news');
const redirectFile = path.join(projectRoot, 'src/data/legacyRedirects.ts');

await fs.mkdir(newsDirectory, { recursive: true });
await fs.mkdir(imageDirectory, { recursive: true });

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
};

const posts = await fetchJson(
  `${apiUrl}/posts?per_page=100&page=1&_fields=id,date,slug,link,title,excerpt,content,featured_media,categories`,
);
const categories = await fetchJson(`${apiUrl}/categories?per_page=100&_fields=id,name`);
const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
const mediaCache = new Map();

const decodeEntities = (value = '') =>
  value
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([\da-f]+);/gi, (_, number) => String.fromCodePoint(Number.parseInt(number, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&hellip;/g, '…');

const plainText = (html = '') =>
  decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/favorite(?:\d+いいね)?\s*(?:\[…\])?|送信中です|×/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const safeFileName = (postId, imageUrl) => {
  const url = new URL(imageUrl);
  const original = decodeURIComponent(path.basename(url.pathname));
  const cleaned = original.replace(/[^\p{Letter}\p{Number}._-]+/gu, '-');
  return `${postId}-${cleaned || 'image.jpg'}`;
};

const downloadImage = async (postId, imageUrl) => {
  if (!imageUrl) return undefined;
  const fileName = safeFileName(postId, imageUrl);
  const outputPath = path.join(imageDirectory, fileName);
  try {
    await fs.access(outputPath);
  } catch {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`${response.status} ${imageUrl}`);
    await fs.writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
  }
  return `/assets/news/${encodeURIComponent(fileName)}`;
};

const getFeaturedImage = async (post) => {
  if (!post.featured_media) return undefined;
  if (!mediaCache.has(post.featured_media)) {
    mediaCache.set(
      post.featured_media,
      fetchJson(`${apiUrl}/media/${post.featured_media}?_fields=source_url`).catch(() => null),
    );
  }
  const media = await mediaCache.get(post.featured_media);
  return media?.source_url ? downloadImage(post.id, media.source_url) : undefined;
};

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
});
turndown.keep(['iframe']);
turndown.remove(['script', 'style', 'button', 'form']);

const convertContent = async (post) => {
  let html = post.content.rendered || '';
  html = html
    .replace(/<div class="ifw_wrap[\s\S]*$/i, '')
    .replace(/<div class="ifw_message_wrap[\s\S]*$/i, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');

  const imageUrls = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((match) =>
    decodeEntities(match[1]),
  );
  for (const imageUrl of [...new Set(imageUrls)]) {
    try {
      const localUrl = await downloadImage(post.id, imageUrl);
      if (localUrl) html = html.split(imageUrl).join(localUrl);
    } catch (error) {
      console.warn(`Image skipped: ${imageUrl}`, error.message);
    }
  }

  return turndown
    .turndown(html)
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
};

const quote = (value) => JSON.stringify(decodeEntities(String(value)));
const redirects = new Map();
let created = 0;
let preserved = 0;

for (const post of posts) {
  const slug = post.slug;
  const destination = `/news/${slug}/`;
  const sourcePath = new URL(post.link).pathname;
  redirects.set(sourcePath, destination);

  const date = new Date(post.date);
  const datePath = `/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${slug}/`;
  redirects.set(datePath, destination);

  const markdownPath = path.join(newsDirectory, `${slug}.md`);
  try {
    await fs.access(markdownPath);
    preserved += 1;
    continue;
  } catch {}

  const title = plainText(post.title.rendered) || slug;
  const description = (plainText(post.excerpt.rendered) || title).slice(0, 180);
  const category = categoryNames.get(post.categories[0]) || 'NEWS';
  const featuredImage = await getFeaturedImage(post);
  const content = (await convertContent(post)) || description;
  const frontmatter = [
    '---',
    `title: ${quote(title)}`,
    `date: ${post.date.slice(0, 10)}`,
    `category: ${quote(category.toUpperCase())}`,
    `description: ${quote(description)}`,
    featuredImage ? `image: ${quote(featuredImage)}` : undefined,
    '---',
  ]
    .filter(Boolean)
    .join('\n');

  await fs.writeFile(markdownPath, `${frontmatter}\n\n${content}\n`, 'utf8');
  created += 1;
}

const redirectEntries = [...redirects.entries()].sort(([a], [b]) => a.localeCompare(b));
const redirectSource = `// Generated by scripts/migrate-wordpress.mjs\nexport const legacyRedirects = ${JSON.stringify(
  redirectEntries.map(([source, destination]) => ({ source, destination })),
  null,
  2,
)} as const;\n`;
await fs.writeFile(redirectFile, redirectSource, 'utf8');

const netlifyRedirects = redirectEntries
  .map(([source, destination]) => `${source} ${destination} 301!`)
  .join('\n');
await fs.writeFile(path.join(projectRoot, 'public/_redirects'), `${netlifyRedirects}\n`, 'utf8');

console.log(`WordPress posts: ${posts.length}`);
console.log(`Markdown created: ${created}`);
console.log(`Existing Markdown preserved: ${preserved}`);
console.log(`Legacy redirects: ${redirectEntries.length}`);
