"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangleIcon, ChevronLeftIcon, ThermometerIcon, WavesIcon, DropletsIcon } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import Loading from "../../../loading"
import { fetchDevice } from "@/lib/FetchingDevice"
import { fetchSensorData, fetchSensorMetadata, SensorDate } from "@/lib/FetchingSensorData"
import { getStatusPH, getStatusSuhu, getStatusAmoniak, getOverallStatus, getOverallStatusDisplay } from "@/lib/StatusUtils"

export default function DeviceDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const deviceId = params?.id

  const [device, setDevice] = useState<any | null>(null)
  const [latest, setLatest] = useState<SensorDate | null>(null)
  const [status, setStatus] = useState<"online" | "offline">("offline")

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])

  useEffect(() => {
    const load = async () => {
      if (!user?.uid || !deviceId) return
      const d = await fetchDevice(user.uid, deviceId)
      if (!d) {
        router.replace("/dashboard/perangkat")
        return
      }
      setDevice(d)

      const sensorToken = d.authToken || d.id
      const [meta, dataArr] = await Promise.all([
        fetchSensorMetadata(user.uid, sensorToken),
        fetchSensorData(user.uid, sensorToken, 1),
      ])
      setStatus(meta.TelemetryStatus)
      setLatest(dataArr.length ? dataArr[0] : null)
    }
    load()
  }, [user?.uid, deviceId, router])

  const computed = useMemo(() => {
    if (!latest) return null
    const ph = getStatusPH(latest.ph_level)
    const suhu = getStatusSuhu(latest.suhu)
    const amonia = getStatusAmoniak(latest.amonia)
    const overall = getOverallStatus(ph.status, suhu.status, amonia.status)
    const display = getOverallStatusDisplay(overall)
    return { ph, suhu, amonia, overall, display }
  }, [latest])

  if (authLoading || (!user && !authLoading)) return <Loading />
  if (!device) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/perangkat"><Button variant="outline"><ChevronLeftIcon className="h-4 w-4 mr-1"/>Kembali</Button></Link>
          <h2 className="text-xl font-semibold">Perangkat</h2>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">Memuat detail perangkat...</CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/perangkat">
          <Button variant="outline" className="bg-white dark:bg-gray-800">
            <ChevronLeftIcon className="h-4 w-4 mr-1"/>
            Kembali
          </Button>
        </Link>
      </div>

      {/* Device Info Card */}
      <Card className="shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white dark:from-blue-600 dark:to-cyan-600">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{device.name}</h2>
              <p className="text-blue-100 mt-1">{device.location}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="text-sm">
                  <span className="opacity-80">Koordinat: </span>
                  <span className="font-medium">
                    {device.coordinates.lat.toFixed(4)}, {device.coordinates.lng.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
            <Badge 
              variant={status === "online" ? "default" : "destructive"} 
              className={`${status === "online" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white px-4 py-2 text-base`}
            >
              {status === "online" ? "● Online" : "● Offline"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Overall Status */}
      <Card className="border-l-4 border-l-indigo-500 dark:border-l-indigo-400 dark:bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center text-indigo-800 dark:text-indigo-300">
            Status Ringkas
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Kondisi perangkat saat ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          {computed ? (
            <div className="flex items-center gap-3">
              <div className={`text-2xl ${computed.display.className}`}>
                {computed.display.emoji}
              </div>
              <div>
                <div className={`text-xl font-semibold ${computed.display.className}`}>
                  {computed.overall}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {computed.overall === "Aman" && "Parameter dalam kondisi baik"}
                  {computed.overall === "Waspada" && "Perlu perhatian"}
                  {computed.overall === "Bahaya" && "Segera lakukan tindakan"}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">Data belum tersedia</div>
          )}
        </CardContent>
      </Card>

      {/* Parameter Details - Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* pH Card */}
        <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400 dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <WavesIcon className="h-4 w-4" />
              pH Level
            </CardTitle>
            <CardDescription>
              {latest ? latest.ph_level.toFixed(1) : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {computed ? (
              <>
                <Badge className={`${computed.ph.className} mb-3`}>
                  {computed.ph.status}
                </Badge>
                <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {computed.ph.rekomendasi}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">Data tidak tersedia</div>
            )}
          </CardContent>
        </Card>

        {/* Suhu Card */}
        <Card className="border-l-4 border-l-orange-500 dark:border-l-orange-400 dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ThermometerIcon className="h-4 w-4" />
              Suhu
            </CardTitle>
            <CardDescription>
              {latest ? latest.suhu.toFixed(1) : "N/A"}°C
            </CardDescription>
          </CardHeader>
          <CardContent>
            {computed ? (
              <>
                <Badge className={`${computed.suhu.className} mb-3`}>
                  {computed.suhu.status}
                </Badge>
                <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {computed.suhu.rekomendasi}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">Data tidak tersedia</div>
            )}
          </CardContent>
        </Card>

        {/* Amonia Card */}
        <Card className="border-l-4 border-l-purple-500 dark:border-l-purple-400 dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DropletsIcon className="h-4 w-4" />
              Amonia
            </CardTitle>
            <CardDescription>
              {latest ? latest.amonia.toFixed(2) : "N/A"} ppm
            </CardDescription>
          </CardHeader>
          <CardContent>
            {computed ? (
              <>
                <Badge className={`${computed.amonia.className} mb-3`}>
                  {computed.amonia.status}
                </Badge>
                <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {computed.amonia.rekomendasi}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">Data tidak tersedia</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metadata - Last Update */}
      {latest && (
        <Card className="dark:bg-gray-800/50">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Terakhir diperbarui: <span className="font-medium">{latest.dateFormatted}</span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
