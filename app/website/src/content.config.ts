import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';


const docCollectionSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  root: z.literal(true).optional(),
  // Names of direct children, listed first in this order. Validated in lib/collections.ts
  index: z.array(z.string()).optional()
})

/** A docs collection for one package, loaded from src/content/[id] */
const docsCollection = (id: string) => defineCollection({
  loader: glob({
    base: `./src/content/${id}`,
    pattern: '**/*.{md,mdx,json}',
    generateId: ({ entry }) => {
        if (entry === "index.json") return "__root";
        return entry.replace(/(\/index)?\.(mdx?|astro|json)$/, "")
    }
  }),
  schema: docCollectionSchema,
});

// Keys must match the ids in src/lib/packages.ts
export const collections = {
  qr: docsCollection('qr'),
  text: docsCollection('text'),
};
