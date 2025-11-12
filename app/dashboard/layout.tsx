"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutDashboard, Network, Database, ChartNoAxesCombined, User } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { signOutUser } from "@/lib/FetchingAuth"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { Topbar } from "@/components/dashboard/Topbar"
import type { NavigationItem } from "@/components/dashboard/navigation"
import Loading from "../loading"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    try {
      await signOutUser()
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (loading) {
    return <Loading/>
  }

  if (!user) {
    return null
  }

  const navigation: NavigationItem[] = [
    { name: "Beranda", href: "/dashboard", icon: LayoutDashboard },
    { name: "Perangkat", href: "/dashboard/perangkat", icon: Network },
    { name: "Data", href: "/dashboard/data", icon: Database },
    { name: "Analisis", href: "/dashboard/analisis", icon: ChartNoAxesCombined },
    { name: "Profil", href: "/dashboard/profil", icon: User },
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Topbar now spans full width */}
      <Topbar 
        user={user} 
        profile={profile} 
        setSidebarOpen={setSidebarOpen} 
        handleLogout={handleLogout}
        navigation={navigation} // Pass navigation to Topbar
      />

      {/* Content area with sidebar and main content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - fixed position on desktop */}
        <div className={`lg:block ${sidebarOpen ? "block" : "hidden"} lg:w-64 flex-shrink-0`}>
          <div className="lg:h-[calc(100vh-4rem)] overflow-hidden">
            <Sidebar 
              navigation={navigation}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          </div>
        </div>

        {/* Main content - scrollable */}
        <div className="flex-1 overflow-y-auto">
          <main className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}