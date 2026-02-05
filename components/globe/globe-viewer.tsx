"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Plus, Minus, RotateCcw, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

// Dynamically import react-globe.gl with SSR disabled
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
      <div className="text-white">Loading globe...</div>
    </div>
  ),
})

interface CountryColorMap {
  [countryCode: string]: string
}

interface GlobeViewerProps {
  selectedCountries: string[]
  countryColors?: CountryColorMap
  onCountryClick: (countryCode: string, countryName: string) => void
  className?: string
}

interface GeoProperties {
  ISO_A2?: string
  ISO_A2_EH?: string
  ADMIN?: string
  NAME?: string
}

interface GeoFeature {
  type: string
  properties: GeoProperties
  geometry: {
    type: string
    coordinates: number[][][] | number[][][][]
  }
}

interface GeoJSON {
  type: string
  features: GeoFeature[]
}

// Helper to get country code from GeoJSON properties
function getCountryCode(properties: GeoProperties | undefined): string {
  if (!properties) return ''
  const code = properties.ISO_A2 || ''
  // Fall back to ISO_A2_EH if ISO_A2 is -99 (happens for France, Norway, etc.)
  if (code === '-99' && properties.ISO_A2_EH) {
    return properties.ISO_A2_EH
  }
  return code
}

// Helper to get country name from GeoJSON properties
function getCountryName(properties: GeoProperties | undefined): string {
  if (!properties) return 'Unknown'
  return properties.ADMIN || properties.NAME || 'Unknown'
}

// Module-level GeoJSON cache — survives across mounts/navigations
let geoJsonCache: GeoJSON | null = null
let geoJsonPromise: Promise<GeoJSON> | null = null

function fetchGeoJson(): Promise<GeoJSON> {
  if (geoJsonCache) return Promise.resolve(geoJsonCache)
  if (!geoJsonPromise) {
    geoJsonPromise = fetch('/data/countries.geojson')
      .then(res => res.json())
      .then(data => { geoJsonCache = data; return data })
  }
  return geoJsonPromise
}

