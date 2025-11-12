import Link from 'next/link'; // Menggunakan Link dari Next.js untuk navigasi yang efisien
import Head from 'next/head'; // Menggunakan Head dari Next.js untuk metadata halaman

/**
 * Komponen Halaman 404 (Tidak Ditemukan).
 * Menampilkan pesan kesalahan dan tautan untuk kembali ke beranda.
 */
export default function NotFoundPage() {
  return (
    <>
      {/* Mengatur metadata halaman untuk SEO dan tampilan browser */}
      <Head>
        <title>404 - Halaman Tidak Ditemukan</title>
        <meta name="description" content="Halaman yang Anda cari tidak ditemukan." />
      </Head>

      {/* Kontainer utama halaman, menggunakan Tailwind CSS untuk styling responsif dan centering */}
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-4">
        {/* Judul utama 404 */}
        <h1 className="text-6xl md:text-8xl font-extrabold text-red-600 mb-4 animate-bounce">
          404
        </h1>
        {/* Pesan utama */}
        <p className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4 text-center">
          Halaman Tidak Ditemukan
        </p>
        {/* Pesan penjelasan */}
        <p className="text-lg md:text-xl text-gray-600 text-center max-w-md mb-8">
          Maaf, kami tidak dapat menemukan halaman yang Anda cari. Mungkin Anda salah mengetik alamat atau halaman tersebut telah dihapus.
        </p>
        {/* Tombol untuk kembali ke beranda */}
        <Link href="/" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105">
            Kembali ke Beranda
        </Link>
      </div>
    </>
  );
}
