// lib/FetchingSensorData.ts
import { rtdb } from "@/lib/ConfigFirebase"; // Mengimpor instance Realtime Database yang sudah diinisialisasi
import {
  ref,
  query,
  orderByKey,
  limitToLast,
  get,
  remove,
  update,
  startAt,
  endAt
} from "firebase/database"; // Tambahkan 'update' // Ini adalah fungsi-fungsi dari Firebase Realtime Database SDK

export interface SensorValue {
  temperature: number;
  humidity: number;
  pressure: number;
  dew: number;
  rainfall: number;
  rainrate: number
  volt: number;
}

export interface SensorDate extends SensorValue {
  timestamp: number; // UNIX timestamp in milliseconds
  dateFormatted: string; // Optional, if you want to store a formatted date
  timeFormatted: string;
}

export interface SensorMetaData {
  sensorId: string;
  TelemetryStatus: "online" | "offline";
}

/**
 * Mengambil data sensor dalam rentang waktu yang ditentukan.
 * @param sensorId - ID sensor yang datanya akan diambil.
 * @param startTimestamp - Timestamp awal dalam milidetik.
 * @param endTimestamp - Timestamp akhir dalam milidetik.
 * @returns Sebuah promise yang resolve dengan array data sensor dalam rentang waktu tersebut.
 */
