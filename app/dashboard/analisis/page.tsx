"use client"

import { useState, useEffect } from "react"
import { fetchSensorData } from "@/lib/FetchingSensorData"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
// Import icons from lucide-react
import { RefreshCw, Download, ThermometerSun, Droplets, Gauge, Sprout, BatteryCharging, ScatterChart } from "lucide-react"
import ChartComponent from "@/components/ChartComponent"

export default function AnalisisPage() {
  // State for data
  const [timestamps, setTimestamps] = useState<string[]>([])
  const [temperatures, setTemperatures] = useState<number[]>([])
  const [humidity, setHumidity] = useState<number[]>([])
  const [pressure, setPressure] = useState<number[]>([])
  const [dew, setDew] = useState<number[]>([])
  const [volt, setVolt] = useState<number[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sensorId, setSensorId] = useState("id-03")
  const [dataPoints, setDataPoints] = useState(60) // Default to 1 hour (60 minutes)

  // Fetch data from Firebase
  const fetchData = async () => {
    try {
      setLoading(true)
      const sensorData = await fetchSensorData(sensorId, dataPoints)

      if (sensorData.length > 0) {
        const Timestamps: string[] = sensorData.map(d => d.timeFormatted || new Date(d.timestamp).toLocaleString('id-ID', { timeZone: "Asia/Jakarta" }));
        const temperatures = sensorData.map(d => d.temperature).reverse()
        const humidity = sensorData.map(d => d.humidity).reverse()
        const pressure = sensorData.map(d => d.pressure).reverse()
        const dew = sensorData.map(d => d.dew).reverse()
        const volt = sensorData.map(d => d.volt).reverse()

        setTimestamps(Timestamps)
        setTemperatures(temperatures)
        setHumidity(humidity)
        setPressure(pressure)
        setDew(dew)
        setVolt(volt)
        setError(null)
      } else {
        // Reset data jika tidak ada
        setTimestamps([])
        setTemperatures([])
        setHumidity([])
        setPressure([])
        setDew([])
        setVolt([])
        setError("Tidak ada data yang tersedia untuk saat ini.")
      }
    } catch (err) {
      console.error("Error mengambil data: ", err)
      setError("Gagal mengambil data.")
    } finally {
      setLoading(false)
    }
  }

  // Initialize component
  useEffect(() => {
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [sensorId, dataPoints])

  // Fungsi untuk menentukan rentang sumbu Y
  function getYAxisDomain(data: number[]) {
    if (!data.length) return undefined;
    const min = Math.min(...data);
    const max = Math.max(...data);
    if (min === max) return [min - 1, max + 1];
    return [min - (max - min) * 0.1, max + (max - min) * 0.1];
  }

  // Common layout settings for charts
  const commonLayout = {
    autosize: true,
    margin: { l: 60, r: 40, t: 40, b: 60 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: {
      family: "Roboto, sans-serif",
      color: "#64748b",
    },
    xaxis: {
      gridcolor: "rgba(203, 213, 225, 0.2)",
      title: {
        text: "",
        font: { size: 14, color: "#475569" },
      },
      // Add nticks to reduce the number of grid lines on the x-axis
      nticks: 10, // Adjust this number to control density
    },
    yaxis: {
      gridcolor: "rgba(203, 213, 225, 0.2)",
      title: { font: { size: 14, color: "#475569" } },
      // Add nticks to reduce the number of grid lines on the y-axis
      nticks: 10, // Adjust this number to control density
    },
    legend: {
      orientation: "h",
      y: -0.3,
      yanchor: 'top',
      font: { size: 12 },
    },
    hovermode: "closest", // Peningkatan UX
  }

  // Konfigurasi chart
  const chartConfigs = [
    {
      title: "Suhu Lingkungan (°C)",
      data: temperatures,
      color: "#ef4444",
      Icon: ThermometerSun,
      unit: "Suhu (°C)",
    },
    {
      title: "Kelembapan Relatif (%)",
      data: humidity,
      color: "#3b82f6",
      Icon: Droplets,
      unit: "Kelembapan (%)",
    },
    {
      title: "Tekanan Udara (hPa)",
      data: pressure,
      color: "#f59e0b",
      Icon: Gauge,
      unit: "Tekanan (hPa)",
    },
    {
      title: "Titik Embun (°C)",
      data: dew,
      color: "#10b981",
      Icon: Sprout,
      unit: "Titik Embun (°C)",
    },
    {
      title: "Tegangan Baterai (V)",
      data: volt,
      color: "#6366f1",
      Icon: BatteryCharging,
      unit: "Tegangan (V)",
    },
  ];

  // Komponen Card untuk setiap grafik
  const ChartCard = ({
    title,
    data,
    color,
    Icon,
    unit,
    timestamps,
    commonLayout
  }: {
    title: string;
    data: number[];
    color: string;
    Icon: React.FC<any>;
    unit: string;
    timestamps: string[];
    commonLayout: any;
  }) => {
    const yDomain = getYAxisDomain(data);
    const chartData = [{
      x: timestamps,
      y: data,
      type: "scatter",
      mode: "lines+markers",
      marker: { color },
      name: title,
      line: { color, width: 3 },
    }];
    const layout = {
      ...commonLayout,
      // Hapus title dari layout agar hanya muncul di Card
      yaxis: { ...commonLayout.yaxis, title: { ...commonLayout.yaxis.title, text: unit }, range: yDomain },
    };
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 bg-gray-50 dark:bg-gray-800 border-b py-3 px-6">
          <Icon className={`h-5 w-5`} style={{ color }} />
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ChartComponent data={chartData} layout={layout} />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Analisis Data</h2>
          <p className="text-muted-foreground dark:text-gray-50">Analisis dan Prediksi Lanjutan Data</p>
        </div>
      </div>
      <Card className="mb-6">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800 border-b">
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <Select value={sensorId} onValueChange={setSensorId}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Pilih Sensor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id-01">Sensor 1</SelectItem>
                <SelectItem value="id-02">Sensor 2</SelectItem>
                <SelectItem value="id-03">Sensor 3</SelectItem>
                <SelectItem value="id-04">Sensor 4</SelectItem>
                <SelectItem value="id-05">Sensor 5</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dataPoints.toString()} onValueChange={(value) => setDataPoints(Number.parseInt(value))}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Interval Waktu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 menit terakhir</SelectItem>
                <SelectItem value="60">1 jam terakhir</SelectItem>
                <SelectItem value="120">2 jam terakhir</SelectItem>
                <SelectItem value="240">4 jam terakhir</SelectItem>
                <SelectItem value="720">12 jam terakhir</SelectItem>
                <SelectItem value="1440">24 jam terakhir</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh data</span>
            </Button>

            <Button variant="outline" size="sm" className="text-gray-600 dark:text-gray-300">
              <Download className="h-4 w-4 mr-1" /> Unduh Data
            </Button>
          </div>
        </CardHeader>
      </Card>
      
      {/* PERUBAHAN UTAMA: DARI TABS MENJADI STACKED LAYOUT */}
      {loading ? (
        // Tampilan loading terpusat
        <div className="flex justify-center items-center h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
          <p className="ml-4 text-gray-500">Memuat data...</p>
        </div>
      ) : error ? (
        // Tampilan error
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">{error}</div>
      ) : (
        // Layout bertumpuk untuk semua grafik
        <div className="space-y-6">
          {/* Render ChartCard untuk setiap chart */}
          {chartConfigs.map((config, idx) => (
            <ChartCard
              key={idx}
              {...config}
              timestamps={timestamps}
              commonLayout={commonLayout}
            />
          ))}
          {/* Scatter plot suhu vs kelembapan */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 bg-gray-50 dark:bg-gray-800 border-b py-3 px-6">
              <ScatterChart className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Korelasi Suhu dan Kelembapan</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ChartComponent
                data={[{
                  x: temperatures,
                  y: humidity,
                  mode: "markers",
                  type: "scatter",
                  name: "Suhu vs Kelembapan",
                  marker: { color: "#a855f7" }
                }]}
                layout={{
                  ...commonLayout,
                  title: { text: "Korelasi Suhu dan Kelembapan", font: { size: 16 } },
                  xaxis: { ...commonLayout.xaxis, title: { ...commonLayout.xaxis.title, text: "Suhu (°C)" } },
                  yaxis: { ...commonLayout.yaxis, title: { ...commonLayout.yaxis.title, text: "Kelembapan (%)" } },
                }}
              />
            </CardContent>
          </Card>
          {/* 3D scatter plot suhu vs kelembapan vs tekanan */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 bg-gray-50 dark:bg-gray-800 border-b py-3 px-6">
              <ScatterChart className="h-5 w-5 text-pink-500" />
              <CardTitle className="text-lg">Korelasi Suhu, Kelembapan, dan Tekanan</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ChartComponent
                data={[{
                  x: temperatures,
                  y: humidity,
                  z: pressure,
                  mode: "markers",
                  type: "scatter3d",
                  name: "Suhu, Kelembapan & Tekanan",
                  marker: { size: 5, color: pressure, colorscale: 'Viridis', opacity: 0.8 }
                }]}
                layout={{
                  ...commonLayout,
                  title: { text: "Korelasi Suhu, Kelembapan, dan Tekanan", font: { size: 16 } },
                  scene: {
                    xaxis: { title: "Suhu (°C)" },
                    yaxis: { title: "Kelembapan (%)" },
                    zaxis: { title: "Tekanan (hPa)" },
                  },
                  margin: { l: 0, r: 0, b: 0, t: 40 }
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}