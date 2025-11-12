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
    sitemap: `https://meteo.jerukagunglabs.web.id/sitemap.xml`,
    host: `https://meteo.jerukagunglabs.web.id`,
  }
}