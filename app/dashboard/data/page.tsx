"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  RefreshCw,
  Download,
  Trash2,
  CalendarIcon,
  ThermometerSun,
  Waves,
  Wind,
  Plus,
  Edit,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  fetchSensorData,
  fetchSensorDataByDateRange,
  deleteSensorData,
  editSensorDataByTimestamp,
  deleteSensorDataByTimestamp,
  addSensorData, // Import fungsi baru
  SensorDate,
  SensorValue,
} from "@/lib/FetchingSensorData";
import { useAuth } from "@/hooks/useAuth";
import { fetchAllDevices } from "@/lib/FetchingDevice";

// Plotly.js chart component (dynamic import)
const ChartComponent = dynamic(() => import("@/components/ChartComponent"), {
  ssr: false,
});

// Define the structure for selectable periods
interface Period {
  label: string;
  valueInMinutes: number;
}
// Define the structure for table data
interface WaterData {
  id: string; // Kunci dari RTDB (timestamp)
  timestamp: number;
  date: string;
  suhu: number;
  ph_level: number;
  amonia: number;
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

export default function DataPage() {
  const { user } = useAuth();
  // State untuk data grafik (array terpisah)
  const [timestamps, setTimestamps] = useState<string[]>([]); // Akan menggunakan timeFormatted
  const [temperatures, setTemperatures] = useState<number[]>([]);
  const [phLevels, setPhLevels] = useState<number[]>([]);
  const [ammoniaLevels, setAmmoniaLevels] = useState<number[]>([]);

  // State untuk data tabel
  const [waterData, setWaterData] = useState<WaterData[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State untuk tab
  const [activeTab, setActiveTab] = useState<'table' | 'grafik' | 'log'> ('table');

  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // Jumlah item per halaman

  // State untuk sensor dan jumlah data (Mengambil data dinamis dari Firestore)
  const [sensorOptions, setSensorOptions] = useState<{ label: string; value: string }[]>([]);
  const [sensorId, setSensorId] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(periods[1]); // Default 5 Menit
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // State untuk mode dark
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<WaterData | null>(null);
  const [deleteRowIndex, setDeleteRowIndex] = useState<number | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<{
    datetime: string;
    suhu: number;
    ph_level: number;
    amonia: number;
  } | null>(null);

  
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
        } finally {
          // Loading di-set ke false di dalam fetchData()
        }
      }
    };

    loadDevices();
  }, [user]); // Hanya bergantung pada user untuk memuat daftar perangkat
  

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

      const dataArray: WaterData[] = data.map((entry) => ({
        id: entry.id, // Simpan kunci RTDB
        timestamp: entry.timestamp,
        date: entry.dateFormatted || new Date(entry.timestamp).toLocaleString('id-ID', { timeZone: "Asia/Jakarta" }),
        suhu: entry.suhu,
        ph_level: entry.ph_level,
        amonia: entry.amonia,
      }));
      setWaterData(dataArray.reverse());
      setError(null);
      setCurrentPage(1); // Reset ke halaman pertama saat data baru dimuat
    } else {
      setTimestamps([]);
      setTemperatures([]);
      setPhLevels([]);
      setAmmoniaLevels([]);
      setWaterData([]);
      setError("Tidak ada data yang tersedia untuk periode ini.");
    }
  };

  // Fetch data untuk pembaruan di background (polling)
  const updateData = useCallback(async () => {
    if (!user?.uid || !sensorId) return; // Jangan fetch jika tidak ada sensorId atau user
    try {
      const dataPoints = selectedPeriod.valueInMinutes;
      const data = await fetchSensorData(user.uid, sensorId, dataPoints);
      processAndSetData(data);
    } catch (err: any) {
      console.error("Gagal melakukan polling data:", err);
      // Optionally set an error state that doesn't disrupt the UI too much
    }
  }, [user?.uid, sensorId, selectedPeriod]);

  // Fetch data untuk pemuatan awal atau refresh manual
  const fetchData = useCallback(async () => {
    if (!user?.uid || !sensorId) {
      setLoading(false);
      return; // Jangan fetch jika tidak ada sensorId atau user
    }
    setLoading(true);
    setError(null);
    try {
      let data: SensorDate[];
      if (dateRange?.from && dateRange?.to) {
        // Fetch by date range if selected
        const startTimestamp = dateRange.from.getTime();
        const endTimestamp = dateRange.to.getTime();
        data = await fetchSensorDataByDateRange(
          user.uid,
          sensorId,
          startTimestamp,
          endTimestamp
        );
      } else {
        // Fallback to fetch by period
        const dataPoints = selectedPeriod.valueInMinutes;
        data = await fetchSensorData(user.uid, sensorId, dataPoints);
      }
      processAndSetData(data);
    } catch (err: any) {
      console.error("Error fetching data: ", err);
      setError(
        "Gagal mengambil data: " +
          (err.message || "Terjadi kesalahan tidak diketahui.")
      );
      setWaterData([]);
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
      fetchData(); // Panggil untuk pemuatan awal

      // Atur interval polling dinamis berdasarkan periode yang dipilih
      if (!dateRange) {
        let pollInterval: number;
        if (selectedPeriod.valueInMinutes <= 1) {
          pollInterval = 5000; // 5 detik untuk periode 1 menit
        } else if (selectedPeriod.valueInMinutes <= 5) {
          pollInterval = 15000; // 15 detik untuk periode 5 menit
        } else if (selectedPeriod.valueInMinutes <= 60) {
          pollInterval = 60000; // 1 menit untuk periode hingga 1 jam
        } else {
          return; // Jangan polling untuk periode yang lebih lama
        }

        const interval = setInterval(updateData, pollInterval);
        return () => clearInterval(interval);
      }
    }
  }, [sensorId, fetchData, updateData, selectedPeriod, dateRange]);

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
    phlevel: isDarkMode ? "#60a5fa" : "#3b82f6",
    ammonia: isDarkMode ? "#a78bfa" : "#8b5cf6",
  };

  // Fungsi untuk menghapus data sensor
  const handleDeleteSensorData = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua riwayat data untuk sensor ini? Tindakan ini tidak dapat diurungkan.")) {
      if (!user?.uid) return;
      setIsDeleting(true);
      setError(null);
      try {
        await deleteSensorData(user.uid, sensorId);
        // Kosongkan state di UI setelah berhasil
        setWaterData([]);
        setTimestamps([]);
        setTemperatures([]);
        setPhLevels([]);
        setAmmoniaLevels([]);
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
  const openEditModal = (row: WaterData, index: number) => {
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
      suhu: 0,
      ph_level: 0,
      amonia: 0,
    });
    setAddModalOpen(true);
  };

  // Fungsi untuk menyimpan perubahan edit
  const handleEditSave = async () => {
    if (!editForm || editingIndex === null || !user?.uid) return;
    try {
      // Gunakan editSensorDataByTimestamp dengan kunci RTDB (editForm.id)
      await editSensorDataByTimestamp(user.uid, sensorId, editForm.id, {
        suhu: editForm.suhu,
        ph_level: editForm.ph_level,
        amonia: editForm.amonia,
      });
      const updatedData = [...waterData];
      const targetIndex = waterData.findIndex(item => item.id === editForm.id);
      if (targetIndex !== -1) {
        // Perbarui baris yang sesuai di state lokal
        updatedData[targetIndex] = { ...editForm };
        setWaterData(updatedData);
      }
      setEditModalOpen(false);
      setEditingIndex(null);
      setEditForm(null);
    } catch (err: any) {
      alert("Gagal mengedit data: " + (err.message || "Terjadi kesalahan."));
    }
  };