export function GlobeViewer({ selectedCountries, countryColors = {}, onCountryClick, className = '' }: GlobeViewerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null)
  const [countries, setCountries] = useState<GeoJSON | null>(null)
  const [hoverCountry, setHoverCountry] = useState<GeoFeature | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isRotating, setIsRotating] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('globe-rotating')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })
  const [webGLSupported, setWebGLSupported] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedSet = useMemo(() => new Set(selectedCountries), [selectedCountries.join(',')])

  useEffect(() => {
    setWebGLSupported(isWebGLAvailable())
  }, [])

  // Load country data (module-level cache avoids re-fetching across navigations)
  useEffect(() => {
    fetchGeoJson()
      .then(data => setCountries(data))
      .catch(err => console.error('Error loading country data:', err))
  }, [])

  // Handle resize - use window dimensions for full viewport coverage
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Update rotation when isRotating changes
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls?.()
      if (controls) {
        controls.autoRotate = isRotating
      }
    }
  }, [isRotating])

  // Initialize globe controls when ready
  const handleGlobeReady = useCallback(() => {
    const initControls = () => {
      if (globeRef.current) {
        const controls = globeRef.current.controls?.()
        if (controls) {
          controls.autoRotate = isRotating
          controls.autoRotateSpeed = 0.5
          controls.minDistance = 150 // Closest zoom
          controls.maxDistance = 500 // Farthest zoom
          return true
        }
      }
      return false
    }

    // Try immediately, then retry a few times if needed
    if (!initControls()) {
      let attempts = 0
      const interval = setInterval(() => {
        attempts++
        if (initControls() || attempts >= 10) {
          clearInterval(interval)
        }
      }, 100)
    }
  }, [isRotating])

  const handleToggleRotation = useCallback(() => {
    setIsRotating(prev => {
      const newValue = !prev
      sessionStorage.setItem('globe-rotating', String(newValue))
      // Directly update controls
      if (globeRef.current) {
        const controls = globeRef.current.controls?.()
        if (controls) {
          controls.autoRotate = newValue
        }
      }
      return newValue
    })
  }, [])

  // Toggle rotation with spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        handleToggleRotation()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleToggleRotation])

  const handleZoomIn = useCallback(() => {
    if (globeRef.current) {
      const camera = globeRef.current.camera?.()
      if (camera) {
        const currentDistance = camera.position.length()
        const newDistance = Math.max(150, currentDistance * 0.8)
        const scale = newDistance / currentDistance
        camera.position.multiplyScalar(scale)
      }
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (globeRef.current) {
      const camera = globeRef.current.camera?.()
      if (camera) {
        const currentDistance = camera.position.length()
        const newDistance = Math.min(500, currentDistance * 1.25)
        const scale = newDistance / currentDistance
        camera.position.multiplyScalar(scale)
      }
    }
  }, [])

  const handleResetView = useCallback(() => {
    if (globeRef.current) {
      const camera = globeRef.current.camera?.()
      if (camera) {
        const currentDistance = camera.position.length()
        const defaultDistance = 300
        const scale = defaultDistance / currentDistance
        camera.position.multiplyScalar(scale)
      }
    }
  }, [])

  const handlePolygonClick = useCallback((polygon: object | null) => {
    if (polygon && 'properties' in polygon) {
      const feature = polygon as GeoFeature
      const countryCode = getCountryCode(feature.properties)
      const countryName = getCountryName(feature.properties)
      if (countryCode && countryCode !== '-99') {
        onCountryClick(countryCode, countryName)
      }
    }
  }, [onCountryClick])

  const getPolygonColor = useCallback((obj: object) => {
    const feature = obj as GeoFeature
    const countryCode = getCountryCode(feature.properties)
    if (selectedSet.has(countryCode)) {
      // Use custom color if set, with 90% opacity
      const customColor = countryColors[countryCode]
      if (customColor) {
        // Convert hex to rgba
        const r = parseInt(customColor.slice(1, 3), 16)
        const g = parseInt(customColor.slice(3, 5), 16)
        const b = parseInt(customColor.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, 0.9)`
      }
      return 'rgba(96, 165, 250, 0.9)' // Default blue for selected
    }
    if (hoverCountry && getCountryCode(hoverCountry.properties) === countryCode) {
      return 'rgba(209, 213, 219, 0.7)' // Bright gray for hover
    }
    return 'rgba(134, 148, 168, 0.6)' // Brighter default gray
  }, [selectedSet, countryColors, hoverCountry])

  const getPolygonAltitude = useCallback((obj: object) => {
    const feature = obj as GeoFeature
    const countryCode = getCountryCode(feature.properties)
    if (selectedSet.has(countryCode)) {
      return 0.012 // Minimal elevation for selected
    }
    if (hoverCountry && getCountryCode(hoverCountry.properties) === countryCode) {
      return 0.012 // Slightly elevated for hover
    }
    return 0.01 // Default
  }, [selectedSet, hoverCountry])

  const getPolygonLabel = useCallback((obj: object) => {
    const d = obj as GeoFeature
    const name = getCountryName(d.properties)
    const code = getCountryCode(d.properties)
    const isSelected = selectedSet.has(code)
    return `
      <div class="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg">
        <div class="font-medium">${name}</div>
        <div class="text-xs text-gray-400">${code}</div>
        ${isSelected ? '<div class="text-xs text-blue-400 mt-1">Selected</div>' : ''}
      </div>
    `
  }, [selectedSet])

  const handlePolygonHover = useCallback((polygon: object | null) => {
    if (polygon && 'properties' in polygon) {
      setHoverCountry(polygon as GeoFeature)
    } else {
      setHoverCountry(null)
    }
  }, [])

  if (!webGLSupported) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-900 rounded-lg ${className}`}>
        <div className="text-center text-white px-6">
          <p className="text-lg font-medium">WebGL is not available</p>
          <p className="text-sm text-gray-400 mt-2">
            Your browser or device does not support WebGL, which is required to display the 3D globe.
            Try enabling hardware acceleration in your browser settings or using a different browser.
          </p>
        </div>
      </div>
    )
  }

  if (!countries) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-900 rounded-lg ${className}`}>
        <div className="text-white">Loading globe...</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`w-full h-full relative ${className}`}>
      <Globe
        ref={globeRef}
        width={dimensions.width || 800}
        height={dimensions.height || 600}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        polygonsData={countries.features}
        polygonCapColor={getPolygonColor}
        polygonSideColor={() => 'rgba(134, 148, 168, 0.4)'}
        polygonStrokeColor={() => 'rgba(255, 255, 255, 0.25)'}
        polygonAltitude={getPolygonAltitude}
        polygonLabel={getPolygonLabel}
        onPolygonClick={handlePolygonClick}
        onPolygonHover={handlePolygonHover}
        onGlobeReady={handleGlobeReady}
        polygonsTransitionDuration={300}
        atmosphereColor="rgba(129, 140, 248, 0.5)"
        atmosphereAltitude={0.18}
      />

      {/* Globe Controls */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 bg-white/90 hover:bg-white border-gray-200 shadow-lg"
          onClick={handleToggleRotation}
          title={isRotating ? "Pause rotation (Space)" : "Resume rotation (Space)"}
        >
          {isRotating ? (
            <Pause className="h-4 w-4 text-gray-700" />
          ) : (
            <Play className="h-4 w-4 text-gray-700" />
          )}
        </Button>
        <div className="h-px bg-gray-300 mx-2" />
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 bg-white/90 hover:bg-white border-gray-200 shadow-lg"
          onClick={handleZoomIn}
          title="Zoom in"
        >
          <Plus className="h-5 w-5 text-gray-700" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 bg-white/90 hover:bg-white border-gray-200 shadow-lg"
          onClick={handleZoomOut}
          title="Zoom out"
        >
          <Minus className="h-5 w-5 text-gray-700" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 bg-white/90 hover:bg-white border-gray-200 shadow-lg"
          onClick={handleResetView}
          title="Reset view"
        >
          <RotateCcw className="h-4 w-4 text-gray-700" />
        </Button>
      </div>
    </div>
  )
}
