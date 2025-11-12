"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { NavigationItem } from "./navigation"
import { Sun } from "lucide-react"

interface DesktopSidebarProps {
  navigation: NavigationItem[]
}

export function DesktopSidebar({ navigation }: DesktopSidebarProps) {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:p-4">
      <div className="flex flex-col flex-grow bg-gray-200 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden shadow-md">
        <div className="flex items-center h-16 px-4 bg-gray-200 dark:bg-slate-900">
          <div className="p-2 bg-orange-600 rounded-md shadow-md">
            <Sun className="h-6 w-6 text-white" />
          </div>
          <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">Meteo Sense</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-sm transition-all duration-200 ${
                  isActive
                    ? "bg-blue-500 text-white dark:bg-blue-600"
                    : "text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 hover:text-blue-800 dark:hover:text-blue-300"
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 transition-all duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                }`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
