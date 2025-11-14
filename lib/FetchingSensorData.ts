// lib/FetchingSensorData.ts
import { rtdb, db } from "@/lib/ConfigFirebase"; // Mengimpor instance RTDB dan Firestore
import {
  ref,
  query as rtdbQuery,
  orderByChild,
  limitToLast,
  get,
  remove,
  update,
  startAt,
  endAt,
} from "firebase/database";
import { collection, query as firestoreQuery, where, getDocs } from "firebase/firestore"; // Import untuk verifikasi ke Firestore

// Interface disesuaikan dengan struktur data RTDB yang baru
export interface SensorValue {
  suhu: number;
  ph_level: number;
  amonia: number;
  timestamp: number; // UNIX timestamp in milliseconds
}

export interface SensorDate extends SensorValue {
  id: string; // Di sini, ID adalah timestamp itu sendiri (kunci dari record)
  dateFormatted: string;
  timeFormatted: string;
}

export interface SensorMetaData {
  sensorId: string;
  TelemetryStatus: "online" | "offline";
}

// Helper untuk memformat data dari RTDB
function formatData(timestampKey: string, data: SensorValue): SensorDate {
  const date = new Date(data.timestamp);
  const timeZone = "Asia/Jakarta";

  const timeFormatted = date.toLocaleTimeString("id-ID", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const dateFormatted = date.toLocaleDateString("id-ID", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return {
    id: timestampKey, // Kunci dari record RTDB adalah timestamp
    ...data,
    dateFormatted: `${dateFormatted} ${timeFormatted}`,
    timeFormatted: timeFormatted,
  };
}

/**
 * Helper untuk memverifikasi kepemilikan perangkat di Firestore berdasarkan authToken.
 * @param userId - ID pengguna yang meminta.
 * @param authToken - Token autentikasi perangkat yang akan diverifikasi.
 */
async function verifyDeviceOwnership(userId: string, authToken: string): Promise<void> {
  if (!userId || !authToken) {
    throw new Error("Akses ditolak: ID Pengguna dan Token Perangkat diperlukan.");
  }
  const devicesRef = collection(db, "devices");
  const q = firestoreQuery(
    devicesRef,
    where("userId", "==", userId),
    where("authToken", "==", authToken)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Akses ditolak: Perangkat tidak ditemukan atau bukan milik Anda.");
  }
}


/**
 * Mengambil data sensor dalam rentang waktu dari RTDB setelah verifikasi.
 * @param userId - ID pengguna untuk verifikasi.
 * @param sensorId - ID sensor (authToken).
 * @param startTimestamp - Timestamp awal dalam milidetik.
 * @param endTimestamp - Timestamp akhir dalam milidetik.
 */
export async function fetchSensorDataByDateRange(
  userId: string,
  sensorId: string,
  startTimestamp: number,
  endTimestamp: number
): Promise<SensorDate[]> {
  try {
    await verifyDeviceOwnership(userId, sensorId); // Verifikasi kepemilikan

    const dataRef = ref(rtdb, `sensor/${sensorId}/data`);
    const q = rtdbQuery(
      dataRef,
      orderByChild("timestamp"),
      startAt(startTimestamp),
      endAt(endTimestamp)
    );

    const snapshot = await get(q);

    if (!snapshot.exists()) {
      return [];
    }

    const results: SensorDate[] = [];
    snapshot.forEach((childSnapshot) => {
      const key = childSnapshot.key;
      const val = childSnapshot.val() as SensorValue;
      if (key) {
        results.push(formatData(key, val));
      }
    });

    return results;
  } catch (error) {
    console.error("Gagal mengambil data sensor dalam rentang waktu (RTDB):", error);
    throw error;
  }
}

/**
 * Mengambil metadata dan status sensor terakhir dari RTDB setelah verifikasi.
 * @param userId - ID pengguna untuk verifikasi.
 * @param sensorId - ID sensor (authToken).
 */
export async function fetchSensorMetadata(
  userId: string,
  sensorId: string
): Promise<SensorMetaData> {
  try {
    await verifyDeviceOwnership(userId, sensorId); // Verifikasi kepemilikan

    const dataRef = ref(rtdb, `sensor/${sensorId}/data`);
    const q = rtdbQuery(dataRef, orderByChild("timestamp"), limitToLast(1));
    const snapshot = await get(q);

    if (!snapshot.exists()) {
      return { sensorId, TelemetryStatus: "offline" };
    }

    let latestTimestamp = 0;
    snapshot.forEach((child) => {
      latestTimestamp = child.val().timestamp;
    });

    const timeDifference = Date.now() - latestTimestamp;
    const threeMinutesInMillis = 3 * 60 * 1000;
    const status: "online" | "offline" =
      timeDifference < threeMinutesInMillis ? "online" : "offline";

    return { sensorId, TelemetryStatus: status };
  } catch (error) {
    console.error(`Gagal mengambil metadata untuk sensor ${sensorId} (RTDB):`, error);
    throw error;
  }
}

/**
 * Mengambil data sensor terakhir dari RTDB setelah verifikasi.
 * @param userId - ID pengguna untuk verifikasi.
 * @param sensorId - ID sensor (authToken).
 * @param limitCount - Jumlah data terakhir yang akan diambil.
 */
export async function fetchSensorData(
  userId: string,
  sensorId: string,
  limitCount: number
): Promise<SensorDate[]> {
  try {
    await verifyDeviceOwnership(userId, sensorId); // Verifikasi kepemilikan

    const dataRef = ref(rtdb, `sensor/${sensorId}/data`);
    const q = rtdbQuery(dataRef, orderByChild("timestamp"), limitToLast(limitCount));
    const snapshot = await get(q);

    if (!snapshot.exists()) {
      return [];
    }

    const results: SensorDate[] = [];
    snapshot.forEach((childSnapshot) => {
      const key = childSnapshot.key;
      const val = childSnapshot.val() as SensorValue;
      if (key) {
        results.push(formatData(key, val));
      }
    });

    return results;
  } catch (error) {
    console.error("Gagal mengambil data sensor (RTDB):", error);
    throw error;
  }
}

/**
 * Menghapus semua data untuk sensorId tertentu di RTDB setelah verifikasi.
 * @param userId - ID pengguna untuk verifikasi.
 * @param sensorId - ID sensor (authToken).
 */
export async function deleteSensorData(userId: string, sensorId: string): Promise<void> {
  try {
    await verifyDeviceOwnership(userId, sensorId); // Verifikasi kepemilikan

    const dataRef = ref(rtdb, `sensor/${sensorId}/data`);
    await remove(dataRef);
    console.log(`Successfully deleted all data for sensor ${sensorId}`);
  } catch (error) {
    console.error(`Gagal menghapus data untuk sensor ${sensorId} (RTDB):`, error);
    throw error;
  }
}

/**
 * Mengedit data sensor berdasarkan timestamp di RTDB setelah verifikasi.
 * @param userId - ID pengguna untuk verifikasi.
 * @param sensorId - ID sensor (authToken).
 * @param timestampKey - Kunci timestamp dari record yang akan diedit.
 * @param newData - Data baru yang akan diupdate.
 */
export async function editSensorDataByTimestamp(
  userId: string,
  sensorId: string,
  timestampKey: string,
  newData: Partial<Omit<SensorValue, "timestamp">>
): Promise<void> {
  try {
    await verifyDeviceOwnership(userId, sensorId); // Verifikasi kepemilikan

    const docRef = ref(rtdb, `sensor/${sensorId}/data/${timestampKey}`);
    await update(docRef, newData);
    console.log(`Data sensor dengan kunci ${timestampKey} berhasil diupdate.`);
  } catch (error) {
    console.error(`Gagal mengedit data sensor dengan kunci ${timestampKey}:`, error);
    throw error;
  }
}

/**
 * Menghapus data sensor berdasarkan timestamp di RTDB setelah verifikasi.
 * @param userId - ID pengguna untuk verifikasi.
 * @param sensorId - ID sensor (authToken).
 * @param timestampKey - Kunci timestamp dari record yang akan dihapus.
 */
export async function deleteSensorDataByTimestamp(
  userId: string,
  sensorId: string,
  timestampKey: string
): Promise<void> {
  try {
    await verifyDeviceOwnership(userId, sensorId); // Verifikasi kepemilikan

    const docRef = ref(rtdb, `sensor/${sensorId}/data/${timestampKey}`);
    await remove(docRef);
    console.log(`Data sensor dengan kunci ${timestampKey} berhasil dihapus.`);
  } catch (error) {
    console.error(`Gagal menghapus data sensor dengan kunci ${timestampKey}:`, error);
    throw error;
  }
}