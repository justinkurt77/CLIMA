import { motion } from "framer-motion";
import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "./reportConstants";

export function MapView({
  isTransitioning,
  mapRef,
  tempCoords,
  onTempCoordsChange,
  handleMoveEnd,
  userLocation,
}) {
  if (isTransitioning) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{ width: "100%", height: "100%" }}
    >
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: tempCoords?.lng ?? 121.0509,
          latitude: tempCoords?.lat ?? 15.5415,
          zoom: 16.5,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        onMove={(e) =>
          onTempCoordsChange({
            lng: e.viewState.longitude,
            lat: e.viewState.latitude,
          })
        }
        onMoveEnd={handleMoveEnd}
        style={{ width: "100%", height: "100%" }}
      >
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#4285F4",
                border: "3px solid white",
                boxShadow: "0 0 10px rgba(66, 133, 244, 0.5)",
              }}
            />
          </Marker>
        )}
      </Map>
    </motion.div>
  );
}
