import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://sipeka.jeris.web.id"

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
  ]
}