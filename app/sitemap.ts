import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://scaffold.dev',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Future dynamic routes can be appended here
  ]
}
