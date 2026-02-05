"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [countries, setCountries] = useState<GeoJSON | null>(null)
  const [isRotating, setIsRotating] = useState(true)
  const [webGLSupported, setWebGLSupported] = useState(true)
  const [isReady, setIsReady] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rendererRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sceneRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cameraRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raycasterRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mouseRef = useRef<any>(null)
  const animationIdRef = useRef<number>(0)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hoverObjRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prevHoverMeshRef = useRef<any>(null)
  const onCountryClickRef = useRef(onCountryClick)
  const countryColorsRef = useRef(countryColors)
  const isRotatingRef = useRef(isRotating)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedSet = useMemo(() => new Set(selectedCountries), [selectedCountries.join(',')])
  const selectedSetRef = useRef(selectedSet)

  // Keep refs in sync
  useEffect(() => { onCountryClickRef.current = onCountryClick }, [onCountryClick])
  useEffect(() => { countryColorsRef.current = countryColors }, [countryColors])
  useEffect(() => { isRotatingRef.current = isRotating }, [isRotating])
  useEffect(() => { selectedSetRef.current = selectedSet }, [selectedSet])

  useEffect(() => {
    setWebGLSupported(isWebGLAvailable())
    const saved = sessionStorage.getItem('globe-rotating')
    if (saved !== null) {
      setIsRotating(saved === 'true')
    }
  }, [])

  // Load country data (module-level cache avoids re-fetching across navigations)
  useEffect(() => {
    fetchGeoJson()
      .then(data => setCountries(data))
      .catch(err => console.error('Error loading country data:', err))
  }, [])

  // Primary init effect — dynamic imports for SSR safety
  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false

    async function init() {
      const [THREE, { OrbitControls }, ThreeGlobeModule] = await Promise.all([
        import('three'),
        import('three/addons/controls/OrbitControls.js'),
        import('three-globe'),
      ])
      const ThreeGlobe = ThreeGlobeModule.default

      if (cancelled || !containerRef.current) return

      const container = containerRef.current
      const width = container.clientWidth || 800
      const height = container.clientHeight || 600

      // Renderer
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(width, height)
      container.appendChild(renderer.domElement)
      rendererRef.current = renderer

      // Scene
      const scene = new THREE.Scene()
      scene.background = null
      scene.add(new THREE.AmbientLight(0xcccccc, Math.PI))
      scene.add(new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI))
      sceneRef.current = scene

      // Camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
      camera.position.z = 300
      cameraRef.current = camera

      // Globe
      const globe = new ThreeGlobe()
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
        .showAtmosphere(true)
        .atmosphereColor('rgba(129, 140, 248, 0.5)')
        .atmosphereAltitude(0.18)
        .polygonSideColor(() => 'rgba(134, 148, 168, 0.4)')
        .polygonStrokeColor(() => 'rgba(255, 255, 255, 0.25)')
        .polygonsTransitionDuration(300)
      scene.add(globe)
      globeRef.current = globe

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.autoRotate = isRotatingRef.current
      controls.autoRotateSpeed = 0.5
      controls.minDistance = 150
      controls.maxDistance = 500
      controls.enableDamping = true
      controlsRef.current = controls

      // Raycaster
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2()
      raycasterRef.current = raycaster
      mouseRef.current = mouse

      // Tooltip div
      const tooltip = document.createElement('div')
      tooltip.style.position = 'absolute'
      tooltip.style.pointerEvents = 'none'
      tooltip.style.display = 'none'
      tooltip.style.zIndex = '50'
      container.appendChild(tooltip)
      tooltipRef.current = tooltip

      // Helper: find polygon object from raycaster intersection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function findPolygonObj(obj: any): any {
        let current = obj
        while (current) {
          if (current.__globeObjType === 'polygon') return current
          current = current.parent
        }
        return null
      }

      // Helper: set cap material color directly on a polygon mesh (O(1))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function setCapColor(polyObj: any, r: number, g: number, b: number, a: number) {
        const mesh = polyObj.children?.[0]
        const capMat = mesh?.material?.[1]
        if (capMat) {
          capMat.color.setRGB(r / 255, g / 255, b / 255)
          capMat.opacity = a
          capMat.transparent = a < 1
        }
      }

      // Helper: restore a polygon mesh to its non-hover color
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function restoreCapColor(polyObj: any) {
        const feature = (polyObj.__data?.data || polyObj.__data) as GeoFeature | undefined
        if (!feature) return
        const code = getCountryCode(feature.properties)
        if (selectedSetRef.current.has(code)) {
          const custom = countryColorsRef.current[code]
          if (custom) {
            const r = parseInt(custom.slice(1, 3), 16)
            const g = parseInt(custom.slice(3, 5), 16)
            const b = parseInt(custom.slice(5, 7), 16)
            setCapColor(polyObj, r, g, b, 0.9)
          } else {
            setCapColor(polyObj, 96, 165, 250, 0.9)
          }
        } else {
          setCapColor(polyObj, 134, 148, 168, 0.6)
        }
      }

      // Pointer events on canvas
      const canvas = renderer.domElement

      canvas.addEventListener('pointermove', (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(globe.children, true)

        let found = null
        for (const hit of intersects) {
          const polyObj = findPolygonObj(hit.object)
          if (polyObj) {
            found = polyObj
            break
          }
        }

        // Restore previous hover mesh to its normal color
        if (prevHoverMeshRef.current && prevHoverMeshRef.current !== found) {
          restoreCapColor(prevHoverMeshRef.current)
        }

        if (found && found.__data) {
          const feature = (found.__data.data || found.__data) as GeoFeature
          hoverObjRef.current = feature
          prevHoverMeshRef.current = found

          // Apply hover color directly on the mesh material
          setCapColor(found, 209, 213, 219, 0.7)

          const name = getCountryName(feature.properties)
          const code = getCountryCode(feature.properties)
          const isSelected = selectedSetRef.current.has(code)
          tooltip.innerHTML = `
            <div class="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg">
              <div class="font-medium">${name}</div>
              <div class="text-xs text-gray-400">${code}</div>
              ${isSelected ? '<div class="text-xs text-blue-400 mt-1">Selected</div>' : ''}
            </div>
          `
          tooltip.style.display = 'block'
          tooltip.style.left = (event.clientX - rect.left + 15) + 'px'
          tooltip.style.top = (event.clientY - rect.top + 15) + 'px'
          canvas.style.cursor = 'pointer'
        } else {
          hoverObjRef.current = null
          prevHoverMeshRef.current = null
          tooltip.style.display = 'none'
          canvas.style.cursor = 'grab'
        }
      })

      let pointerDownPos = { x: 0, y: 0 }
      canvas.addEventListener('pointerdown', (event: PointerEvent) => {
        pointerDownPos = { x: event.clientX, y: event.clientY }
      })

      canvas.addEventListener('click', (event: MouseEvent) => {
        const dx = event.clientX - pointerDownPos.x
        const dy = event.clientY - pointerDownPos.y
        if (dx * dx + dy * dy > 9) return // >3px moved = drag, not click

        if (hoverObjRef.current) {
          const feature = hoverObjRef.current as GeoFeature
          const code = getCountryCode(feature.properties)
          const name = getCountryName(feature.properties)
          if (code && code !== '-99') {
            onCountryClickRef.current(code, name)
          }
        }
      })

      // Animation loop
      function animate() {
        animationIdRef.current = requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      // ResizeObserver for responsive sizing
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect
          if (w > 0 && h > 0) {
            renderer.setSize(w, h)
            camera.aspect = w / h
            camera.updateProjectionMatrix()
          }
        }
      })
      resizeObserver.observe(container)

      setIsReady(true)

      // Store cleanup references
      ;(container as any).__globeCleanup = () => {
        cancelAnimationFrame(animationIdRef.current)
        resizeObserver.disconnect()
        controls.dispose()
        renderer.dispose()
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
        if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip)
      }
    }

    init()

    return () => {
      cancelled = true
      cancelAnimationFrame(animationIdRef.current)
      const container = containerRef.current
      if (container && (container as any).__globeCleanup) {
        ;(container as any).__globeCleanup()
        delete (container as any).__globeCleanup
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update polygon data when countries, selection, or colors change (NOT hover — that's handled directly on mesh materials)
  useEffect(() => {
    if (!globeRef.current || !countries) return

    const globe = globeRef.current
    globe
      .polygonsData(countries.features)
      .polygonCapColor((obj: object) => {
        const feature = obj as GeoFeature
        const countryCode = getCountryCode(feature.properties)
        if (selectedSet.has(countryCode)) {
          const customColor = countryColors[countryCode]
          if (customColor) {
            const r = parseInt(customColor.slice(1, 3), 16)
            const g = parseInt(customColor.slice(3, 5), 16)
            const b = parseInt(customColor.slice(5, 7), 16)
            return `rgba(${r}, ${g}, ${b}, 0.9)`
          }
          return 'rgba(96, 165, 250, 0.9)'
        }
        return 'rgba(134, 148, 168, 0.6)'
      })
      .polygonAltitude((obj: object) => {
        const feature = obj as GeoFeature
        const countryCode = getCountryCode(feature.properties)
        if (selectedSet.has(countryCode)) return 0.012
        return 0.01
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries, selectedCountries.join(','), countryColors, isReady])

  // Update rotation when isRotating changes
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isRotating
    }
  }, [isRotating])

  const handleToggleRotation = useCallback(() => {
    setIsRotating(prev => {
      const newValue = !prev
      sessionStorage.setItem('globe-rotating', String(newValue))
      if (controlsRef.current) {
        controlsRef.current.autoRotate = newValue
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
    if (cameraRef.current) {
      const camera = cameraRef.current
      const currentDistance = camera.position.length()
      const newDistance = Math.max(150, currentDistance * 0.8)
      const scale = newDistance / currentDistance
      camera.position.multiplyScalar(scale)
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (cameraRef.current) {
      const camera = cameraRef.current
      const currentDistance = camera.position.length()
      const newDistance = Math.min(500, currentDistance * 1.25)
      const scale = newDistance / currentDistance
      camera.position.multiplyScalar(scale)
    }
  }, [])

  const handleResetView = useCallback(() => {
    if (cameraRef.current) {
      const camera = cameraRef.current
      const currentDistance = camera.position.length()
      const defaultDistance = 300
      const scale = defaultDistance / currentDistance
      camera.position.multiplyScalar(scale)
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

  return (
    <div ref={containerRef} className={`w-full h-full relative ${className}`}>
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg z-10">
          <div className="text-white">Loading globe...</div>
        </div>
      )}

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
