import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const articles = await getCollection('news');
  const sortedArticles = articles.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'Dreamy Records NEWS',
    description: '東方同人音楽アレンジサークル Dreamy Recordsの最新情報',
    site: context.site,
    trailingSlash: true,
    items: sortedArticles.map((article) => ({
      title: article.data.title,
      pubDate: article.data.date,
      description: article.data.description,
      link: `/news/${article.id}/`,
      categories: [article.data.category],
    })),
    customData: '<language>ja</language>',
  });
}
