"use client"

import React, { useEffect, useState } from "react"
import { fetchAllDevices, addDevice, updateDevice, deleteDevice, generateDeviceToken, Device } from "@/lib/FetchingDevice"
import { fetchDeviceLocation } from "@/lib/FetchingLocation"
import { fetchSensorMetadata } from "@/lib/FetchingSensorData"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  MapPin, Wifi, WifiOff, Calendar, Key, Edit, Trash2, AlertTriangle, Copy, Plus, HardDrive
} from "lucide-react"
import { auth } from "@/lib/ConfigFirebase"

// DeviceCard Component
function DeviceCard({ device, onEdit, onDelete, onGenerateToken }: {
  device: Device & { TelemetryStatus?: "online" | "offline" },
  onEdit: (device: Device) => void,
  onDelete: (device: { id: string; name: string }) => void,
  onGenerateToken: (id: string) => void
}) {
  return (
    <Card key={device.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 dark:border-l-blue-400 bg-white dark:bg-gray-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100">{device.name}</CardTitle>
          <Badge
            variant={device.TelemetryStatus === "online" ? "default" : "destructive"}
            className={device.TelemetryStatus === "online" ? "bg-green-500 dark:bg-green-600" : "bg-red-500 dark:bg-red-600"}
          >
            {device.TelemetryStatus === "online" ? 
              <Wifi className="h-3 w-3 mr-1" /> : 
              <WifiOff className="h-3 w-3 mr-1" />}
            {device.TelemetryStatus === "online" ? "Online" : "Offline"}
          </Badge>
        </div>
        <CardDescription className="flex items-center text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4 mr-1 text-blue-500 dark:text-blue-400" />
          {device.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
            <div>
                <div className="font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">Tanggal Registrasi</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{device.registrationDate}</div>
            </div>
          </div>
          <div className="col-span-2 flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200">Koordinat</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {device.coordinates.lat.toFixed(4)}, 
                {device.coordinates.lng.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" className="flex-1 bg-blue-600 hover:bg-blue-600/50 text-white" onClick={() => onEdit(device)}>
            <Edit className="h-3 w-3 mr-1" /> Edit
          </Button>
          <Button variant="default" size="sm" className="flex-1 bg-green-600 hover:bg-green-600/50 text-white" onClick={() => onGenerateToken(device.id)}>
            <Key className="h-3 w-3 mr-1" /> Token
          </Button>
          <Button variant="default" size="sm" className="flex-1 bg-red-600 hover:bg-red-600/50 text-white" onClick={() => onDelete({ id: device.id, name: device.name })}>
            <Trash2 className="h-3 w-3 mr-1" /> Hapus
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// AddDeviceDialog Component
function AddDeviceDialog({ open, onOpenChange, onAddDevice, onTokenGenerated, trigger }: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onAddDevice: (newDevice: Omit<Device, "id" | "authToken" | "registrationDate" | "userId"> & { authToken?: string, customId?: string }) => Promise<Device>,
  onTokenGenerated: (token: string) => void,
  trigger?: React.ReactNode
}) {
  const [newDevice, setNewDevice] = useState({
    name: "",
    location: "",
    latitude: "",
    longitude: "",
    tokenMode: "auto", // "auto" | "manual"
    manualToken: "",
    idMode: "auto", // "auto" | "manual"
    manualId: "",
  })
  const handleAdd = async () => {
    const deviceToAdd: any = {
      name: newDevice.name,
      location: newDevice.location,
      coordinates: {
        lat: parseFloat(newDevice.latitude) || 0,
        lng: parseFloat(newDevice.longitude) || 0,
      },
    }
    if (newDevice.tokenMode === "manual" && newDevice.manualToken) {
      deviceToAdd.authToken = newDevice.manualToken
    }
    if (newDevice.idMode === "manual" && newDevice.manualId) {
      deviceToAdd.customId = newDevice.manualId
    }
    const addedDevice = await onAddDevice(deviceToAdd)
    if (addedDevice && addedDevice.authToken) {
      onTokenGenerated(addedDevice.authToken)
    }
  }
  const handleDetectLocation = async () => {
    try {
      const coords = await fetchDeviceLocation()
      setNewDevice({
        ...newDevice,
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
      })
    } catch (err) {
      alert("Gagal mengambil lokasi perangkat: " + (err as Error).message)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Tambah Perangkat</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-gray-800 dark:text-gray-300">
          <div className="grid gap-2">
            <Label htmlFor="name">Nama Perangkat</Label>
            <Input id="name" placeholder="Nama Perangkat" value={newDevice.name} onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">Lokasi</Label>
            <Input id="location" placeholder="Lokasi Perangkat" value={newDevice.location} onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input id="latitude" placeholder="Garis Lintang" type="number" value={newDevice.latitude} onChange={(e) => setNewDevice({ ...newDevice, latitude: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input id="longitude" placeholder="Garis Bujur" type="number" value={newDevice.longitude} onChange={(e) => setNewDevice({ ...newDevice, longitude: e.target.value })} />
            </div>
          </div>
          <Button type="button" variant="secondary" className="w-full mb-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900" onClick={handleDetectLocation}>
            Deteksi Lokasi Otomatis
          </Button>
          {/* DeviceRef mode selection */}
          <div className="grid gap-2">
            <Label>ID Perangkat (deviceRef)</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="idMode"
                  value="auto"
                  checked={newDevice.idMode === "auto"}
                  onChange={() => setNewDevice({ ...newDevice, idMode: "auto" })}
                />
                <span>Otomatis</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="idMode"
                  value="manual"
                  checked={newDevice.idMode === "manual"}
                  onChange={() => setNewDevice({ ...newDevice, idMode: "manual" })}
                />
                <span>Manual</span>
              </label>
            </div>
            {newDevice.idMode === "manual" && (
              <Input
                id="manualId"
                placeholder="Masukkan ID perangkat"
                className="mt-2"
                value={newDevice.manualId}
                onChange={(e) => setNewDevice({ ...newDevice, manualId: e.target.value })}
              />
            )}
          </div>
          {/* Token mode selection */}
          <div className="grid gap-2">
            <Label>Token Perangkat</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tokenMode"
                  value="auto"
                  checked={newDevice.tokenMode === "auto"}
                  onChange={() => setNewDevice({ ...newDevice, tokenMode: "auto" })}
                />
                <span>Otomatis</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tokenMode"
                  value="manual"
                  checked={newDevice.tokenMode === "manual"}
                  onChange={() => setNewDevice({ ...newDevice, tokenMode: "manual" })}
                />
                <span>Manual</span>
              </label>
            </div>
            {newDevice.tokenMode === "manual" && (
              <Input
                id="manualToken"
                placeholder="Masukkan token perangkat"
                className="mt-2"
                value={newDevice.manualToken}
                onChange={(e) => setNewDevice({ ...newDevice, manualToken: e.target.value })}
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="text-gray-800 dark:text-gray-400" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button variant="default" className="bg-blue-600 hover:bg-blue-600/50 text-white" onClick={handleAdd}>Tambah Perangkat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// EditDeviceDialog Component
function EditDeviceDialog({ open, onOpenChange, device, onEditDevice, setEditingDevice }: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  device: Device | null,
  onEditDevice: () => Promise<void>,
  setEditingDevice: (device: Device | null) => void
}) {
  if (!device) return null
  const handleDetectLocation = async () => {
    try {
      const coords = await fetchDeviceLocation()
      setEditingDevice({
        ...device,
        coordinates: {
          ...device.coordinates,
          lat: coords.lat,
          lng: coords.lng,
        },
      })
    } catch (err) {
      alert("Gagal mengambil lokasi perangkat: " + (err as Error).message)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Edit Perangkat</DialogTitle>
          <DialogDescription className="dark:text-gray-400">Perbarui informasi perangkat, pengaturan, dan metadata</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-gray-800 dark:text-gray-300">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Nama Perangkat</Label>
            <Input id="edit-name" value={device.name} onChange={(e) => setEditingDevice({ ...device, name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-location">Lokasi</Label>
            <Input id="edit-location" value={device.location} onChange={(e) => setEditingDevice({ ...device, location: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-lat">Latitude</Label>
              <Input id="edit-lat" type="number" step="0.0001" value={device.coordinates.lat} onChange={(e) => setEditingDevice({ ...device, coordinates: { ...device.coordinates, lat: Number.parseFloat(e.target.value) } })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lng">Longitude</Label>
              <Input id="edit-lng" type="number" step="0.0001" value={device.coordinates.lng} onChange={(e) => setEditingDevice({ ...device, coordinates: { ...device.coordinates, lng: Number.parseFloat(e.target.value) } })} />
            </div>
          </div>
          <Button type="button" variant="secondary" className="w-full mb-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900" onClick={handleDetectLocation}>
            Deteksi Lokasi Otomatis
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" className="text-gray-800 dark:text-gray-400" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button variant="default" className="bg-blue-600 hover:bg-blue-600/50 text-white" onClick={onEditDevice}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// DeleteConfirmationDialog Component
function DeleteConfirmationDialog({ open, onOpenChange, onConfirm, deviceName }: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onConfirm: () => void,
  deviceName?: string | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-gray-900">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <DialogTitle className="dark:text-gray-100">Konfirmasi Penghapusan</DialogTitle>
          </div>
          <DialogDescription className="dark:text-gray-400">
            Apakah Anda yakin ingin menghapus perangkat <strong>{deviceName || "ini"}</strong>? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false) }}>Hapus</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// DeviceTokenDialog Component
function DeviceTokenDialog({ open, onOpenChange, token }: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  token: string
}) {
  const { toast } = useToast()
  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(token)
    toast({
      title: "Disalin",
      description: "Token perangkat disalin ke clipboard!",
    })
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Token Perangkat</DialogTitle>
          <DialogDescription className="dark:text-gray-400">Gunakan token ini untuk mengautentikasi perangkat IoT Anda</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono break-all text-blue-700 dark:text-blue-300">{token}</code>
              <Button variant="outline" size="sm" onClick={copyTokenToClipboard} className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-blue-500 dark:text-blue-400">
            <p>Simpan token ini dengan aman. Token ini tidak akan kedaluwarsa.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="default" className="bg-blue-600 hover:bg-blue-600/50 text-white" onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Main Page Component
export default function PerangkatPage() {
  const [devices, setDevices] = useState<(Device & { TelemetryStatus?: "online" | "offline" })[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showTokenDialog, setShowTokenDialog] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [deletingDevice, setDeletingDevice] = useState<{ id: string; name: string } | null>(null)
  const [token, setToken] = useState<string>("")
  const [uid, setUid] = useState<string | null>(null)

  // Replace with actual userId from auth/session
  // const userId = "demo-user-id"

  useEffect(() => {
    // Ambil uid dari Firebase Auth
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUid(user ? user.uid : null)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const loadDevices = async () => {
      if (!uid) return
      setLoading(true)
      const fetched = await fetchAllDevices(uid)
      // Ambil status Telemetry untuk setiap device
      const devicesWithStatus = await Promise.all(
        (fetched as Device[]).map(async (device) => {
          let TelemetryStatus: "online" | "offline" = "offline"
          try {
            // Gunakan authToken sebagai ID untuk mengambil data sensor. Fallback ke ID jika tidak ada.
            const sensorToken = device.authToken || device.id
            const meta = await fetchSensorMetadata(uid, sensorToken)
            TelemetryStatus = meta.TelemetryStatus
          } catch {
            TelemetryStatus = "offline"
          }
          return { ...device, TelemetryStatus }
        })
      )
      setDevices(devicesWithStatus)
      setLoading(false)
    }
    loadDevices()
  }, [uid])

  const handleAddDevice = async (newDevice: Omit<Device, "id" | "authToken" | "registrationDate" | "userId"> & { authToken?: string, customId?: string }) => {
    if (!uid) {
      throw new Error("User not authenticated");
    }
    const added = await addDevice({ ...newDevice, userId: uid })
    setDevices((prev) => [...prev, added as Device])
    setShowAddDialog(false)
    return added
  }

  const handleEditDevice = async () => {
    if (!editingDevice || !uid) return
    const { id, ...deviceData } = editingDevice
    const updated = await updateDevice(uid, id, deviceData)
    if (updated) {
      setDevices((prev) =>
        prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
      )
    }
    setShowEditDialog(false)
    setEditingDevice(null)
  }

  const handleDeleteDevice = async () => {
    if (!deletingDevice || !uid) return
    const success = await deleteDevice(uid, deletingDevice.id)
    if (success) {
      setDevices((prev) => prev.filter((d) => d.id !== deletingDevice.id))
    }
    setShowDeleteDialog(false)
    setDeletingDevice(null)
  }

  const handleGenerateToken = async (id: string) => {
    if (!uid) return
    const result = await generateDeviceToken(uid, id)
    if (result) {
      setToken(result.token)
      setShowTokenDialog(true)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Perangkat</h2>
          <p className="text-muted-foreground dark:text-gray-400">Daftar perangkat yang terhubung dengan sistem</p>
        </div>
        <AddDeviceDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAddDevice={handleAddDevice}
          onTokenGenerated={(token) => { setToken(token); setShowTokenDialog(true) }}
          trigger={
            <Button
              className="px-4 py-2 rounded flex items-center bg-blue-600 hover:bg-blue-600/50 text-white"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Tambah Perangkat</span>
            </Button>
          }
        />
      </div>
      {loading ? (
        <div className="text-center text-gray-500 dark:text-gray-300">Memuat perangkat...</div>
      ) : devices.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onEdit={(d) => { setEditingDevice(d); setShowEditDialog(true) }}
              onDelete={(d) => { setDeletingDevice(d); setShowDeleteDialog(true) }}
              onGenerateToken={handleGenerateToken}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-16 mt-10 border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 max-w-2xl mx-auto">
          <HardDrive className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-6" />
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Belum Ada Perangkat</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6 max-w-md">Mulai dengan menambahkan perangkat monitoring pertama Anda untuk melihat data</p>
          <Button
            className="px-6 py-3 rounded-lg flex items-center text-base bg-blue-600 hover:bg-blue-600/50 text-white"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Tambah Perangkat
          </Button>
        </div>
      )}

      <EditDeviceDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        device={editingDevice}
        onEditDevice={handleEditDevice}
        setEditingDevice={setEditingDevice}
      />

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteDevice}
        deviceName={deletingDevice?.name}
      />

      <DeviceTokenDialog
        open={showTokenDialog}
        onOpenChange={setShowTokenDialog}
        token={token}
      />
    </div>
  )
}