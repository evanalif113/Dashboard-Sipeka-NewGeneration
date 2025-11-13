import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
    {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
      }
    ],
    sitemap: `https://sipeka.jeris.web.id/sitemap.xml`,
    host: `https://sipeka.jeris.web.id`,
  }
}