"use client"

import Link from "next/link"
import { usePathname } from "next/navigation" // Added for pathname detection
import { Button } from "@/components/ui/button"
import { ThemeSwitch } from "@/components/theme-switch"
import { Menu, Search, Settings, LogOut, User } from "lucide-react"
import type { User as FirebaseUser } from "firebase/auth"
import type { UserProfile } from "@/hooks/useAuth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface TopbarProps {
  user: FirebaseUser
  profile: UserProfile | null
  setSidebarOpen: (open: boolean) => void
  handleLogout: () => void
  navigation: Array<{ name: string; href: string; icon: React.ElementType }> // Add navigation prop
}

export function Topbar({ user, profile, setSidebarOpen, handleLogout, navigation }: TopbarProps) {
  const pathname = usePathname() // Get current pathname
  
  // Find the current page name based on pathname
  const currentPage = navigation.find(item => item.href === pathname)?.name || "Dashboard"
  
  return (
    <header className="sticky top-0 z-30 w-full bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-3">
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden" 
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
          
          {/* Logo - both mobile and desktop */}
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8">
              <Image
                src="/img/favicon.ico" // Using the logo from public/img/logo.png
                alt="Logo SIPEKA"
                fill
                className="object-contain"
              />
            </div>
            
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white leading-none">
                SIPEKA
              </h1>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {currentPage} {/* Display current page name */}
              </span>
            </div>
          </div>
        </div>
        
        {/* Center section - search on larger screens */}
        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="h-9 rounded-full border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
        </div>
        
        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <ThemeSwitch />
          
          {/* User profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gray-200 ring-2 ring-white dark:bg-gray-700 dark:ring-gray-800">
                  {profile?.photoURL ? (
                    <Image
                      src={profile.photoURL}
                      alt={profile.displayName || "User"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className={cn(
                      "flex h-full w-full items-center justify-center bg-blue-500 text-lg font-medium text-white"
                    )}>
                      {(profile?.displayName || user.email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {profile?.displayName || user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
              <DropdownMenuSeparator className="dark:bg-gray-700" />
              <DropdownMenuItem asChild className="dark:hover:bg-gray-800 rounded-lg my-0.5">
                <Link href="/dashboard/profil">
                  <User className="mr-2 h-4 w-4 dark:text-gray-200" />
                  <span className="dark:text-gray-100">Profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="dark:hover:bg-gray-800 rounded-lg my-0.5">
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4 dark:text-gray-200" />
                  <span className="dark:text-gray-100">Pengaturan</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="dark:bg-gray-700" />
              <DropdownMenuItem onClick={handleLogout} className="dark:hover:bg-gray-800 rounded-lg my-0.5">
                <LogOut className="mr-2 h-4 w-4 dark:text-gray-200" />
                <span className="dark:text-gray-100">Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
