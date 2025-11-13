// filepath: d:\Github\Dashboard-Sipeka\lib\FetchingLogs.ts
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  QueryConstraint,
  getDoc,
} from "firebase/firestore"
import { db } from "@/lib/ConfigFirebase" // Menggunakan instance Firestore

export interface LogEvent {
  id: string
  type: "alert" | "connection" | "disconnection" | "configuration" | "threshold"
  message: string
  severity: "high" | "medium" | "low"
  timestamp: Date
  device: string
  deviceId: string
  userId: string // Tambahkan kembali userId
}

export interface LogFilters {
  searchTerm?: string
  type?: string
  severity?: string
  dateRange?: string
}

// Helper untuk mengubah dokumen Firestore menjadi objek LogEvent
function formatLog(doc: any): LogEvent {
  const data = doc.data()
  return {
    id: doc.id,
    type: data.type,
    message: data.message,
    severity: data.severity,
    timestamp: (data.timestamp as Timestamp).toDate(), // Konversi Firestore Timestamp ke Date
    device: data.device,
    deviceId: data.deviceId,
    userId: data.userId, // Ambil userId dari dokumen
  }
}

export async function fetchLogs(userId: string, limitCount = 100): Promise<LogEvent[]> {
  try {
    // Path koleksi sekarang: 'logs' di root
    const logsCollection = collection(db, "logs")
    const q = query(
      logsCollection,
      where("userId", "==", userId), // Filter berdasarkan userId
      orderBy("timestamp", "desc"),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return []
    }

    return querySnapshot.docs.map(formatLog)
  } catch (error) {
    console.error("Error fetching logs from Firestore:", error)
    return []
  }
}

export async function fetchFilteredLogs(userId: string, filters: LogFilters): Promise<LogEvent[]> {
  try {
    // Path koleksi sekarang: 'logs' di root
    const logsCollection = collection(db, "logs")
    const queryConstraints: QueryConstraint[] = [where("userId", "==", userId)] // Selalu filter berdasarkan userId

    // Apply server-side filters
    if (filters.type) {
      queryConstraints.push(where("type", "==", filters.type))
    }
    if (filters.severity) {
      queryConstraints.push(where("severity", "==", filters.severity))
    }
    if (filters.dateRange) {
      const now = new Date()
      let startDate: Date

      switch (filters.dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0) // A very old date to include everything
      }
      queryConstraints.push(where("timestamp", ">=", Timestamp.fromDate(startDate)))
    }

    // Add ordering
    queryConstraints.push(orderBy("timestamp", "desc"))

    const q = query(logsCollection, ...queryConstraints)
    const querySnapshot = await getDocs(q)

    let logs = querySnapshot.docs.map(formatLog)

    // Apply client-side search filter (Firestore doesn't support partial text search well)
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase()
      logs = logs.filter(
        (log) =>
          log.message.toLowerCase().includes(searchTerm) ||
          log.device.toLowerCase().includes(searchTerm)
      )
    }

    return logs
  } catch (error) {
    console.error("Error filtering logs from Firestore:", error)
    return []
  }
}

export async function fetchRecentAlerts(userId: string, limitCount = 5): Promise<LogEvent[]> {
  try {
    // Path koleksi sekarang: 'logs' di root
    const logsCollection = collection(db, "logs")
    const q = query(
      logsCollection,
      where("userId", "==", userId), // Filter berdasarkan userId
      where("severity", "in", ["high", "medium"]), // Ambil alert dengan severity tinggi atau medium
      orderBy("timestamp", "desc"),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return []
    }

    return querySnapshot.docs.map(formatLog)
  } catch (error) {
    console.error("Error fetching recent alerts from Firestore:", error)
    return []
  }
}

export async function addLogEvent(
  userId: string,
  deviceId: string,
  type: LogEvent["type"],
  message: string,
  severity: LogEvent["severity"],
  deviceName: string
): Promise<void> {
  try {
    // Path koleksi sekarang: 'logs' di root
    const logsCollection = collection(db, "logs")
    await addDoc(logsCollection, {
      userId, // Simpan userId di dalam dokumen
      deviceId,
      type,
      message,
      severity,
      device: deviceName,
      timestamp: Timestamp.now(), // Gunakan Timestamp server
    })
  } catch (error) {
    console.error("Error adding log event to Firestore:", error)
    throw error
  }
}

export async function deleteLogEvent(userId: string, logId: string): Promise<void> {
  try {
    // Path dokumen sekarang: logs/{logId}
    const logDocRef = doc(db, "logs", logId)

    // Verifikasi bahwa pengguna memiliki izin untuk menghapus log ini
    const logSnap = await getDoc(logDocRef)
    if (!logSnap.exists() || logSnap.data().userId !== userId) {
      throw new Error("Log not found or permission denied.")
    }

    await deleteDoc(logDocRef)
  } catch (error) {
    console.error("Error deleting log event from Firestore:", error)
    throw error
  }
}
