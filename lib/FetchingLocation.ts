export interface DeviceCoordinates {
  lat: number;
  lng: number;
}

/**
 * Mengambil koordinat geografis (lintang dan bujur) dari browser perangkat.
 *
 * @returns {Promise<DeviceCoordinates>} Sebuah Promise yang akan resolve dengan objek DeviceCoordinates
 * atau reject dengan Error jika geolokasi tidak didukung atau terjadi kesalahan.
 */
export function fetchDeviceLocation(): Promise<DeviceCoordinates> {
  return new Promise((resolve, reject) => {
    // 1. Periksa dukungan Geolocation lebih awal untuk penanganan error yang lebih spesifik.
    if (!navigator.geolocation) {
      reject(new Error("Geolocation tidak didukung oleh browser ini."));
      return; // Penting untuk menghentikan eksekusi setelah reject
    }

    // 2. Tambahkan opsi untuk getCurrentPosition untuk kontrol lebih lanjut (opsional tapi direkomendasikan).
    //    - enableHighAccuracy: Meminta akurasi terbaik yang tersedia.
    //    - timeout: Waktu maksimum (ms) untuk mendapatkan posisi.
    //    - maximumAge: Waktu maksimum (ms) dari posisi cache yang dapat diterima.
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 detik
      maximumAge: 0 // Tidak menggunakan posisi cache, selalu coba dapatkan yang terbaru
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 3. Destrukturisasi untuk kejelasan
        const { latitude, longitude } = position.coords;
        resolve({
          lat: latitude,
          lng: longitude,
        });
      },
      (error) => {
        // 4. Perbaiki pesan error agar lebih informatif
        let errorMessage: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Akses lokasi ditolak oleh pengguna.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informasi lokasi tidak tersedia.";
            break;
          case error.TIMEOUT:
            errorMessage = "Permintaan untuk mendapatkan lokasi melebihi batas waktu.";
            break;
          default:
            errorMessage = `Kesalahan Geolocation: ${error.message}`;
        }
        reject(new Error(errorMessage));
      },
      options // Teruskan opsi ke getCurrentPosition
    );
  });
}