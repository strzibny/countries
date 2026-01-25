"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Plus, Minus, RotateCcw, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  'ISO3166-1-Alpha-2'?: string
  ISO_A2?: string
  name?: string
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

// Helper to get country code from various GeoJSON formats
function getCountryCode(properties: GeoProperties | undefined): string {
  if (!properties) return ''
  return properties['ISO3166-1-Alpha-2'] || properties.ISO_A2 || ''
}

// Helper to get country name from various GeoJSON formats
function getCountryName(properties: GeoProperties | undefined): string {
  if (!properties) return 'Unknown'
  return properties.name || properties.ADMIN || properties.NAME || 'Unknown'
}

export function GlobeViewer({ selectedCountries, countryColors = {}, onCountryClick, className = '' }: GlobeViewerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null)
  const [countries, setCountries] = useState<GeoJSON | null>(null)
  const [hoverCountry, setHoverCountry] = useState<GeoFeature | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isRotating, setIsRotating] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load country data
  useEffect(() => {
    fetch('/data/countries.geojson')
      .then(res => res.json())
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

  // Auto-rotate globe and set zoom limits
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls?.()
      if (controls) {
        controls.autoRotate = isRotating
        controls.autoRotateSpeed = 0.5
        controls.minDistance = 150 // Closest zoom
        controls.maxDistance = 500 // Farthest zoom
      }
    }
  }, [countries, isRotating])

  const handleToggleRotation = useCallback(() => {
    setIsRotating(prev => !prev)
  }, [])

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
    if (selectedCountries.includes(countryCode)) {
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
  }, [selectedCountries, countryColors, hoverCountry])

  const getPolygonAltitude = useCallback((obj: object) => {
    const feature = obj as GeoFeature
    const countryCode = getCountryCode(feature.properties)
    if (selectedCountries.includes(countryCode)) {
      return 0.04 // Elevated for selected
    }
    if (hoverCountry && getCountryCode(hoverCountry.properties) === countryCode) {
      return 0.02 // Slightly elevated for hover
    }
    return 0.01 // Default
  }, [selectedCountries, hoverCountry])

  const getPolygonLabel = useCallback((obj: object) => {
    const d = obj as GeoFeature
    const name = getCountryName(d.properties)
    const code = getCountryCode(d.properties)
    const isSelected = selectedCountries.includes(code)
    return `
      <div class="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg">
        <div class="font-medium">${name}</div>
        <div class="text-xs text-gray-400">${code}</div>
        ${isSelected ? '<div class="text-xs text-blue-400 mt-1">Selected</div>' : ''}
      </div>
    `
  }, [selectedCountries])

  const handlePolygonHover = useCallback((polygon: object | null) => {
    if (polygon && 'properties' in polygon) {
      setHoverCountry(polygon as GeoFeature)
    } else {
      setHoverCountry(null)
    }
  }, [])

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
        polygonsTransitionDuration={300}
        atmosphereColor="rgba(129, 140, 248, 0.5)"
        atmosphereAltitude={0.18}
      />

      {/* Zoom Controls */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2">
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

      {/* Rotation Control */}
      <div className="absolute bottom-6 right-6">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 bg-white/90 hover:bg-white border-gray-200 shadow-lg"
          onClick={handleToggleRotation}
          title={isRotating ? "Pause rotation" : "Resume rotation"}
        >
          {isRotating ? (
            <Pause className="h-4 w-4 text-gray-700" />
          ) : (
            <Play className="h-4 w-4 text-gray-700" />
          )}
        </Button>
      </div>
    </div>
  )
}
