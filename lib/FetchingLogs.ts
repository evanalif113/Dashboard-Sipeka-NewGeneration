import { ref, set, get, query, limitToLast, orderByKey, remove } from "firebase/database"
import { rtdb } from "@/lib/ConfigFirebase"

export interface LogEvent {
  id: string
  type: "alert" | "connection" | "disconnection" | "configuration" | "threshold"
  message: string
  severity: "high" | "medium" | "low"
  timestamp: Date
  device: string
  deviceId: string
  userId: string
}

export interface LogFilters {
  searchTerm?: string
  type?: string
  severity?: string
  dateRange?: string
}

export async function fetchLogs(userId: string, limit = 100): Promise<LogEvent[]> {
  try {
    const logsRef = ref(rtdb, `logs/${userId}`)
    const logsQuery = query(logsRef, orderByKey(), limitToLast(limit))
    const snapshot = await get(logsQuery)

    if (!snapshot.exists()) {
      return []
    }

    const logs: LogEvent[] = []
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val()
      logs.push({
        id: childSnapshot.key!,
        type: data.type,
        message: data.message,
        severity: data.severity,
        timestamp: new Date(data.timestamp),
        device: data.device,
        deviceId: data.deviceId,
        userId: data.userId || userId,
      })
    })

    return logs.reverse() // Most recent first
  } catch (error) {
    console.error("Error fetching logs:", error)
    return []
  }
}

export async function fetchFilteredLogs(userId: string, filters: LogFilters): Promise<LogEvent[]> {
  try {
    const allLogs = await fetchLogs(userId, 500) // Get more logs for filtering

    let filteredLogs = allLogs

    // Apply search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase()
      filteredLogs = filteredLogs.filter(
        (log) => log.message.toLowerCase().includes(searchTerm) || log.device.toLowerCase().includes(searchTerm),
      )
    }

    // Apply type filter
    if (filters.type) {
      filteredLogs = filteredLogs.filter((log) => log.type === filters.type)
    }

    // Apply severity filter
    if (filters.severity) {
      filteredLogs = filteredLogs.filter((log) => log.severity === filters.severity)
    }

    // Apply date range filter
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
          startDate = new Date(0)
      }

      filteredLogs = filteredLogs.filter((log) => log.timestamp >= startDate)
    }

    return filteredLogs
  } catch (error) {
    console.error("Error filtering logs:", error)
    return []
  }
}

export async function fetchRecentAlerts(userId: string, limit = 5): Promise<LogEvent[]> {
  try {
    const allLogs = await fetchLogs(userId, 100)
    return allLogs.filter((log) => log.type === "alert" || log.severity === "high").slice(0, limit)
  } catch (error) {
    console.error("Error fetching recent alerts:", error)
    return []
  }
}

export async function addLogEvent(
  userId: string,
  deviceId: string,
  type: LogEvent["type"],
  message: string,
  severity: LogEvent["severity"],
  deviceName: string,
): Promise<void> {
  try {
    const timestamp = Date.now()
    const logRef = ref(rtdb, `logs/${userId}/${timestamp}`)
    await set(logRef, {
      deviceId,
      type,
      message,
      severity,
      timestamp: timestamp,
      device: deviceName,
      userId,
    })
  } catch (error) {
    console.error("Error adding log event:", error)
    throw error
  }
}

export async function deleteLogEvent(userId: string, logId: string): Promise<void> {
  try {
    const logRef = ref(rtdb, `logs/${userId}/${logId}`)
    await remove(logRef)
  } catch (error) {
    console.error("Error deleting log event:", error)
    throw error
  }
}
