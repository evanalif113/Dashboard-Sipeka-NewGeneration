"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchFilteredLogs, deleteLogEvent, LogEvent, LogFilters } from "@/lib/FetchingLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw, AlertTriangle, Info, ShieldCheck, Settings, FileText } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Helper untuk mendapatkan warna dan ikon berdasarkan severity
const getSeverityProps = (severity: LogEvent["severity"]) => {
  switch (severity) {
    case "high":
      return { color: "bg-red-500 hover:bg-red-600", textColor: "text-red-600", Icon: AlertTriangle };
    case "medium":
      return { color: "bg-yellow-500 hover:bg-yellow-600", textColor: "text-yellow-600", Icon: AlertTriangle };
    case "low":
    default:
      return { color: "bg-blue-500 hover:bg-blue-600", textColor: "text-blue-600", Icon: Info };
  }
};

// Helper untuk mendapatkan ikon berdasarkan tipe log
const getTypeIcon = (type: LogEvent["type"]) => {
  switch (type) {
    case "configuration":
      return <Settings className="h-4 w-4 mr-2" />;
    case "threshold":
      return <ShieldCheck className="h-4 w-4 mr-2" />;
    case "alert":
      return <AlertTriangle className="h-4 w-4 mr-2" />;
    case "connection":
      return <Info className="h-4 w-4 mr-2" />;
    case "disconnection":
      return <Info className="h-4 w-4 mr-2" />;
    default:
      return <FileText className="h-4 w-4 mr-2" />;
  }
};

export default function LogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LogFilters>({});
  const [logToDelete, setLogToDelete] = useState<LogEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchData = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchedLogs = await fetchFilteredLogs(user.uid, filters);
      setLogs(fetchedLogs);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError("Gagal memuat log aktivitas. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === "" || value === undefined) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      return newFilters;
    });
  };

  const handleConfirmDelete = async () => {
    if (!logToDelete || !user?.uid) return;
    setDeleting(true);
    try {
      await deleteLogEvent(user.uid, logToDelete.id);
      setLogs(prevLogs => prevLogs.filter(log => log.id !== logToDelete.id));
      setLogToDelete(null);
    } catch (err) {
      console.error("Failed to delete log:", err);
      alert("Gagal menghapus log. Silakan coba lagi.");
    } finally {
      setDeleting(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const currentLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Log Aktivitas</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-xl">Filter Log</CardTitle>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={fetchData} disabled={loading} size="sm">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {/* Input Pencarian */}
            <Input
              placeholder="Cari pesan atau perangkat..."
              value={filters.searchTerm || ""}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full"
            />
            
            {/* Select Tipe */}
            <Select 
              value={filters.type || "all"} 
              onValueChange={(value) => handleFilterChange('type', value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="configuration">Konfigurasi</SelectItem>
                <SelectItem value="threshold">Ambang Batas</SelectItem>
                <SelectItem value="alert">Peringatan</SelectItem>
                <SelectItem value="connection">Koneksi</SelectItem>
              </SelectContent>
            </Select>

            {/* Select Severity */}
            <Select 
              value={filters.severity || "all"} 
              onValueChange={(value) => handleFilterChange('severity', value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Tingkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tingkat</SelectItem>
                <SelectItem value="high">Tinggi</SelectItem>
                <SelectItem value="medium">Sedang</SelectItem>
                <SelectItem value="low">Rendah</SelectItem>
              </SelectContent>
            </Select>

            {/* Select Date Range */}
            <Select 
              value={filters.dateRange || "all"} 
              onValueChange={(value) => handleFilterChange('dateRange', value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Waktu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Waktu</SelectItem>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="week">Minggu Ini</SelectItem>
                <SelectItem value="month">Bulan Ini</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-gray-600 dark:text-gray-400">Memuat log aktivitas...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-500 font-medium">{error}</p>
              <Button onClick={fetchData} className="mt-4" variant="outline">
                Coba Lagi
              </Button>
            </div>
          ) : currentLogs.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">Tidak ada log yang ditemukan.</p>
              {Object.keys(filters).length > 0 && (
                <Button 
                  onClick={() => setFilters({})} 
                  className="mt-4" 
                  variant="outline"
                  size="sm"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                      <TableHead className="font-semibold">Tingkat</TableHead>
                      <TableHead className="font-semibold">Tipe</TableHead>
                      <TableHead className="font-semibold">Perangkat</TableHead>
                      <TableHead className="font-semibold">Pesan</TableHead>
                      <TableHead className="font-semibold">Waktu</TableHead>
                      <TableHead className="text-right font-semibold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLogs.map((log) => {
                      const { color, Icon } = getSeverityProps(log.severity);
                      return (
                        <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <TableCell>
                            <Badge className={`${color} text-white flex items-center gap-1 w-fit`}>
                              <Icon className="h-3 w-3" />
                              <span className="capitalize">{log.severity}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center capitalize">
                              {getTypeIcon(log.type)}
                              <span>{log.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{log.device}</TableCell>
                          <TableCell className="max-w-md truncate" title={log.message}>
                            {log.message}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {format(log.timestamp, "dd MMM yyyy, HH:mm:ss", { locale: id })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setLogToDelete(log)}
                              className="hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, logs.length)} dari {logs.length} log
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      Sebelumnya
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                      <span className="text-sm font-medium">
                        Hal. {currentPage} / {totalPages}
                      </span>
                    </div>
                    <Button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Berikutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal Konfirmasi Hapus */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Hapus Log?
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-2">Apakah Anda yakin ingin menghapus log ini secara permanen?</p>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md mt-3 mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
                  Perangkat: {logToDelete.device}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">"{logToDelete.message}"</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {format(logToDelete.timestamp, "dd MMM yyyy, HH:mm:ss", { locale: id })}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setLogToDelete(null)}
                  disabled={deleting}
                >
                  Batal
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}