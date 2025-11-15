"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { fetchAllDevices } from "@/lib/FetchingDevice";
import {
  fetchSensorData,
  fetchSensorDataByDateRange,
  SensorDate,
} from "@/lib/FetchingSensorData";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  RefreshCw,
  CalendarIcon,
  ThermometerSun,
  FlaskConical,
  Waves,
} from "lucide-react";

// Plotly.js chart component (dynamic import)
const ChartComponent = dynamic(() => import("@/components/ChartComponent"), {
  ssr: false,
});

// Define the structure for selectable periods
interface Period {
  label: string;
  valueInMinutes: number;
}

// Daftar periode yang bisa dipilih, ditambahkan interval lebih pendek
const periods: Period[] = [
  { label: "1 Menit", valueInMinutes: 1 },
  { label: "5 Menit", valueInMinutes: 5 },
  { label: "30 Menit", valueInMinutes: 30 },
  { label: "1 Jam", valueInMinutes: 60 },
  { label: "3 Jam", valueInMinutes: 3 * 60 },
  { label: "6 Jam", valueInMinutes: 6 * 60 },
  { label: "12 Jam", valueInMinutes: 12 * 60 },
  { label: "24 Jam", valueInMinutes: 24 * 60 },
];

export default function VisualisasiPage() {
  const { user } = useAuth();
  // State untuk data grafik (array terpisah)
  const [timestamps, setTimestamps] = useState<string[]>([]); // Akan menggunakan timeFormatted
  const [temperatures, setTemperatures] = useState<number[]>([]);
  const [phLevels, setPhLevels] = useState<number[]>([]);
  const [ammoniaLevels, setAmmoniaLevels] = useState<number[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk sensor dan jumlah data (Mengambil data dinamis dari Firestore)
  const [sensorOptions, setSensorOptions] = useState<{ label: string; value: string }[]>([]);
  const [sensorId, setSensorId] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(periods[2]); // Default 30 Menit
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // State untuk mode dark
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- LOGIKA FETCH DEVICE DINAMIS ---
  useEffect(() => {
    const loadDevices = async () => {
      if (user?.uid) {
        setLoading(true);
        try {
          const devices = await fetchAllDevices(user.uid);
          if (devices && devices.length > 0) {
            const options = devices.map((device) => ({
              label: device.name,
              value: device.authToken || device.id,
            }));
            setSensorOptions(options);
            if (!sensorId && options.length > 0) {
              setSensorId(options[0].value);
            }
          } else {
            setSensorOptions([]);
            setError("Tidak ada perangkat yang terdaftar. Silakan tambahkan perangkat terlebih dahulu.");
          }
        } catch (err) {
          console.error("Failed to fetch devices:", err);
          setError("Gagal memuat daftar perangkat.");
        }
      }
    };

    loadDevices();
  }, [user]);

  // Fungsi untuk memproses dan mengatur state data
  const processAndSetData = (data: SensorDate[]) => {
    if (data.length > 0) {
      const fetchedTimestamps: string[] = data.map(d => d.timeFormatted || new Date(d.timestamp).toLocaleString('id-ID', { timeZone: "Asia/Jakarta" }));
      const fetchedTemperatures: number[] = data.map(d => d.suhu);
      const fetchedPhLevels: number[] = data.map(d => d.ph_level);
      const fetchedAmmoniaLevels: number[] = data.map(d => d.amonia);

      setTimestamps(fetchedTimestamps);
      setTemperatures(fetchedTemperatures);
      setPhLevels(fetchedPhLevels);
      setAmmoniaLevels(fetchedAmmoniaLevels);
      setError(null);
    } else {
      setTimestamps([]);
      setTemperatures([]);
      setPhLevels([]);
      setAmmoniaLevels([]);
      setError("Tidak ada data yang tersedia untuk periode ini.");
    }
  };

  // Fetch data untuk pembaruan di background (polling)
  const updateData = useCallback(async () => {
    if (!user?.uid || !sensorId) return;
    try {
      const dataPoints = selectedPeriod.valueInMinutes;
      const data = await fetchSensorData(user.uid, sensorId, dataPoints);
      processAndSetData(data);
    } catch (err: any) {
      console.error("Gagal melakukan polling data:", err);
    }
  }, [user?.uid, sensorId, selectedPeriod]);

  // Fetch data untuk pemuatan awal atau refresh manual
  const fetchData = useCallback(async () => {
    if (!user?.uid || !sensorId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let data: SensorDate[];
      if (dateRange?.from && dateRange?.to) {
        const startTimestamp = dateRange.from.getTime();
        const endTimestamp = dateRange.to.getTime();
        data = await fetchSensorDataByDateRange(
          user.uid,
          sensorId,
          startTimestamp,
          endTimestamp
        );
      } else {
        const dataPoints = selectedPeriod.valueInMinutes;
        data = await fetchSensorData(user.uid, sensorId, dataPoints);
      }
      processAndSetData(data);
    } catch (err: any) {
      console.error("Error fetching data: ", err);
      setError("Gagal mengambil data: " + (err.message || "Terjadi kesalahan tidak diketahui."));
      setTimestamps([]);
      setTemperatures([]);
      setPhLevels([]);
      setAmmoniaLevels([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, sensorId, selectedPeriod, dateRange]);

  // Inisialisasi komponen dan refresh data
  useEffect(() => {
    if (sensorId) {
      fetchData();

      if (!dateRange) {
        let pollInterval: number;
        if (selectedPeriod.valueInMinutes <= 1) pollInterval = 5000;
        else if (selectedPeriod.valueInMinutes <= 5) pollInterval = 15000;
        else if (selectedPeriod.valueInMinutes <= 60) pollInterval = 60000;
        else return;

        const interval = setInterval(updateData, pollInterval);
        return () => clearInterval(interval);
      }
    }
  }, [sensorId, fetchData, updateData, selectedPeriod, dateRange]);

  // Deteksi mode dark
  useEffect(() => {
    const checkDarkMode = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Warna dinamis untuk dark/light mode
  const chartColors = {
    temperature: isDarkMode ? "#f87171" : "#ef4444",
    phlevel: isDarkMode ? "#60a5fa" : "#3b82f6",
    ammonia: isDarkMode ? "#a78bfa" : "#8b5cf6",
  };

  // Fungsi untuk mendapatkan domain sumbu Y
  function getYAxisDomain(data: number[]) {
    if (data.length === 0) return [-1, 1];
    let min = Math.min(...data);
    let max = Math.max(...data);
    if (min === max) {
        min -= 1;
        max += 1;
    } else {
        const padding = (max - min) * 0.1;
        min -= padding;
        max += padding;
    }
    return [min, max];
  }

  // Pengaturan tata letak umum untuk grafik
  const commonLayout = {
    autosize: true,
    margin: { l: 60, r: 40, t: 40, b: 60 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { family: "Roboto, sans-serif", color: "#64748b" },
    xaxis: { gridcolor: "rgba(203, 213, 225, 0.2)", nticks: 10 },
    yaxis: { gridcolor: "rgba(203, 213, 225, 0.2)", nticks: 10 },
    legend: { orientation: "h", y: -0.3, yanchor: 'top', font: { size: 12 } },
  };

  // Komponen Card untuk setiap grafik
  const ChartCard = ({ title, data, color, Icon}: { title: string; data: number[]; color: string; Icon: React.FC<any>; }) => {
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
      paper_bgcolor: isDarkMode ? "#1e293b" : "transparent",
      plot_bgcolor: isDarkMode ? "#1e293b" : "transparent",
      font: { color: isDarkMode ? "#cbd5e1" : "#64748b" },
      xaxis: { ...commonLayout.xaxis, gridcolor: isDarkMode ? "rgba(71, 85, 105, 0.2)" : "rgba(203, 213, 225, 0.2)" },
      yaxis: { ...commonLayout.yaxis, gridcolor: isDarkMode ? "rgba(71, 85, 105, 0.2)" : "rgba(203, 213, 225, 0.2)", range: yDomain },
    };

    return (
      <Card>
        <CardHeader className={`flex flex-row items-center gap-3 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"} border-b py-3 px-6`}>
          <Icon className={`h-5 w-5`} style={{ color }} />
          <CardTitle>{title}</CardTitle>
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
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Visualisasi Data</h2>
          <p className="text-muted-foreground dark:text-gray-50">Analisis data sensor secara visual</p>
        </div>
      </div>
      
      {/* Global Controls Card */}
      <Card className="mb-6">
        <CardHeader className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"} border-b`}>
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <Select value={sensorId} onValueChange={setSensorId}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Pilih Perangkat" />
              </SelectTrigger>
              <SelectContent>
                {sensorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>Pilih rentang tanggal</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""} ${isDarkMode ? "text-gray-200" : ""}`} />
              <span className="sr-only">Refresh data</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 bg-slate-100 dark:bg-slate-800">
          <div className="flex flex-wrap gap-2">
            {periods.map((period) => (
              <button
                key={period.label}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod?.label === period.label
                    ? isDarkMode ? "bg-primary-700 text-white" : "bg-primary-600 text-white"
                    : isDarkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart Content */}
      {loading ? (
        <div className="flex justify-center items-center h-[400px]">
          <RefreshCw className={`h-8 w-8 animate-spin ${isDarkMode ? "text-primary-400" : "text-primary-500"}`} />
          <p className={`ml-4 ${isDarkMode ? "text-gray-200" : "text-gray-500"}`}>Memuat data...</p>
        </div>
      ) : error ? (
        <div className={`border p-4 rounded-md mb-6 ${isDarkMode ? "bg-red-950 border-red-900 text-red-300" : "bg-red-50 border-red-200 text-red-700"}`}>{error}</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <ChartCard title="Suhu" data={temperatures} color={chartColors.temperature} Icon={ThermometerSun} />
          <ChartCard title="pH Level" data={phLevels} color={chartColors.phlevel} Icon={FlaskConical} />
          <ChartCard title="Amonia" data={ammoniaLevels} color={chartColors.ammonia} Icon={Waves} />
        </div>
      )}
    </div>
  )
}
