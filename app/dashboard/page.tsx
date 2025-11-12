"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ThermometerIcon,
  DropletsIcon,
  WavesIcon,
  EyeIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  RadioIcon,
  WifiIcon,
  WifiOffIcon,
  BatteryIcon,
  RefreshCwIcon,
  GaugeIcon,
  CalendarIcon,
  ClockIcon,
} from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { useAuth } from "@/hooks/useAuth"
import Loading from "../loading"

// Dummy data for water quality monitoring
const dummyDevices = [
  {
    id: "1",
    name: "Stasiun Sungai Serayu",
    location: "Banyumas",
    status: "online",
    waterTemperature: 26.5,
    ph: 7.2,
    turbidity: 25, // NTU
    tds: 150, // ppm
    batteryLevel: 85,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Pos Pantau Waduk Sempor",
    location: "Gombong",
    status: "offline",
    waterTemperature: 25.1,
    ph: 6.8,
    turbidity: 45,
    tds: 210,
    batteryLevel: 25,
    lastUpdate: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "Titik Ukur Irigasi",
    location: "Adimulyo",
    status: "online",
    waterTemperature: 27.2,
    ph: 7.5,
    turbidity: 15,
    tds: 120,
    batteryLevel: 60,
    lastUpdate: new Date(Date.now() - 1800 * 1000).toISOString(),
  },
  {
    id: "4",
    name: "Stasiun Riset Tambak",
    location: "Puring",
    status: "online",
    waterTemperature: 28.1,
    ph: 8.1,
    turbidity: 10,
    tds: 500,
    batteryLevel: 70,
    lastUpdate: new Date(Date.now() - 600 * 1000).toISOString(),
  },
]
const dummyDeviceStats = {
  totalDevices: 4,
  onlineDevices: 3,
  alertDevices: 1,
  avgBatteryLevel: 60,
}
const dummyRecentAlerts = [
  {
    id: "a1",
    message: "Kekeruhan tinggi terdeteksi di Waduk Sempor!",
    timestamp: new Date().toISOString(),
    device: "Pos Pantau Waduk Sempor",
    severity: "tinggi",
  },
]
const dummyWaterQualityStats = {
  averageTemperature: 26.7,
  averagePh: 7.4,
  activeAlerts: 1,
  anomalies: 2,
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Dummy state
  const [devices, setDevices] = useState(dummyDevices)
  const [deviceStats, setDeviceStats] = useState(dummyDeviceStats)
  const [recentAlerts, setRecentAlerts] = useState(dummyRecentAlerts)
  const [waterQualityStats, setWaterQualityStats] = useState(dummyWaterQualityStats)
  const [refreshing, setRefreshing] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate fetching new data
    setTimeout(() => {
      // Create new dummy data to simulate an update
      const newDummyDevices = devices.map((device) => ({
        ...device,
        waterTemperature: device.waterTemperature + (Math.random() - 0.5) * 1,
        ph: device.ph + (Math.random() - 0.5) * 0.2,
        turbidity: Math.max(5, device.turbidity + (Math.random() - 0.5) * 5),
        tds: Math.max(100, device.tds + (Math.random() - 0.5) * 20),
        batteryLevel: Math.max(0, Math.min(100, device.batteryLevel - Math.floor(Math.random() * 5))),
        lastUpdate: new Date().toISOString(),
      }))

      const onlineCount = newDummyDevices.filter((d) => d.status === "online").length
      const newDeviceStats = {
        totalDevices: newDummyDevices.length,
        onlineDevices: onlineCount,
        alertDevices: Math.floor(Math.random() * 3),
        avgBatteryLevel: Math.round(
          newDummyDevices.reduce((acc, d) => acc + d.batteryLevel, 0) / newDummyDevices.length
        ),
      }

      const newWaterQualityStats = {
        averageTemperature: 26.7 + (Math.random() - 0.5) * 2,
        averagePh: 7.4 + (Math.random() - 0.5) * 0.5,
        activeAlerts: 1 + Math.floor(Math.random() * 2),
        anomalies: Math.floor(Math.random() * 3),
      }

      // Update state with new data
      setDevices(newDummyDevices)
      setDeviceStats(newDeviceStats)
      setWaterQualityStats(newWaterQualityStats)

      setRefreshing(false)
    }, 1000)
  }

  const getTrendIcon = (trend: string, size = "h-4 w-4") => {
    switch (trend) {
      case "up":
        return <TrendingUpIcon className={`${size} text-green-600`} />
      case "down":
        return <TrendingDownIcon className={`${size} text-red-600`} />
      default:
        return <MinusIcon className={`${size} text-gray-600`} />
    }
  }

  const getStatusColor = (status: string) => {
    return status === "online" ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
  }

  if (authLoading || !user) {
    return <Loading />
  }

  if (!authLoading && user && (!devices || devices.length === 0)) {
    return <EmptyState type="dashboard" />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Beranda</h2>
          <p className="text-muted-foreground dark:text-gray-400">Ringkasan Sistem Pemantauan Kualitas Air</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-700 dark:hover:bg-green-800 dark:text-gray-50"
        >
          <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Welcome Card */}
      <Card className="shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white dark:from-blue-600 dark:to-cyan-600">
        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold">Selamat Datang, {user?.displayName || user?.email}!</h3>
          </div>
          <div className="flex items-center gap-6 text-right">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-200" />
              <span className="font-medium">
                {currentDateTime.toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-blue-200" />
              <span className="font-medium">{currentDateTime.toLocaleTimeString("id-ID")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-l-4 border-l-blue-500 dark:bg-gradient-to-br dark:from-blue-900/50 dark:to-cyan-900/50 dark:border-l-blue-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Perangkat</CardTitle>
            <RadioIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">{deviceStats?.totalDevices || 0}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">Stasiun terhubung</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-green-500 dark:bg-gradient-to-br dark:from-green-900/50 dark:to-emerald-900/50 dark:border-l-green-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">Perangkat Online</CardTitle>
            <WifiIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-200">{deviceStats?.onlineDevices || 0}</div>
            <p className="text-xs text-green-600 dark:text-green-400">Aktif sekarang</p>
          </CardContent>
        </Card>
      </div>

      {/* Device Status Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Devices */}
        <Card className="shadow-lg border-l-4 border-l-blue-500 dark:border-l-blue-400 dark:bg-gray-800/50">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:bg-none dark:bg-gray-800">
            <CardTitle className="flex items-center text-blue-800 dark:text-blue-300">
              <WifiIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Perangkat Aktif
            </CardTitle>
            <CardDescription className="text-blue-600 dark:text-blue-400">Monitoring real-time</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {devices.filter((d) => d.status === "online").length === 0 ? (
              <div className="text-center py-4 text-muted-foreground dark:text-gray-400">Tidak ada perangkat aktif</div>
            ) : (
              devices
                .filter((d) => d.status === "online")
                .slice(0, 3)
                .map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg dark:bg-gradient-to-r dark:from-gray-700/50 dark:to-gray-700"
                  >
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">{device.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{device.location}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                        <WifiIcon className="h-3 w-3 mr-1" />
                        Online
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{device.ph.toFixed(1)} pH</div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <WavesIcon className="h-3 w-3" />
                          <span className="text-xs ml-1">Keasaman</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="shadow-lg border-l-4 border-l-red-500 dark:border-l-red-400 dark:bg-gray-800/50">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:bg-none dark:bg-gray-800">
            <CardTitle className="flex items-center text-red-800 dark:text-red-300">
              <AlertTriangleIcon className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
              Peringatan Terbaru
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">Notifikasi sistem</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {recentAlerts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground dark:text-gray-400">
                <CheckCircleIcon className="h-8 w-8 mx-auto mb-2 text-green-500 dark:text-green-400" />
                Tidak ada peringatan terbaru
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start space-x-3 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg dark:bg-gradient-to-r dark:from-gray-700/50 dark:to-gray-700"
                >
                  <AlertTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{alert.message}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(alert.timestamp).toLocaleString()} • {alert.device}
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {alert.severity}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device Performance Summary */}
      <Card className="shadow-lg border-l-4 border-l-indigo-500 dark:border-l-indigo-400 dark:bg-gray-800/50">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:bg-none dark:bg-gray-800">
          <CardTitle className="flex items-center text-indigo-800 dark:text-indigo-300">
            <GaugeIcon className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Status Perangkat
          </CardTitle>
          <CardDescription className="text-indigo-600 dark:text-indigo-400">Kesehatan dan data setiap stasiun</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((device) => (
              <div key={device.id} className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg dark:bg-gradient-to-br dark:from-gray-700/50 dark:to-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 truncate">{device.name}</h4>
                  <div className={`flex items-center ${getStatusColor(device.status)}`}>
                    {device.status === "online" ? (
                      <WifiIcon className="h-4 w-4" />
                    ) : (
                      <WifiOffIcon className="h-4 w-4" />
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Suhu Air:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{device.waterTemperature.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">pH:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{device.ph.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Kekeruhan:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{device.turbidity.toFixed(0)} NTU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">TDS:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{device.tds.toFixed(0)} ppm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Baterai:</span>
                    <span
                      className={`font-medium ${device.batteryLevel < 30 ? "text-red-500 dark:text-red-400" : "text-green-500 dark:text-green-400"}`}
                    >
                      {device.batteryLevel}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-600 mt-2">
                    <span>Update terakhir:</span>
                    <span>{new Date(device.lastUpdate).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}