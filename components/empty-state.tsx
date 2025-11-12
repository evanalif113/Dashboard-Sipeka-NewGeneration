"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon, UnplugIcon, BarChart3Icon, FileTextIcon } from "lucide-react"
import { useRouter } from "next/navigation"

interface EmptyStateProps {
  type: "dashboard" | "devices" | "charts" | "logs"
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ type, title, description, actionLabel, onAction }: EmptyStateProps) {
  const router = useRouter()

  const getIcon = () => {
    switch (type) {
      case "dashboard":
        return <UnplugIcon className="h-16 w-16 text-gray-400" />
      case "devices":
        return <UnplugIcon className="h-16 w-16 text-gray-400" />
      case "charts":
        return <BarChart3Icon className="h-16 w-16 text-gray-400" />
      case "logs":
        return <FileTextIcon className="h-16 w-16 text-gray-400" />
      default:
        return <UnplugIcon className="h-16 w-16 text-gray-400" />
    }
  }

  const getDefaultContent = () => {
    switch (type) {
      case "dashboard":
        return {
          title: "Belum Ada Perangkat Terdaftar",
          description: "Anda belum menambahkan perangkat monitoring. Mulai dengan menambahkan perangkat pertama Anda untuk memantau kondisi cuaca dan hidrologi.",
          actionLabel: "Tambah Perangkat Pertama",
        }
      case "devices":
        return {
          title: "Belum Ada Perangkat",
          description: "Anda belum menambahkan perangkat monitoring. Klik tombol di bawah untuk menambahkan perangkat pertama Anda.",
          actionLabel: "Tambah Perangkat Pertama",
        }
      case "charts":
        return {
          title: "Tidak Ada Data",
          description: "Tidak ada data grafik tersedia. Tambahkan perangkat untuk mulai melihat visualisasi data.",
          actionLabel: "Tambah Perangkat untuk Grafik",
        }
      case "logs":
        return {
          title: "Belum Ada Log",
          description: "Belum ada aktivitas sistem yang tercatat. Log akan muncul setelah Anda menambahkan dan menggunakan perangkat.",
          actionLabel: "Tambah Perangkat untuk Log",
        }
      default:
        return {
          title: "Tidak Ada Data",
          description: "Tidak ada data tersedia",
          actionLabel: "Tambah Perangkat",
        }
    }
  }

  const defaultContent = getDefaultContent()
  const finalTitle = title || defaultContent.title
  const finalDescription = description || defaultContent.description
  const finalActionLabel = actionLabel || defaultContent.actionLabel

  const handleAction = () => {
    if (onAction) {
      onAction()
    } else {
      router.push("/dashboard/devices")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md mx-auto text-center shadow-lg border-2 border-line border-gray-400">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">{getIcon()}</div>
          <CardTitle className="text-xl font-semibold text-gray-700">{finalTitle}</CardTitle>
          <CardDescription className="text-gray-500 mt-2">{finalDescription}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button
            onClick={handleAction}
            className="bg-emerald-600 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {finalActionLabel}
          </Button>
          <div className="mt-4 text-xs text-gray-400">Mulai Sekarang</div>
        </CardContent>
      </Card>
    </div>
  )
}