// add: simpan data baru
  const handleAddSave = async () => {
    if (!addForm || !user?.uid || !sensorId) return;
    const ts = new Date(addForm.datetime).getTime();
    if (Number.isNaN(ts)) {
      alert("Tanggal/Waktu tidak valid.");
      return;
    }
    try {
      const newData: SensorValue = {
        timestamp: ts,
        suhu: addForm.suhu,
        ph_level: addForm.ph_level,
        amonia: addForm.amonia,
      };

      // Panggil fungsi addSensorData yang sudah dibuat
      await addSensorData(user.uid, sensorId, newData);

      setAddModalOpen(false);
      setAddForm(null);
      await fetchData(); // Muat ulang data untuk menampilkan data baru
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
    if (deleteRowIndex === null || !user?.uid) return;
    // Dapatkan baris yang akan dihapus dari data yang sudah di-paginate dan diurutkan
    const rowToDelete = currentTableData[deleteRowIndex];
    if (!rowToDelete) return;

    try {
      // Gunakan deleteSensorDataByTimestamp dengan kunci RTDB (rowToDelete.id)
      await deleteSensorDataByTimestamp(user.uid, sensorId, rowToDelete.id);
      // Hapus dari state utama (weatherData) berdasarkan ID
      const updatedData = waterData.filter((item) => item.id !== rowToDelete.id);
      setWaterData(updatedData);
      setDeleteModalOpen(false);
      setDeleteRowIndex(null);
    } catch (err: any) {
      alert("Gagal menghapus data: " + (err.message || "Terjadi kesalahan."));
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(waterData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTableData = waterData.slice(indexOfFirstItem, indexOfLastItem);

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
    if (waterData.length === 0) {
      alert("Tidak ada data untuk diunduh.");
      return;
    }
    const headers = ["Waktu", "Suhu (°C)", "pH Level", "Amonia (ppm)"];
    const rows = waterData.map(entry =>
      `${entry.date},
      ${fmt2(entry.suhu)},
      ${fmt2(entry.ph_level)},
      ${fmt2(entry.amonia)}`
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
          <CardTitle>{title}</CardTitle>
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
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'log'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('log')}
        >
          Log
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
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Waktu</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Suhu (°C)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">pH Level</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amonia (ppm)</th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Edit</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {currentTableData.map((row, index) => (
                        <tr key={row.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{row.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{fmt2(row.suhu)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{fmt2(row.ph_level)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{fmt2(row.amonia)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => openEditModal(row, index)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => openDeleteModal(index)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grafik Content */}
          {activeTab === 'grafik' && (
            <div className="grid grid-cols-1 gap-6">
              <ChartCard title="Suhu" data={temperatures} color={chartColors.temperature} Icon={ThermometerSun} />
              <ChartCard title="pH Level" data={phLevels} color={chartColors.phlevel} Icon={Waves} />
              <ChartCard title="Amonia" data={ammoniaLevels} color={chartColors.ammonia} Icon={Wind} />
            </div>
          )}

          {/* Raw Data Log Content */}
          {activeTab === 'log' && (
            <Card>
              <CardHeader>
                <CardTitle>Raw Data Log</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(waterData, null, 2)}
                </pre>
              </CardContent>
            </Card>
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
                    value={editForm.suhu}
                    onChange={e => setEditForm({ ...editForm, suhu: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">pH Level</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.ph_level}
                    onChange={e => setEditForm({ ...editForm, ph_level: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Amonia (ppm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.amonia}
                    onChange={e => setEditForm({ ...editForm, amonia: parseFloat(e.target.value) || 0 })}
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
                    value={addForm.suhu}
                    onChange={e => setAddForm({ ...(addForm as any), suhu: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">pH Level</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.ph_level}
                    onChange={e => setAddForm({ ...(addForm as any), ph_level: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Amonia (ppm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.amonia}
                    onChange={e => setAddForm({ ...(addForm as any), amonia: parseFloat(e.target.value) || 0 })}
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
