// lib/FetchingSensorData.ts
import { db } from "@/lib/ConfigFirebase"; // Mengimpor instance FIRESTORE
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  updateDoc,
  where,
  Timestamp,
  doc,
  writeBatch,
} from "firebase/firestore"; // Fungsi-fungsi dari Firestore SDK

// Interface tetap sama, namun kita akan menggunakan timestamp Firestore
export interface SensorValue {
  temperature: number;
  humidity: number;
  pressure: number;
  dew: number;
  rainfall: number;
  rainrate: number;
  volt: number;
}

export interface SensorDate extends SensorValue {
  id: string; // Document ID from Firestore
  timestamp: number; // UNIX timestamp in milliseconds
  dateFormatted: string;
  timeFormatted: string;
}

export interface SensorMetaData {
  sensorId: string;
  TelemetryStatus: "online" | "offline";
}

// Helper untuk memformat data dari Firestore
function formatData(doc: any): SensorDate {
  const data = doc.data();
  const timestampInMillis = (data.timestamp as Timestamp).toMillis();

  const date = new Date(timestampInMillis);
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
    id: doc.id,
    timestamp: timestampInMillis,
    temperature: data.temperature,
    humidity: data.humidity,
    pressure: data.pressure,
    dew: data.dew,
    volt: data.volt,
    rainfall: data.rainfall,
    rainrate: data.rainrate,
    dateFormatted: `${dateFormatted} ${timeFormatted}`,
    timeFormatted: timeFormatted,
  };
}

/**
 * Mengambil data sensor dalam rentang waktu yang ditentukan dari Firestore.
 * @param sensorId - ID sensor (nama koleksi).
 * @param startTimestamp - Timestamp awal dalam milidetik.
 * @param endTimestamp - Timestamp akhir dalam milidetik.
 * @returns Sebuah promise yang resolve dengan array data sensor.
 */
export async function fetchSensorDataByDateRange(
  sensorId: string,
  startTimestamp: number,
  endTimestamp: number
): Promise<SensorDate[]> {
  console.log("fetchSensorDataByDateRange (Firestore) called with:", {
    sensorId,
    startTimestamp,
    endTimestamp,
  });

  try {
    const dataCollectionRef = collection(db, sensorId);
    const q = query(
      dataCollectionRef,
      where("timestamp", ">=", Timestamp.fromMillis(startTimestamp)),
      where("timestamp", "<=", Timestamp.fromMillis(endTimestamp)),
      orderBy("timestamp", "asc") // Urutkan dari yang terlama ke terbaru
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No sensor data found in the specified range.");
      return [];
    }

    const results: SensorDate[] = querySnapshot.docs.map(formatData);
    return results;
  } catch (error) {
    console.error("Gagal mengambil data sensor dalam rentang waktu (Firestore):", error);
    throw error;
  }
}

/**
 * Mengambil metadata dan status sensor terakhir dari Firestore.
 * @param sensorId - ID sensor (nama koleksi).
 * @returns Sebuah promise yang resolve dengan metadata sensor.
 */
export async function fetchSensorMetadata(
  sensorId: string
): Promise<SensorMetaData> {
  try {
    const dataCollectionRef = collection(db, sensorId);
    const q = query(dataCollectionRef, orderBy("timestamp", "desc"), limit(1));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        sensorId: sensorId,
        TelemetryStatus: "offline",
      };
    }

    const latestDoc = querySnapshot.docs[0];
    const latestData = latestDoc.data();
    const latestTimestamp = (latestData.timestamp as Timestamp).toMillis();

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
    console.error(`Gagal mengambil metadata untuk sensor ${sensorId} (Firestore):`, error);
    throw error;
  }
}

/**
 * Mengambil data sensor terakhir dari Firestore.
 * @param sensorId - ID sensor (nama koleksi).
 * @param limitCount - Jumlah data terakhir yang akan diambil.
 * @returns Sebuah promise yang resolve dengan array data sensor.
 */
export async function fetchSensorData(
  sensorId: string,
  limitCount: number
): Promise<SensorDate[]> {
  console.log("fetchSensorData (Firestore) called with:", { sensorId, limit: limitCount });

  try {
    const dataCollectionRef = collection(db, sensorId);
    const q = query(
      dataCollectionRef,
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No sensor data found.");
      return [];
    }

    // Data diambil dalam urutan descending, kita balik agar menjadi ascending (kronologis)
    const results: SensorDate[] = querySnapshot.docs.map(formatData).reverse();
    return results;
  } catch (error) {
    console.error("Gagal mengambil data sensor (Firestore):", error);
    throw error;
  }
}

/**
 * Menghapus semua data sensor untuk sensorId tertentu di Firestore.
 * @param sensorId - ID sensor (nama koleksi).
 * @returns Sebuah promise yang akan resolve ketika data berhasil dihapus.
 */
export async function deleteSensorData(sensorId: string): Promise<void> {
  console.log(`deleteSensorData (Firestore) called for collection: ${sensorId}`);
  try {
    const dataCollectionRef = collection(db, sensorId);
    const q = query(dataCollectionRef);
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`No data to delete in collection ${sensorId}.`);
      return;
    }

    // Gunakan batch write untuk efisiensi
    const batch = writeBatch(db);
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Successfully deleted all data in collection ${sensorId}`);
  } catch (error) {
    console.error(`Gagal menghapus data di koleksi ${sensorId} (Firestore):`, error);
    throw error;
  }
}

/**
 * Mengedit data sensor berdasarkan ID dokumen di Firestore.
 * @param sensorId - ID sensor (nama koleksi).
 * @param docId - ID dokumen di Firestore.
 * @param newData - Data baru yang akan diupdate.
 */
export async function editSensorDataByDocId(
  sensorId: string,
  docId: string,
  newData: Partial<SensorValue>
): Promise<void> {
  const docRef = doc(db, sensorId, docId);
  try {
    await updateDoc(docRef, newData);
    console.log(`Data sensor dengan docId ${docId} berhasil diupdate.`);
  } catch (error) {
    console.error(`Gagal mengedit data sensor dengan docId ${docId}:`, error);
    throw error;
  }
}

/**
 * Menghapus data sensor berdasarkan ID dokumen di Firestore.
 * @param sensorId - ID sensor (nama koleksi).
 * @param docId - ID dokumen di Firestore.
 */
export async function deleteSensorDataByDocId(
  sensorId: string,
  docId: string
): Promise<void> {
  const docRef = doc(db, sensorId, docId);
  try {
    await deleteDoc(docRef);
    console.log(`Data sensor dengan docId ${docId} berhasil dihapus.`);
  } catch (error) {
    console.error(`Gagal menghapus data sensor dengan docId ${docId}:`, error);
    throw error;
  }
}