"use server"

import { ArrowRight, Cpu, DatabaseZap, LayoutTemplate } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ParticleBackground from "@/components/ParticleBackground"

export default async function LandingPage() {
  return (
    <>
      <Header />
      {/* Hero Section (particles only here) */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <ParticleBackground />
        {/* Overlay diubah menjadi warna yang lebih lembut */}
        <div className="absolute inset-0 pointer-events-none bg-slate-200 dark:bg-gray-900" />
        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center">
          <div className="mb-6 animate-fade-in">
            <Image 
            src="/img/logo.png" 
            alt="Logo SIPEKA" 
            width={150} 
            height={150} 
            className="object-contain" 
            />
          </div>
          <h1 className="text-5xl md:text-5xl font-extrabold mb-6 text-slate-800 dark:text-primary-50 drop-shadow-lg animate-slide-up">
            SIPEKA
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-gray-200 mb-8 max-w-2xl drop-shadow-lg animate-fade-in">
            Sistem Pemantauan Kualitas Air
          </p>
          <Button size="lg" asChild className="bg-primary-600 text-white hover:bg-primary-700 mb-4 animate-pop">
            <Link href="/login" className="flex items-center gap-2">
              Akses SIPEKA<ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Tentang Section (dengan pola melingkar) */}
      <section className="relative py-20 bg-white dark:bg-gray-900 overflow-hidden">
        {/* Pola gradien melingkar di background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.03)_1px,_transparent_1px)] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_1px,_transparent_1px)] [background-size:2rem_2rem]"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-primary-100 mb-4">Tentang SIPEKA</h2>
            <p className="text-slate-600 dark:text-gray-300 mb-4 leading-relaxed">
              SIPEKA adalah sistem pemantauan dan analisis kualitas air secara real-time menggunakan teknologi IoT. Platform ini menyediakan data penting mengenai parameter kualitas air, visualisasi data, dan alat analisis untuk mendukung pengelolaan kualitas air yang efektif dan berkelanjutan.
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-72 h-72">
              {/* Lingkaran dekoratif di belakang gambar */}
              <div className="absolute inset-0 rounded-full bg-primary-100 dark:bg-primary-900/50 transform-gpu scale-110 blur-xl"></div>
              <Image
                src="/img/foto_expo.jpg"
                alt="Tentang SIPEKA"
                width={288}
                height={288}
                className="relative object-cover rounded-full shadow-2xl border-4 border-white dark:border-gray-800"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Teknologi Section */}
      <section id="teknologi" className="py-20 bg-slate-50 dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-primary-100">
              Teknologi di Balik SIPEKA
            </h2>
            <p className="text-slate-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
              Dibangun dengan tumpukan teknologi modern untuk performa, skalabilitas, dan keandalan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1: Perangkat Keras IoT */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-50 dark:bg-primary-900/50 mb-6">
                <Cpu className="h-8 w-8 text-primary-500 dark:text-primary-300" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-700 dark:text-gray-100">Perangkat Keras IoT</h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">
                Menggunakan mikrokontroler ESP32 yang terintegrasi dengan sensor suhu, pH, dan amonia untuk pengumpulan data akurat langsung dari sumbernya.
              </p>
            </div>

            {/* Card 2: Backend & Database */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-50 dark:bg-primary-900/50 mb-6">
                <DatabaseZap className="h-8 w-8 text-primary-500 dark:text-primary-300" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-700 dark:text-gray-100">Backend & Database</h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">
                Didukung oleh Google Firebase, memanfaatkan Realtime Database untuk data sensor, Firestore untuk data pengguna, dan Authentication untuk keamanan.
              </p>
            </div>

            {/* Card 3: Frontend & Visualisasi */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-50 dark:bg-primary-900/50 mb-6">
                <LayoutTemplate className="h-8 w-8 text-primary-500 dark:text-primary-300" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-700 dark:text-gray-100">Frontend & Visualisasi</h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">
                Antarmuka dibangun dengan Next.js, React, dan Tailwind CSS. Visualisasi data disajikan melalui grafik interaktif untuk analisis yang mudah dipahami.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}