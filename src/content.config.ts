import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const news = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    description: z.string().optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slugは英小文字・数字・ハイフンで指定してください。')
      .optional(),
    image: z.string().optional(),
    showImage: z.boolean().default(false),
    redirectTo: z.string().url().optional(),
  }),
});

export const collections = { news };
