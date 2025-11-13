import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  serverTimestamp,
  getDoc,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore"
import { db } from "@/lib/ConfigFirebase"
import { addLogEvent } from "@/lib/FetchingLogs"

export interface Device {
  id: string
  name: string
  location: string
  registrationDate: string
  coordinates: {
    lat: number
    lng: number
  }
  userId: string
  authToken?: string
}

export interface DeviceToken {
  token: string
  deviceId: string
}

// Generate a unique 10-character ID
const generateUniqueId = () => {
  return Math.random().toString(36).substring(2, 12)
}

// Helper function to format date
const formatDate = (date: Date) => {
  return date.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export async function fetchAllDevices(userId: string): Promise<Device[]> {
  try {
    // Path diubah menjadi koleksi root 'devices'
    const devicesRef = collection(db, "devices")
    // Tambahkan query untuk memfilter berdasarkan userId
    const q = query(devicesRef, where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    const devices: Device[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()

      const registrationDateTimestamp = data.registrationDate || data.createdAt
      const registrationDate =
        registrationDateTimestamp instanceof Timestamp
          ? formatDate(registrationDateTimestamp.toDate())
          : formatDate(new Date())

      devices.push({
        id: doc.id,
        name: data.name,
        location: data.location,
        registrationDate: registrationDate,
        coordinates: data.coordinates || { lat: 0.0, lng: 0.0 },
        userId: data.userId,
        authToken: data.authToken,
      })
    })

    return devices
  } catch (error) {
    console.error("Error fetching devices:", error)
    return []
  }
}

export async function fetchDevice(userId: string, deviceId: string): Promise<Device | null> {
  try {
    // Path diubah menjadi koleksi root 'devices'
    const deviceRef = doc(db, "devices", deviceId)
    const docSnap = await getDoc(deviceRef)

    if (!docSnap.exists() || docSnap.data().userId !== userId) {
      console.warn(`Device ${deviceId} not found or access denied for user ${userId}.`)
      return null
    }

    const data = docSnap.data()

    const registrationDateTimestamp = data.registrationDate || data.createdAt
    const registrationDate =
      registrationDateTimestamp instanceof Timestamp
        ? formatDate(registrationDateTimestamp.toDate())
        : formatDate(new Date())

    return {
      id: docSnap.id,
      name: data.name,
      location: data.location,
      registrationDate: registrationDate,
      coordinates: data.coordinates || { lat: 0.0, lng: 0.0 },
      userId: data.userId,
      authToken: data.authToken,
    }
  } catch (error) {
    console.error(`Error fetching device ${deviceId}:`, error)
    return null
  }
}

export async function addDevice(
  deviceData: Omit<Device, "id" | "authToken" | "registrationDate"> & { authToken?: string; customId?: string }
): Promise<Device> {
  try {
    const timestamp = serverTimestamp()
    const newId = deviceData.customId ? deviceData.customId : generateUniqueId()

    const token = deviceData.authToken ? deviceData.authToken : newId

    // Path diubah menjadi koleksi root 'devices'
    const deviceRef = doc(db, "devices", newId)

    const newDeviceData = {
      ...deviceData,
      id: newId,
      createdAt: timestamp,
      updatedAt: timestamp,
      registrationDate: new Date(),
      authToken: token,
    }

    await setDoc(deviceRef, newDeviceData)

    const newDevice: Device = {
      id: newId,
      ...deviceData,
      registrationDate: formatDate(new Date()),
      authToken: token,
    }

    await addLogEvent(deviceData.userId, newId, "configuration", "Device created", "low", newDevice.name)

    return newDevice
  } catch (error) {
    console.error("Error adding device:", error)
    throw error
  }
}

export async function updateDevice(
  userId: string,
  deviceId: string,
  deviceData: Partial<Omit<Device, "id">>
): Promise<Device | null> {
  try {
    // Path diubah menjadi koleksi root 'devices'
    const deviceRef = doc(db, "devices", deviceId)

    // Verifikasi bahwa pengguna memiliki izin untuk mengedit perangkat ini
    const deviceSnap = await getDoc(deviceRef)
    if (!deviceSnap.exists() || deviceSnap.data().userId !== userId) {
      throw new Error("Device not found or permission denied.")
    }

    await updateDoc(deviceRef, {
      ...deviceData,
      updatedAt: serverTimestamp(),
    })

    const docSnap = await getDoc(deviceRef)
    if (!docSnap.exists()) {
      return null
    }
    const updatedData = docSnap.data() as Device

    await addLogEvent(userId, deviceId, "configuration", "Device updated", "low", updatedData.name)

    return { ...updatedData, id: deviceId }
  } catch (error) {
    console.error("Error updating device:", error)
    return null
  }
}

export async function deleteDevice(userId: string, deviceId: string): Promise<boolean> {
  try {
    // Path diubah menjadi koleksi root 'devices'
    const deviceRef = doc(db, "devices", deviceId)
    const deviceSnap = await getDoc(deviceRef)
    if (!deviceSnap.exists() || deviceSnap.data().userId !== userId) {
      console.warn(`Device ${deviceId} not found or permission denied for user ${userId}.`)
      return false
    }
    const device = deviceSnap.data() as Device

    await deleteDoc(deviceRef)

    await addLogEvent(userId, deviceId, "configuration", "Device deleted", "medium", device.name)

    return true
  } catch (error) {
    console.error("Error deleting device:", error)
    return false
  }
}

export async function generateDeviceToken(userId: string, deviceId: string): Promise<DeviceToken | null> {
  try {
    // Path diubah menjadi koleksi root 'devices'
    const deviceRef = doc(db, "devices", deviceId)
    const deviceSnap = await getDoc(deviceRef)
    if (!deviceSnap.exists() || deviceSnap.data().userId !== userId) {
      console.warn(`Device ${deviceId} not found or permission denied for user ${userId}.`)
      return null
    }
    const device = deviceSnap.data() as Device

    const token = device.authToken || device.id

    await addLogEvent(userId, deviceId, "configuration", "Authentication token retrieved", "low", device.name)

    return { token, deviceId }
  } catch (error) {
    console.error("Error generating device token:", error)
    throw error
  }
}