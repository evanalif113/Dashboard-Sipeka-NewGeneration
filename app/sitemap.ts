import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://meteo.jerukagunglabs.web.id"

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
  ]
}