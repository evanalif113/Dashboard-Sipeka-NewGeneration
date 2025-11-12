"use client"

import { ComponentRef, ComponentPropsWithoutRef, forwardRef, useEffect, useState,  } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from "next-themes"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const ThemeSwitch = forwardRef<
  ComponentRef<typeof SwitchPrimitives.Root>,
  ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Hindari hydration mismatch dengan tidak merender apa pun di server.
    return null
  }

  const isDarkMode = theme === "dark"

  const toggleTheme = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  return (
    <SwitchPrimitives.Root
      checked={isDarkMode}
      onCheckedChange={toggleTheme}
      className={cn(
        "aria-labelledby=theme-toggle",
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-gray-700 data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-primary-700 dark:data-[state=unchecked]:bg-gray-600",
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none relative block h-5 w-5 rounded-full bg-white dark:bg-gray-900 shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )}
      >
        <Sun className="absolute inset-0 m-auto h-3 w-3 rotate-0 scale-100 text-amber-500 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute inset-0 m-auto h-3 w-3 rotate-90 scale-0 text-slate-50 transition-all dark:rotate-0 dark:scale-100" />
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  )
})
ThemeSwitch.displayName = "ThemeSwitch"

export { ThemeSwitch }
