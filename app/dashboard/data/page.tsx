"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Trash2,
  Download,
  Plus,
  ThermometerSun,
  Droplets,
  Gauge,
  Pencil,
  Sprout,
  CloudRain,
  CloudRainWind,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { DateRange } from "react-day-picker";

import {
  fetchSensorData,
  deleteSensorData,
  editSensorDataByTimestamp,
  deleteSensorDataByTimestamp,
  fetchSensorDataByDateRange,
} from "@/lib/FetchingSensorData";
import type { SensorDate } from "@/lib/FetchingSensorData";
import ChartComponent from "@/components/ChartComponent";
import { Button } from "@/components/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Define the structure for selectable periods
interface Period {
  label: string;
  valueInMinutes: number;
}
// Define the structure for table data
interface WeatherData {
  timestamp: number;
  date: string; // Akan menggunakan dateFormatted dari SensorDate
  temperature: number;
  humidity: number;
  pressure: number;
  dew: number;
  rainfall: number;
  rainrate: number;
}

// Daftar periode yang bisa dipilih
const periods: Period[] = [
  { label: "30 Menit", valueInMinutes: 30 },
  { label: "1 Jam", valueInMinutes: 60 },
  { label: "3 Jam", valueInMinutes: 3 * 60 },
  { label: "6 Jam", valueInMinutes: 6 * 60 },
  { label: "12 Jam", valueInMinutes: 12 * 60 },
  { label: "24 Jam", valueInMinutes: 24 * 60 },
];

// Daftar Sensor
const sensorOptions = [
  { label: "Sensor 1", value: "id-01" },
  { label: "Sensor 2", value: "id-02" },
  { label: "Sensor 3", value: "id-03" },
  { label: "Sensor 4", value: "id-04" },
  { label: "Sensor 5", value: "id-05" },
  { label: "Sensor 6", value: "id-06" },
  { label: "Sensor 7", value: "id-07" }
];

