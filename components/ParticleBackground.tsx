"use client"

import { useEffect, useMemo, useState } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { type Container, type ISourceOptions } from "@tsparticles/engine"
import { loadSlim } from "@tsparticles/slim"
import { useTheme } from "next-themes"

const ParticleBackground = () => {
  const [init, setInit] = useState(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false) // wait for theme to mount

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setInit(true)
    })
  }, [])

  const particlesLoaded = async (_container?: Container): Promise<void> => {
    // Particles loaded
  }

  const isDark = resolvedTheme === "dark"

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: {
            enable: false, // Rain doesn't need hover effects
          },
        },
      },
      particles: {
        color: {
          value: isDark ? "#ffffff" : "#0B3954", // White on dark, dark blue on light
        },
        links: {
          enable: false, // No links for raindrops
        },
        move: {
          direction: "bottom",
          enable: true,
          outModes: {
            default: "out",
          },
          random: false,
          speed: { min: 2, max: 7 }, // Rain-like speed
          straight: true,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: 200, // More particles for a denser rain effect
        },
        opacity: {
          value: { min: 0.1, max: 0.5 }, // Varied opacity for depth
        },
        shape: {
          type: "circle",
        },
        size: {
          value: {
            min: 1,
            max: 3,
          },
        },
      },
      detectRetina: true,
    }),
    [isDark],
  )

  // Avoid SSR hydration mismatch and render only after init + mounted
  if (!init || !mounted) return null

  return (
    <Particles
      key={isDark ? "dark" : "light"} // force re-init on theme change
      id="tsparticles"
      particlesLoaded={particlesLoaded}
      options={options}
      className="absolute inset-0 z-10"
    />
  )
}

export default ParticleBackground
