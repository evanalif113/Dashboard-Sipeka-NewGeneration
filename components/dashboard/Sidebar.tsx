"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sun, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { NavigationItem } from "./navigation"
import Image from "next/image"

interface SidebarProps {
  navigation: NavigationItem[]
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function Sidebar({ navigation, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname()
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (sidebarOpen && overlayRef.current && event.target === overlayRef.current) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener("click", handleOutsideClick)
    return () => document.removeEventListener("click", handleOutsideClick)
  }, [sidebarOpen, setSidebarOpen])

  // Mobile overlay - only for small screens
  const mobileOverlay = sidebarOpen && (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-40 bg-gray-600/60 dark:bg-gray-900/70 backdrop-blur-sm lg:hidden"
    />
  )

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-200 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden shadow-md lg:m-4 m-3">
      {/* Header with logo - mobile only, since we're showing logo in Topbar on desktop */}
      <div className="flex items-center h-16 px-4 bg-gray-200 dark:bg-slate-900 border-b border-gray-300 dark:border-gray-700 lg:hidden">
        <Image src="/img/favicon.ico" alt="SIPEKA Logo" width={32} height={32} />
        <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white flex-1">SIPEKA</span>
        {/* Close button - mobile only */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(false)}
          className="text-gray-700 dark:text-gray-200 hover:bg-gray-300/50 dark:hover:bg-slate-800/60 lg:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Navigation area with gradient background */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
        {/* Main navigation */}
        <nav className="flex-1 space-y-1 px-3 py-5">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => sidebarOpen && setSidebarOpen(false)}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-sm transition-all duration-200",
                  isActive
                    ? "bg-blue-500 text-white dark:bg-blue-600"
                    : "text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 hover:text-blue-800 dark:hover:text-blue-300"
                )}
              >
                <item.icon 
                  className={cn(
                    "mr-3 h-5 w-5 transition-all duration-200",
                    isActive
                      ? "text-white"
                      : "text-gray-500 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                  )} 
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )

  return (
    <>
      {mobileOverlay}
      
      {/* Mobile sidebar - fixed position overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
        aria-modal="true"
      >
        <div className="fixed inset-y-0 left-0 z-50 w-64 flex-col">
          {sidebarContent}
        </div>
      </div>

      {/* Desktop sidebar - height fixed to match content area */}
      <div className="h-full hidden lg:block">
        {sidebarContent}
      </div>
    </>
  )
}