export default function DataPage() {
  // State untuk data grafik (array terpisah)
  const [timestamps, setTimestamps] = useState<string[]>([]); // Akan menggunakan timeFormatted
  const [temperatures, setTemperatures] = useState<number[]>([]); //Float64
  const [humidity, setHumidity] = useState<number[]>([]); //Float64
  const [pressure, setPressure] = useState<number[]>([]); //Float64
  const [dew, setDew] = useState<number[]>([]); //Float64
  const [rainfall, setRainfall] = useState<number[]>([]); //Float64
  const [rainrate, setRainrate] = useState<number[]>([]); //Float64

  // State untuk data tabel
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State untuk tab
  const [activeTab, setActiveTab] = useState<'table' | 'grafik'> ('table');

  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // Jumlah item per halaman

  // State untuk sensor dan jumlah data
  const [sensorId, setSensorId] = useState("id-03");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(periods[1]); // Default 1 Jam
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // State untuk mode dark
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<WeatherData | null>(null);
  const [deleteRowIndex, setDeleteRowIndex] = useState<number | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<{
    datetime: string;
    temperature: number;
    humidity: number;
    pressure: number;
    dew: number;
    rainfall: number;
    rainrate: number;
  } | null>(null);

  // Fungsi untuk memproses dan mengatur state data
  const processAndSetData = (data: SensorDate[]) => {
    if (data.length > 0) {
      const fetchedTimestamps: string[] = data.map(d => d.timeFormatted || new Date(d.timestamp).toLocaleString('id-ID', { timeZone: "Asia/Jakarta" }));
      const fetchedTemperatures: number[] = data.map(d => d.temperature);
      const fetchedHumidity: number[] = data.map(d => d.humidity);
      const fetchedPressure: number[] = data.map(d => d.pressure);
      const fetchedDew: number[] = data.map(d => d.dew);
      const fetchedRainfall: number[] = data.map(d => d.rainfall);
      const fetchedRainrate: number[] = data.map(d => d.rainrate);

      setTimestamps(fetchedTimestamps);
      setTemperatures(fetchedTemperatures);
      setHumidity(fetchedHumidity);
      setPressure(fetchedPressure);
      setDew(fetchedDew);
      setRainfall(fetchedRainfall);
      setRainrate(fetchedRainrate);

      const dataArray: WeatherData[] = data.map((entry) => ({
        timestamp: entry.timestamp,
        date: entry.dateFormatted || new Date(entry.timestamp).toLocaleString('id-ID', { timeZone: "Asia/Jakarta" }),
        temperature: entry.temperature,
        humidity: entry.humidity,
        pressure: entry.pressure,
        dew: entry.dew,
        rainfall: entry.rainfall,
        rainrate: entry.rainrate,
      }));
      setWeatherData(dataArray.reverse());
      setError(null);
      setCurrentPage(1); // Reset ke halaman pertama saat data baru dimuat
    } else {
      setTimestamps([]);
      setTemperatures([]);
      setHumidity([]);
      setPressure([]);
      setDew([]);
      setWeatherData([]);
      setError("Tidak ada data yang tersedia untuk periode ini.");
    }
  };

  // Fetch data untuk pembaruan di background (polling)
  const updateData = useCallback(async () => {
    try {
      const dataPoints = selectedPeriod.valueInMinutes;
      const data = await fetchSensorData(sensorId, dataPoints);
      processAndSetData(data);
    } catch (err: any) {
      console.error("Gagal melakukan polling data:", err);
      // Optionally set an error state that doesn't disrupt the UI too much
    }
  }, [sensorId, selectedPeriod]);

  // Fetch data untuk pemuatan awal atau refresh manual
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: SensorDate[];
      if (dateRange?.from && dateRange?.to) {
        // Fetch by date range if selected
        const startTimestamp = dateRange.from.getTime();
        const endTimestamp = dateRange.to.getTime();
        data = await fetchSensorDataByDateRange(
          sensorId,
          startTimestamp,
          endTimestamp
        );
      } else {
        // Fallback to fetch by period
        const dataPoints = selectedPeriod.valueInMinutes;
        data = await fetchSensorData(sensorId, dataPoints);
      }
      processAndSetData(data);
    } catch (err: any) {
      console.error("Error fetching data: ", err);
      setError(
        "Gagal mengambil data: " +
          (err.message || "Terjadi kesalahan tidak diketahui.")
      );
      setWeatherData([]);
      setTimestamps([]);
      setTemperatures([]);
      setHumidity([]);
      setPressure([]);
      setDew([]);
      setRainfall([]);
      setRainrate([]);
    } finally {
      setLoading(false);
    }
  }, [sensorId, selectedPeriod, dateRange]);

  // Inisialisasi komponen dan refresh data
  useEffect(() => {
    fetchData(); // Panggil untuk pemuatan awal

    // Atur interval untuk polling, hanya jika periode tertentu dipilih
    if (selectedPeriod.valueInMinutes <= 60 && !dateRange) {
      // Contoh: polling untuk periode 1 jam atau kurang, dan tidak ada date range aktif
      const interval = setInterval(updateData, 60000); // Panggil updateData untuk polling
      return () => clearInterval(interval);
    }
  }, [fetchData, updateData, selectedPeriod.valueInMinutes, dateRange]);

  // Deteksi mode dark dari Tailwind (class 'dark' pada html)
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    window.addEventListener('resize', checkDarkMode);
    // Juga listen ke perubahan class 'dark'
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      window.removeEventListener('resize', checkDarkMode);
      observer.disconnect();
    };
  }, []);

  // Warna dinamis untuk dark/light mode
  const chartColors = {
    temperature: isDarkMode ? "#f87171" : "#ef4444",
    humidity: isDarkMode ? "#60a5fa" : "#3b82f6",
    pressure: isDarkMode ? "#fbbf24" : "#f59e0b",
    dew: isDarkMode ? "#34d399" : "#10b981",
    rainfall: isDarkMode ? "#22d3ee" : "#06b6d4",
    rainrate: isDarkMode ? "#c4b5fd" : "#a78bfa",
  };

  // Fungsi untuk menghapus data sensor
  const handleDeleteSensorData = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua riwayat data untuk sensor ini? Tindakan ini tidak dapat diurungkan.")) {
      setIsDeleting(true);
      setError(null);
      try {
        await deleteSensorData(sensorId);
        // Kosongkan state di UI setelah berhasil
        setWeatherData([]);
        setTimestamps([]);
        setTemperatures([]);
        setHumidity([]);
        setPressure([]);
        setDew([]);
        setRainfall([]);
        setRainrate([]);
        setCurrentPage(1); // Reset halaman setelah data dihapus
      } catch (err: any) {
        console.error(err);
        setError("Gagal menghapus data sensor: " + err.message);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Fungsi untuk membuka modal edit
  const openEditModal = (row: WeatherData, index: number) => {
    setEditingIndex(index);
    setEditForm({ ...row });
    setEditModalOpen(true);
  };

// add: fungsi untuk membuka modal tambah data
  const openAddModal = () => {
    const now = new Date();
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setAddForm({
      datetime: localISO,
      temperature: 0,
      humidity: 0,
      pressure: 0,
      dew: 0,
      rainfall: 0,
      rainrate: 0,
    });
    setAddModalOpen(true);
  };

  // Fungsi untuk menyimpan perubahan edit
  const handleEditSave = async () => {
    if (!editForm || editingIndex === null) return;
    try {
      await editSensorDataByTimestamp(sensorId, editForm.timestamp, {
        temperature: editForm.temperature,
        humidity: editForm.humidity,
        pressure: editForm.pressure,
        dew: editForm.dew,
        rainfall: editForm.rainfall,
        rainrate: editForm.rainrate,
      });
      const updatedData = [...weatherData];
      updatedData[editingIndex] = { ...editForm };
      setWeatherData(updatedData);
      setEditModalOpen(false);
      setEditingIndex(null);
      setEditForm(null);
    } catch (err: any) {
      alert("Gagal mengedit data: " + (err.message || "Terjadi kesalahan."));
    }
  };

// add: simpan data baru
  const handleAddSave = async () => {
    if (!addForm) return;
    const ts = new Date(addForm.datetime).getTime();
    if (Number.isNaN(ts)) {
      alert("Tanggal/Waktu tidak valid.");
      return;
    }
    try {
      await editSensorDataByTimestamp(sensorId, ts, {
        temperature: Number(addForm.temperature),
        humidity: Number(addForm.humidity),
        pressure: Number(addForm.pressure),
        dew: Number(addForm.dew),
        rainfall: Number(addForm.rainfall),
        rainrate: Number(addForm.rainrate),
      });
      setAddModalOpen(false);
      setAddForm(null);
      await fetchData();
    } catch (err: any) {
      alert("Gagal menambahkan data: " + (err.message || "Terjadi kesalahan."));
    }
  };

  // Fungsi untuk membuka modal konfirmasi hapus
  const openDeleteModal = (index: number) => {
    setDeleteRowIndex(index);
    setDeleteModalOpen(true);
  };

  // Fungsi untuk menghapus data sensor pada baris tertentu
  const handleDeleteRowConfirmed = async () => {
    if (deleteRowIndex === null) return;
    const row = weatherData[deleteRowIndex];
    try {
      await deleteSensorDataByTimestamp(sensorId, row.timestamp);
      const updatedData = [...weatherData];
      updatedData.splice(deleteRowIndex, 1);
      setWeatherData(updatedData);
      setDeleteModalOpen(false);
      setDeleteRowIndex(null);
    } catch (err: any) {
      alert("Gagal menghapus data: " + (err.message || "Terjadi kesalahan."));
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(weatherData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTableData = weatherData.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Fungsi untuk mengunduh data (contoh sederhana)
  const handleDownloadData = () => {
    if (weatherData.length === 0) {
      alert("Tidak ada data untuk diunduh.");
      return;
    }
    const headers = ["Waktu", "Suhu (°C)", "Kelembapan (%)", "Tekanan (hPa)", "Titik Embun (°C)", "Curah Hujan (mm)", "Laju Hujan (mm/jam)"];
    const rows = weatherData.map(entry =>
      `${entry.date},${fmt2(entry.temperature)},${fmt2(entry.humidity)},${fmt2(entry.pressure)},${fmt2(entry.dew)},${fmt2(entry.rainfall)},${fmt2(entry.rainrate)}`
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `data_sensor_${sensorId}_${new Date().toISOString()}.csv`);
    link.click();
    URL.revokeObjectURL(url); // Membersihkan URL objek setelah diunduh
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
    font: {
      family: "Roboto, sans-serif",
      color: "#64748b",
    },
    xaxis: {
      gridcolor: "rgba(203, 213, 225, 0.2)",
      title: {
        font: { size: 14, color: "#475569" },
      },
      nticks: 10,
    },
    yaxis: {
      gridcolor: "rgba(203, 213, 225, 0.2)",
      title: { font: { size: 14, color: "#475569" } },
      nticks: 10,
    },
    legend: {
      orientation: "h",
      y: -0.3,
      yanchor: 'top',
      font: { size: 12 },
    },
    hovermode: "",
  };

  // Komponen Card untuk setiap grafik
  const ChartCard = ({ title, data, color, Icon}: 
    { title: string; data: number[]; color: string; Icon: React.FC<any>; }) => {
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
      //title: { text: title, font: { size: 14 } },
      paper_bgcolor: isDarkMode ? "#1e293b" : "transparent",
      plot_bgcolor: isDarkMode ? "#1e293b" : "transparent",
      font: {
        family: "Roboto, sans-serif",
        color: isDarkMode ? "#cbd5e1" : "#64748b",
      },
      xaxis: {
        ...commonLayout.xaxis,
        gridcolor: isDarkMode ? "rgba(71, 85, 105, 0.2)" : "rgba(203, 213, 225, 0.2)",
        title: {
          font: { size: 14, color: isDarkMode ? "#cbd5e1" : "#475569" },
        },
      },
      yaxis: {
        ...commonLayout.yaxis,
        title: { ...commonLayout.yaxis.title, font: { size: 14, color: isDarkMode ? "#cbd5e1" : "#475569" } },
        gridcolor: isDarkMode ? "rgba(71, 85, 105, 0.2)" : "rgba(203, 213, 225, 0.2)",
        range: yDomain,
      },
    };

    return (
      <Card>
        <CardHeader className={`flex flex-row items-center gap-3 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"} border-b py-3 px-6`}>
          <Icon className={`h-5 w-5`} style={{ color }} />
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ChartComponent data={chartData} layout={layout} />
        </CardContent>
      </Card>
    );
  };

  // helper format 2 desimal
  const fmt2 = (n: number) => Number.isFinite(n) ? n.toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Data Editor</h2>
          <p className="text-muted-foreground dark:text-gray-50">Pengelolaan data sensor</p>
        </div>
      </div>
      
      {/* Global Controls Card */}
      <Card className="mb-6">
        <CardHeader className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"} border-b`}>
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            {/* Sensor Select */}
            <Select value={sensorId} onValueChange={setSensorId}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Pilih Sensor" />
              </SelectTrigger>
              <SelectContent>
                {sensorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[260px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pilih rentang tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData} disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""} ${isDarkMode ? "text-gray-200" : ""}`} />
              <span className="sr-only">Refresh data</span>
            </Button>

            {/* Download Button */}
            <Button variant="outline" size="sm" className={`${isDarkMode ? "text-gray-200" : "text-gray-600 dark:text-gray-300"}`} onClick={handleDownloadData}>
              <Download className="h-4 w-4 mr-1" /> Unduh Data
            </Button>

            {/* Tambah Data Button */}
            <Button variant="outline" size="sm" className={`${isDarkMode ? "text-gray-200" : "text-gray-600 dark:text-gray-300"}`} onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-1" /> Tambah Data
            </Button>

            {/* Delete Button */}
            <Button variant="destructive" size="sm" onClick={handleDeleteSensorData} disabled={isDeleting || loading}>
              <Trash2 className={`h-4 w-4 mr-1 ${isDarkMode ? "text-gray-200" : ""}`} /> {isDeleting ? "Menghapus..." : "Hapus Data"}
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
                    ? isDarkMode
                      ? "bg-primary-700 text-white"
                      : "bg-primary-600 text-white"
                    : isDarkMode
                      ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'table'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('table')}
        >
          Data Tabel
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'grafik'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('grafik')}
        >
          Grafik
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center items-center h-[400px]">
          <RefreshCw className={`h-8 w-8 animate-spin ${isDarkMode ? "text-primary-400" : "text-primary-500"}`} />
          <p className={`ml-4 ${isDarkMode ? "text-gray-200" : "text-gray-500"}`}>Memuat data...</p>
        </div>
      ) : error ? (
        <div className={`border p-4 rounded-md mb-6 ${isDarkMode ? "bg-red-950 border-red-900 text-red-300" : "bg-red-50 border-red-200 text-red-700"}`}>{error}</div>
      ) : (
        <>
          {/* Data Table Content */}
          {activeTab === 'table' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={isDarkMode ? "bg-gray-800 text-left" : "bg-gray-50 dark:bg-gray-800 text-left"}>
                        <th className={`p-4 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-600 dark:text-gray-300"} border-b`}>Waktu</th>
                        <th className={`p-4 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-600 dark:text-gray-300"} border-b`}>Suhu (°C)</th>
                        <th className={`p-4 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-600 dark:text-gray-300"} border-b`}>Kelembapan (%)</th>
                        <th className={`p-4 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-600 dark:text-gray-300"} border-b`}>Tekanan (hPa)</th>
                        <th className={`p-4 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-600 dark:text-gray-300"} border-b`}>Titik Embun (°C)</th>
                        <th className={`p-4 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-600 dark:text-gray-300"} border-b`}>Curah Hujan (mm)</th>
                        <th className={`p-4 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-600 dark:text-gray-300"} border-b`}>Laju Hujan (mm/jam)</th>
                        <th className={`p-4 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-600 dark:text-gray-300"} border-b`}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody id="datalogger">
                      {currentTableData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className={`p-8 text-center ${isDarkMode ? "text-gray-200" : "text-gray-600 dark:text-gray-300"}`}>
                            Tidak ada data yang tersedia.
                          </td>
                        </tr>
                      ) : (
                        currentTableData.map((entry, index) => (
                          <tr
                            key={index}
                            className={isDarkMode
                              ? (index % 2 === 0 ? "bg-gray-900" : "bg-gray-800")
                              : (index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800")}
                          >
                            <td className={`p-4 border-t ${isDarkMode ? "text-gray-200" : ""}`}>{entry.date}</td>
                            <td className={`p-4 border-t ${isDarkMode ? "text-gray-200" : ""}`}>{fmt2(entry.temperature)}</td>
                            <td className={`p-4 border-t ${isDarkMode ? "text-gray-200" : ""}`}>{fmt2(entry.humidity)}</td>
                            <td className={`p-4 border-t ${isDarkMode ? "text-gray-200" : ""}`}>{fmt2(entry.pressure)}</td>
                            <td className={`p-4 border-t ${isDarkMode ? "text-gray-200" : ""}`}>{fmt2(entry.dew)}</td>
                            <td className={`p-4 border-t ${isDarkMode ? "text-gray-200" : ""}`}>{fmt2(entry.rainfall)}</td>
                            <td className={`p-4 border-t ${isDarkMode ? "text-gray-200" : ""}`}>{fmt2(entry.rainrate)}</td>
                            <td className={`p-4 border-t flex gap-2`}>
                              <button
                                className={`p-2 rounded hover:bg-primary-100 dark:hover:bg-primary-900`}
                                title="Edit"
                                onClick={() => openEditModal(entry, indexOfFirstItem + index)}
                              >
                                <Pencil className={`h-4 w-4 ${isDarkMode ? "text-primary-300" : "text-primary-600"}`} />
                              </button>
                              <button
                                className={`p-2 rounded hover:bg-red-100 dark:hover:bg-red-900`}
                                title="Hapus"
                                onClick={() => openDeleteModal(indexOfFirstItem + index)}
                              >
                                <Trash2 className={`h-4 w-4 ${isDarkMode ? "text-red-300" : "text-red-600"}`} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {weatherData.length > itemsPerPage && (
                  <div className="flex items-center justify-between p-4 border-t bg-slate-200 dark:bg-slate-700">
                    <Button onClick={handlePreviousPage} disabled={currentPage === 1} variant="outline">
                      Sebelumnya
                    </Button>
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      Halaman {currentPage} dari {totalPages}
                    </span>
                    <Button onClick={handleNextPage} disabled={currentPage === totalPages} variant="outline">
                      Berikutnya
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Grafik Content */}
          {activeTab === 'grafik' && (
            <div className="space-y-6">
              <ChartCard title="Suhu Lingkungan (°C)" data={temperatures} color={chartColors.temperature} Icon={ThermometerSun}  />
              <ChartCard title="Kelembapan Relatif (%)" data={humidity} color={chartColors.humidity} Icon={Droplets} />
              <ChartCard title="Tekanan Udara (hPa)" data={pressure} color={chartColors.pressure} Icon={Gauge} />
              <ChartCard title="Titik Embun (°C)" data={dew} color={chartColors.dew} Icon={Sprout}/>
              <ChartCard title="Curah Hujan (mm)" data={rainfall} color={chartColors.rainfall} Icon={CloudRain} />
              <ChartCard title="Laju Hujan (mm/jam)" data={rainrate} color={chartColors.rainrate} Icon={CloudRainWind} />
            </div>
          )}
        </>
      )}

      {/* Modal Edit Data */}
      {editModalOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-40">
          <Card className="w-full max-w-md mx-auto  bg-white dark:bg-gray-700">
            <CardHeader>
              <CardTitle>Edit Data Sensor</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleEditSave();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm mb-1">Suhu (°C)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.temperature}
                    onChange={e => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Kelembapan (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.humidity}
                    onChange={e => setEditForm({ ...editForm, humidity: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Tekanan (hPa)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.pressure}
                    onChange={e => setEditForm({ ...editForm, pressure: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Titik Embun (°C)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.dew}
                    onChange={e => setEditForm({ ...editForm, dew: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Curah Hujan (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.rainfall}
                    onChange={e => setEditForm({ ...editForm, rainfall: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Laju Hujan (mm/jam)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.rainrate}
                    onChange={e => setEditForm({ ...editForm, rainrate: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setEditModalOpen(false); setEditingIndex(null); setEditForm(null); }}>
                    Batal
                  </Button>
                  <Button type="submit" variant="default">
                    Simpan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Tambah Data */}
      {addModalOpen && addForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <Card className={`w-full max-w-md mx-auto ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
            <CardHeader>
              <CardTitle>Tambah Data Sensor</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleAddSave();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm mb-1">Tanggal & Waktu</label>
                  <input
                    type="datetime-local"
                    value={addForm.datetime}
                    onChange={e => setAddForm({ ...(addForm as any), datetime: e.target.value })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Suhu (°C)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.temperature}
                    onChange={e => setAddForm({ ...(addForm as any), temperature: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Kelembapan (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.humidity}
                    onChange={e => setAddForm({ ...(addForm as any), humidity: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Tekanan (hPa)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.pressure}
                    onChange={e => setAddForm({ ...(addForm as any), pressure: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Titik Embun (°C)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.dew}
                    onChange={e => setAddForm({ ...(addForm as any), dew: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Curah Hujan (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.rainfall}
                    onChange={e => setAddForm({ ...(addForm as any), rainfall: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Laju Hujan (mm/jam)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.rainrate}
                    onChange={e => setAddForm({ ...(addForm as any), rainrate: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setAddModalOpen(false); setAddForm(null); }}>
                    Batal
                  </Button>
                  <Button type="submit" variant="default">
                    Simpan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteModalOpen && deleteRowIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <Card className={`w-full max-w-sm mx-auto ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
            <CardHeader>
              <CardTitle>Konfirmasi Hapus Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat diurungkan.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {setDeleteModalOpen(false); setDeleteRowIndex(null); }}>
                  Tidak
                </Button>
                <Button variant="destructive" onClick={handleDeleteRowConfirmed}>
                  Ya, Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