export async function fetchSensorDataByDateRange(
  sensorId: string,
  startTimestamp: number,
  endTimestamp: number
): Promise<SensorDate[]> {
  console.log("fetchSensorDataByTimestampRange called with:", {
    sensorId,
    startTimestamp,
    endTimestamp,
  });

  try {
    // 1. Konversi timestamp milidetik ke string detik untuk query Firebase
    const startKey = String(Math.floor(startTimestamp / 1000));
    const endKey = String(Math.floor(endTimestamp / 1000));

    // 2. Buat query dengan orderByKey dan rentang startAt/endAt
    const dataRef = query(
      ref(rtdb, `auto_weather_stat/${sensorId}/data`),
      orderByKey(),
      startAt(startKey),
      endAt(endKey)
    );

    const snapshot = await get(dataRef);

    if (!snapshot.exists()) {
      console.log("No sensor data found in the specified range.");
      return [];
    }

    const results: SensorDate[] = [];

    // Proses snapshot, sama seperti di fungsi fetchSensorData
    snapshot.forEach((child) => {
      const timestampInSeconds = Number(child.key);
      const timestampInMillis = timestampInSeconds * 1000;
      console.log("Processing timestamp (ms):", timestampInMillis);
      const data: SensorValue = child.val();
      console.log("Sensor value from child:", data);

      const formattedTime = new Date(timestampInMillis)
        .toLocaleString("id-ID", 
        {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      ).replace(/\./g, ":");
      console.log("Formatted time:", formattedTime);
      // 2.1 Format tanggal jika diperlukan
      const dateFormatted = new Date(timestampInMillis)
        .toLocaleString("id-ID", 
        {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      ).replace(/\./g, ":");
      console.log("Formatted date:", dateFormatted);
      const resultItem = {
        timestamp: timestampInMillis, // Simpan dalam milidetik
        temperature: data.temperature,
        humidity: data.humidity,
        pressure: data.pressure,
        dew: data.dew,
        volt: data.volt,
        rainfall: data.rainfall,
        rainrate: data.rainrate,
        dateFormatted: dateFormatted,
        timeFormatted: formattedTime,
      };
      console.log("Pushing item to results:", resultItem);
      results.push(resultItem);
    });

    // Data dari query rentang sudah otomatis terurut secara kronologis
    return results;
  } catch (error) {
    console.error("Gagal mengambil data sensor dalam rentang waktu:", error);
    throw error;
  }
}

/**
 * Mengambil metadata dan status sensor terakhir.
 * Status "online" jika data terakhir kurang dari 3 menit, jika tidak "offline".
 * @param sensorId - ID sensor yang akan diperiksa.
 * @returns Sebuah promise yang resolve dengan metadata sensor.
 */
export async function fetchSensorMetadata(
  sensorId: string
): Promise<SensorMetaData> {
  try {
    const dataRef = query(
      ref(rtdb, `auto_weather_stat/${sensorId}/data`),
      orderByKey(),
      limitToLast(1)
    );

    const snapshot = await get(dataRef);

    if (!snapshot.exists()) {
      // Jika tidak ada data, anggap offline dan kembalikan nilai default
      return {
        sensorId: sensorId,
        TelemetryStatus: "offline",
      };
    }

    let latestData: SensorValue | null = null;
    let latestTimestamp: number | null = null;

    snapshot.forEach((child) => {
      latestTimestamp = Number(child.key) * 1000; // konversi ke milidetik
      latestData = child.val();
    });

    if (!latestData || !latestTimestamp) {
      throw new Error("Gagal memproses data snapshot.");
    }

    const currentTime = Date.now();
    const timeDifference = currentTime - latestTimestamp;
    const threeMinutesInMillis = 3 * 60 * 1000;

    const status: "online" | "offline" =
      timeDifference < threeMinutesInMillis ? "online" : "offline";

    return {
      sensorId: sensorId,
      TelemetryStatus: status,
    };
  } catch (error) {
    console.error(`Gagal mengambil metadata untuk sensor ${sensorId}:`, error);
    throw error;
  }
}

/**
 * Memperbarui status dari satu aktuator spesifik.
 * @param sensorId - ID sensor yang datanya akan diupdate.
 * @param limit - Berapa Poin data yang akan diambil.
 * @returns Sebuah promise yang akan resolve ketika get data selesai.
 */

export async function fetchSensorData(
  sensorId: string,
  limit: number,
): Promise<SensorDate[]> {
  console.log("fetchSensorData called with:", { sensorId, limit });
  
  try {
    const dataRef = query(
      ref(rtdb, `auto_weather_stat/${sensorId}/data`),
      orderByKey(),
      limitToLast(limit)
    );

    const snapshot = await get(dataRef);

    if (!snapshot.exists()) {
      console.log("No sensor data found.");
      return [];
    }

    const results: SensorDate[] = [];

    snapshot.forEach((child) => {
      // 1. Ambil timestamp dari KEY (detik), dan konversi ke milidetik untuk JS
      const timestampInSeconds = Number(child.key);
      const timestampInMillis = timestampInSeconds * 1000;
      console.log("Processing timestamp (ms):", timestampInMillis);
      const data: SensorValue = child.val();
      console.log("Sensor value from child:", data);

      // 2. Format waktu menggunakan timestamp yang benar
      const formattedTime = new Date(timestampInMillis)
      .toLocaleString('id-ID',
        {
          timeZone: "Asia/Jakarta", // Pastikan zona waktu sesuai
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      ).replace(/\./g, ':');  //replace untuk mengganti titik dengan titik dua
      console.log("Formatted time:", formattedTime);
      // 2.1 Format tanggal jika diperlukan
      const dateFormatted = new Date(timestampInMillis)
      .toLocaleString('id-ID',
        {
          timeZone: "Asia/Jakarta", // Pastikan zona waktu sesuai
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      ).replace(/\./g, ':');  //replace untuk mengganti titik dengan titik dua
      console.log("Formatted time:", dateFormatted);
      // 3. Gabungkan semua data sesuai interface SensorData
      const resultItem = {
        timestamp: timestampInMillis, // Simpan dalam milidetik
        temperature: data.temperature,
        humidity: data.humidity,
        pressure: data.pressure,
        dew: data.dew,
        volt: data.volt,
        rainfall: data.rainfall,
        rainrate: data.rainrate,
        dateFormatted: dateFormatted,
        timeFormatted: formattedTime,
      };
      console.log("Pushing item to results:", resultItem);
      results.push(resultItem);
    });

    // 4. Balik urutan array agar data terbaru berada di indeks pertama
    const reversedResults = results;
    return reversedResults;

  } 
  catch (error) {
    console.error("Gagal mengambil data sensor:", error);
    // Melempar kembali error
    throw error;
  }
}

/**
 * Menghapus semua data sensor untuk sensorId tertentu.
 * @param sensorId - ID sensor yang datanya akan dihapus.
 * @returns Sebuah promise yang akan resolve ketika data berhasil dihapus.
 */
export async function deleteSensorData(sensorId: string): Promise<void> {
  console.log(`deleteSensorData called for sensorId: ${sensorId}`);
  try {
    const dataRef = ref(rtdb, `auto_weather_stat/${sensorId}/data`);
    await remove(dataRef);
    console.log(`Successfully deleted data for sensor ${sensorId}`);
  } catch (error) {
    console.error(`Gagal menghapus data untuk sensor ${sensorId}:`, error);
    throw error;
  }
}

/**
 * Mengedit data sensor berdasarkan timestamp.
 * @param sensorId - ID sensor.
 * @param timestamp - Timestamp (milidetik) data yang akan diedit.
 * @param newData - Data baru yang akan diupdate (partial).
 */
export async function editSensorDataByTimestamp(
  sensorId: string,
  timestamp: number,
  newData: Partial<SensorValue>
): Promise<void> {
  // Konversi timestamp ke detik (key di database)
  const timestampInSeconds = Math.floor(timestamp / 1000);
  const dataRef = ref(rtdb, `auto_weather_stat/${sensorId}/data/${timestampInSeconds}`);
  try {
    await update(dataRef, newData);
    console.log(`Data sensor pada timestamp ${timestampInSeconds} berhasil diupdate.`);
  } catch (error) {
    console.error(`Gagal mengedit data sensor pada timestamp ${timestampInSeconds}:`, error);
    throw error;
  }
}

/**
 * Menghapus data sensor berdasarkan timestamp.
 * @param sensorId - ID sensor.
 * @param timestamp - Timestamp (milidetik) data yang akan dihapus.
 */
export async function deleteSensorDataByTimestamp(
  sensorId: string,
  timestamp: number
): Promise<void> {
  // Konversi timestamp ke detik (key di database)
  const timestampInSeconds = Math.floor(timestamp / 1000);
  const dataRef = ref(rtdb, `auto_weather_stat/${sensorId}/data/${timestampInSeconds}`);
  try {
    await remove(dataRef);
    console.log(`Data sensor pada timestamp ${timestampInSeconds} berhasil dihapus.`);
  } catch (error) {
    console.error(`Gagal menghapus data sensor pada timestamp ${timestampInSeconds}:`, error);
    throw error;
  }
}