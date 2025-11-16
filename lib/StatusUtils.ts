// Lokasi file: lib/statusUtils.ts

export type StatusLevel = "Aman" | "Waspada" | "Bahaya";

// Objek yang akan dikembalikan oleh fungsi
export interface StatusDetail {
  status: StatusLevel;
  rekomendasi: string;
  className: string; // Untuk kelas warna Tailwind CSS
}

/**
 * Menganalisis nilai pH (ph_level) dan memberikan status serta rekomendasi.
 */
export function getStatusPH(ph_level: number): StatusDetail {
  // ✅ Aman 6.8 - 7.8
  if (ph_level >= 6.8 && ph_level <= 7.8) {
    return {
      status: "Aman",
      rekomendasi:
        "Pertahankan. Monitor rutin. Pastikan pakan tidak berlebih dan filter berjalan baik.",
      className: "text-green-500",
    };
  }
  // ⚠️ Waspada 6.0 - 6.7 (Agak Asam) atau 7.9 - 8.5 (Agak Basa)
  if ((ph_level >= 6.0 && ph_level <= 6.7) || (ph_level >= 7.9 && ph_level <= 8.5)) {
    const rekomendasi = ph_level <= 6.7
      ? "1. Tingkatkan aerasi.\n2. Cek pakan: jangan berlebih.\n3. Buffer bertahap: tambahkan pH-up, kapur pertanian (CaCO3) / kulit kerang sedikit demi sedikit."
      : "1. Ganti air sebagian (20-30%) dengan air netral.\n2. Tingkatkan aerasi.\n3. Tambahkan bahan alami seperti daun ketapang kering (jika sesuai ekosistem).";
    return {
      status: "Waspada",
      rekomendasi,
      className: "text-yellow-500",
    };
  }
  // 🚨 Bahaya < 6.0 (Sangat Asam) atau > 8.5 (Sangat Basa)
  const rekomendasi = ph_level < 6.0
    ? "1. DARURAT: Ganti air (30-50%) dengan air baru ter-buffer netral.\n2. Buffer aktif: kapur pertanian/dolomit dosis terukur.\n3. Cek sumber air. Pindahkan ikan ke bak karantina jika memungkinkan."
    : "1. DARURAT: Ganti air (30-50%).\n2. Cari penyebab: kemungkinan ledakan alga (fotosintesis berlebih) -> beri naungan.\n3. Gunakan buffer pH-down secara hati-hati dan bertahap.";
  return {
    status: "Bahaya",
    rekomendasi,
    className: "text-red-500",
  };
}

/**
 * Menganalisis nilai Suhu dan memberikan status serta rekomendasi.
 */
export function getStatusSuhu(suhu: number): StatusDetail {
  // ✅ Aman 25 - 30 °C
  if (suhu >= 25 && suhu <= 30) {
    return {
      status: "Aman",
      rekomendasi:
        "Pertahankan. Pastikan sirkulasi air baik. Heater/chiller berfungsi normal.",
      className: "text-green-500",
    };
  }
  // ⚠️ Waspada 22 - 24.9 (Agak Dingin) atau 30.1 - 32 (Agak Panas)
  if ((suhu >= 22 && suhu < 25) || (suhu > 30 && suhu <= 32)) {
    const rekomendasi = suhu < 25
      ? "1. Nyalakan/cek heater (target 26°C).\n2. Kurangi pakan: metabolisme melambat."
      : "1. Tambah aerasi maksimal (O2 turun saat panas).\n2. Beri naungan (paranet/jaring).\n3. Kurangi pakan (stres panas).";
    return {
      status: "Waspada",
      rekomendasi,
      className: "text-yellow-500",
    };
  }
  // 🚨 Bahaya <22 (Sangat Dingin) atau >32 (Sangat Panas)
  const rekomendasi = suhu < 22
    ? "1. DARURAT: Cek heater dan kapasitasnya.\n2. Stop pakan sementara.\n3. Isolasi kolam dari angin malam."
    : "1. DARURAT: Tambah aerasi maksimal segera.\n2. Naungan penuh.\n3. Ganti air (20%) dengan yang lebih sejuk (bedanya <=4°C).\n4. Kolam kecil: gunakan botol berisi es tertutup (jangan es langsung).";
  return {
    status: "Bahaya",
    rekomendasi,
    className: "text-red-500",
  };
}

/**
 * Menganalisis nilai Amonia dan memberikan status serta rekomendasi.
 */
export function getStatusAmoniak(amonia: number): StatusDetail {
  // ✅ Aman 0 - 0.2 ppm
  if (amonia >= 0 && amonia <= 0.2) {
    return {
      status: "Aman",
      rekomendasi:
        "Pertahankan. Jaga manajemen pakan (jangan berlebih). Bersihkan filter mekanis rutin.",
      className: "text-green-500",
    };
  }
  // ⚠️ Waspada 0.21 - 0.5 ppm
  if (amonia > 0.2 && amonia <= 0.5) {
    return {
      status: "Waspada",
      rekomendasi:
        "1. Kurangi/stop pakan 1 hari (atau kurangi 50%).\n2. Ganti air (25-30%).\n3. Cek filter biologis. Tambahkan bakteri starter/probiotik.",
      className: "text-yellow-500",
    };
  }
  // 🚨 Bahaya > 0.5 ppm
  return {
    status: "Bahaya",
    rekomendasi:
      "1. DARURAT: Ganti air (50%).\n2. Stop pakan 1-2 hari.\n3. Tambah aerasi maksimal.\n4. Gunakan ammonia binder/detoxifier.\n5. Cek kemungkinan bangkai ikan di dasar.",
    className: "text-red-500",
  };
}

export function getOverallStatus(
  phStatus: StatusLevel,
  suhuStatus: StatusLevel,
  amoniakStatus: StatusLevel
): StatusLevel {
  
  // 1. Cek prioritas tertinggi: Bahaya
  if (
    phStatus === "Bahaya" ||
    suhuStatus === "Bahaya" ||
    amoniakStatus === "Bahaya"
  ) {
    return "Bahaya";
  }

  // 2. Cek prioritas kedua: Waspada
  if (
    phStatus === "Waspada" ||
    suhuStatus === "Waspada" ||
    amoniakStatus === "Waspada"
  ) {
    return "Waspada";
  }

  // 3. Jika tidak ada yang Bahaya atau Waspada, berarti Aman
  return "Aman";
}

/**
 * (Opsional) Helper baru untuk mendapatkan info tampilan (emoji/warna)
 * berdasarkan status keseluruhan.
 */
export function getOverallStatusDisplay(status: StatusLevel): { 
  emoji: string; 
  className: string; 
} {
  switch (status) {
    case "Aman":
      return { emoji: "✅", className: "text-green-500" };
    case "Waspada":
      return { emoji: "⚠️", className: "text-yellow-500" };
    case "Bahaya":
      return { emoji: "🚨", className: "text-red-500" };
  }
}