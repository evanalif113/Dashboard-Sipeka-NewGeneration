import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | SIPEKA",
    default: "Sistem Pemantauan Kualitas Air (SIPEKA)",
  },
  description: "Sistem Pemantauan Kualitas Air",
  keywords: [
    "Pemantauan",
    "Penelitian",
    "Pengembangan",
    "Teknologi",
    "Sensor",
    "Kualitas Air",
    "Data",
    "IoT",
    "Hidrologi",
    "Sungai",
    "Danau",
    "Kualitas Udara",
    "Lingkungan",
  ],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      {
        url: "/img/favicon.ico",
        href: "/img/favicon.ico",
        sizes: "any",
        type: "image/webp",
      },
    ],
    apple: [
      {
        url: "/img/logo.webp",
        href: "/img/logo.webp",
        sizes: "180x180",
        type: "image/webp",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
