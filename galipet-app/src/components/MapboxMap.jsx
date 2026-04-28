import mapboxgl from 'mapbox-gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12'

/** Fès city center — default view + cap when flying to a single marker / selection */
const FES_CENTER = { latitude: 34.0333, longitude: -5.0003 }
const MAP_ZOOM_CITY = 11

const DEFAULT_VIEW = {
  ...FES_CENTER,
  zoom: MAP_ZOOM_CITY,
}

function specialtyStyle(specialty) {
  switch (String(specialty || '').toLowerCase()) {
    case 'vet':
      return { emoji: '🩺', bg: '#185FA5' }
    case 'grooming':
      return { emoji: '✂️', bg: '#3B6D11' }
    case 'sitting':
      return { emoji: '🦮', bg: '#854F0B' }
    case 'training':
      return { emoji: '🎓', bg: '#D85A30' }
    default:
      return { emoji: '🐾', bg: '#6b6375' }
  }
}

function firstName(name) {
  const part = String(name || '')
    .trim()
    .split(/\s+/)[0]
  return part || 'Pro'
}

function formatSpecialty(s) {
  const v = String(s || '').toLowerCase()
  const labels = {
    vet: 'Vet',
    grooming: 'Grooming',
    sitting: 'Pet sitting',
    training: 'Training',
  }
  return labels[v] || v || 'Professional'
}

export default function MapboxMap({ professionals, selectedId, onSelectPro, onBookNow, onViewProfile, flyTo }) {
  const mapRef = useRef(null)
  const [popupId, setPopupId] = useState(null)

  const withCoords = useMemo(
    () =>
      (professionals || []).filter(
        (p) =>
          p != null &&
          Number.isFinite(Number(p.lat)) &&
          Number.isFinite(Number(p.lng)),
      ),
    [professionals],
  )

  const boundsKey = useMemo(
    () => withCoords.map((p) => `${p._id}:${p.lat}:${p.lng}`).join('|'),
    [withCoords],
  )

  const popupPro = useMemo(
    () => withCoords.find((p) => String(p._id) === String(popupId)),
    [popupId, withCoords],
  )

  useEffect(() => {
    const map = mapRef.current?.getMap?.()
    if (!map || !withCoords.length) return

    if (withCoords.length === 1) {
      const p = withCoords[0]
      map.easeTo({
        center: [Number(p.lng), Number(p.lat)],
        zoom: MAP_ZOOM_CITY,
        duration: 500,
      })
      return
    }

    const bounds = new mapboxgl.LngLatBounds()
    withCoords.forEach((p) => bounds.extend([Number(p.lng), Number(p.lat)]))
    map.fitBounds(bounds, { padding: 64, maxZoom: MAP_ZOOM_CITY, duration: 600 })
  }, [boundsKey, withCoords])

  useEffect(() => {
    if (selectedId == null || selectedId === '') return
    const map = mapRef.current?.getMap?.()
    const pro = withCoords.find((p) => String(p._id) === String(selectedId))
    if (!map || !pro) return
    map.easeTo({
      center: [Number(pro.lng), Number(pro.lat)],
      zoom: MAP_ZOOM_CITY,
      duration: 450,
    })
  }, [selectedId, withCoords])

  useEffect(() => {
    if (!flyTo) return
    const map = mapRef.current?.getMap?.()
    if (!map) return
    map.flyTo({
      center: [flyTo.longitude, flyTo.latitude],
      zoom: flyTo.zoom || 11,
      duration: 1500,
    })
  }, [flyTo])

  const handleMarkerClick = useCallback(
    (e, id) => {
      if (e?.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
        e.originalEvent.stopPropagation()
      }
      setPopupId(id)
      onSelectPro?.(id)
    },
    [onSelectPro],
  )

  const handleBookFromPopup = useCallback(() => {
    if (!popupPro) return
    onBookNow?.(popupPro)
    setPopupId(null)
  }, [onBookNow, popupPro])

  const handleViewProfileFromPopup = useCallback(() => {
    if (!popupPro) return
    onViewProfile?.(popupPro)
    setPopupId(null)
  }, [onViewProfile, popupPro])

  if (!String(MAPBOX_TOKEN || '').trim()) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F3E8DF] px-4 text-center text-sm text-gray-600">
        Add{' '}
        <code className="mx-1 rounded bg-white/90 px-1.5 py-0.5 font-mono text-xs text-gray-800">
          VITE_MAPBOX_TOKEN
        </code>{' '}
        to <code className="mx-1 rounded bg-white/90 px-1.5 py-0.5 font-mono text-xs text-gray-800">.env</code>{' '}
        to show the map.
      </div>
    )
  }

  return (
    <div className="relative h-full w-full min-h-[240px] overflow-hidden rounded-l-none md:rounded-none">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={DEFAULT_VIEW}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        onClick={() => setPopupId(null)}
        reuseMaps
      >
        <NavigationControl position="top-right" showCompass={false} />

        {withCoords.map((pro) => {
          const id = String(pro._id)
          const selected = selectedId != null && String(selectedId) === id
          return (
            <Marker
              key={id}
              latitude={Number(pro.lat)}
              longitude={Number(pro.lng)}
              anchor="bottom"
              onClick={(e) => handleMarkerClick(e, id)}
            >
              <div
                role="presentation"
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-md transition-all duration-200 ${
                  selected
                    ? 'scale-125 border-[#E05C2A] bg-white text-[#E05C2A]'
                    : 'bg-[#E05C2A] text-white'
                }`}
              >
                ⭐
              </div>
            </Marker>
          )
        })}

        {popupPro ? (
          <Popup
            latitude={Number(popupPro.lat)}
            longitude={Number(popupPro.lng)}
            anchor="bottom"
            offset={18}
            onClose={() => setPopupId(null)}
            closeButton
            closeOnClick={false}
            maxWidth="280px"
          >
            <div
              className="min-w-[220px] p-1"
              onClick={(e) => e.stopPropagation()}
              role="presentation"
            >
              <p className="text-sm font-semibold text-gray-900">
                <span className="mr-1.5">{specialtyStyle(popupPro.specialty).emoji}</span>
                {popupPro.name}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {formatSpecialty(popupPro.specialty)}
                {popupPro.city ? ` · ${popupPro.city}` : ''}
              </p>
              <p className="mt-1 text-xs font-medium text-[#D85A30]">
                {Number(popupPro.rating || 0).toFixed(1)} ★
              </p>
              <button type="button" className="primary mt-3 w-full text-sm" onClick={handleBookFromPopup}>
                Book now
              </button>
              <button
                type="button"
                className="mt-1 w-full text-xs text-[#D85A30] transition-colors hover:underline"
                onClick={handleViewProfileFromPopup}
              >
                View profile
              </button>
            </div>
          </Popup>
        ) : null}
      </Map>

      {!withCoords.length ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#F3E8DF]/85 px-4">
          <p className="text-center text-sm text-gray-600">No map locations for the current list.</p>
        </div>
      ) : null}
    </div>
  )
}
