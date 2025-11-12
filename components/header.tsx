import { ThemeSwitch } from "@/components/theme-switch"
import Image from "next/image"

export default function Header() {
  return (
    <nav className="sticky top-0 z-50 bg-slate-50 dark:bg-slate-900 backdrop-blur-md border-b shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Image src="/img/favicon.ico" alt="SIPEKA Logo" width={32} height={32} />
            <span className="ml-3 text-xl font-bold text-gray-900 dark:text-gray-300">SIPEKA</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeSwitch/>
          </div>
        </div>
      </div>
    </nav>
  )
}
