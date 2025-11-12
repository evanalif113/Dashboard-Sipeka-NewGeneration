import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { NavigationItem } from "./navigation"
import { X, Sun } from "lucide-react"

interface MobileSidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  navigation: NavigationItem[]
}

export function MobileSidebar({ sidebarOpen, setSidebarOpen, navigation }: MobileSidebarProps) {
  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-600/60 dark:bg-gray-900/70 backdrop-blur-sm"
        onClick={() => setSidebarOpen(false)}
      />
      {/* Panel */}
      <div className="fixed inset-y-0 left-0 flex w-64 flex-col">
        <div className="flex flex-col flex-grow bg-gray-200 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden shadow-md m-3">
          {/* Header */}
          <div className="flex items-center h-16 px-4 bg-gray-200 dark:bg-slate-900 border-b border-gray-300 dark:border-gray-700">
            <div className="p-2 bg-orange-600 rounded-md shadow-md">
              <Sun className="h-6 w-6 text-white" />
            </div>
            <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white flex-1">Meteo Sense</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="text-gray-700 dark:text-gray-200 hover:bg-gray-300/50 dark:hover:bg-slate-800/60"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-5 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-sm text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 hover:text-blue-800 dark:hover:text-blue-300 transition-all duration-200"
              >
                <item.icon className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
