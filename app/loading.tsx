import Image from "next/image";

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    {/* Container untuk spinner dan ikon */}
    <div className="relative h-20 w-20">
      {/* Cincin spinner yang berputar */}
      <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-8 border-blue-500 border-t-transparent"></div>
      {/* Gambar Favicon di tengah */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="/img/favicon.ico"
          alt="SIPEKA Logo"
          width={48}
          height={48}
          className="rounded-full"
        />
      </div>
    </div>
    <p className="text-gray-700 dark:text-gray-50 text-2xl font-medium">Memuat Halaman...</p>
  </div>
);

export default function Loading() {
  // Tampilkan spinner Anda sebagai fallback saat halaman memuat.
  // Anda bisa membuat UI yang lebih kompleks seperti skeleton layout di sini.
  return (
      <div className="fixed inset-0 bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex justify-center items-center z-50 backdrop-blur-sm">
          <LoadingSpinner />
      </div>
  );
}