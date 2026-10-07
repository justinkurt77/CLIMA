import { reverseGeocode } from "./reportConstants";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MapView } from "./MapView";
import { CenterPin } from "./CenterPin";
import { BackButton, RecenterButton } from "./MapActionButtons";
import { LocationBottomSheet } from "./LocationBottomSheet";

export default function Step3MapPicker({
  tempCoords,
  location,
  onBack,
  onTempCoordsChange,
  onConfirm,
  onRecenter,
}) {
  const mapRef = useRef(null);
  const [localAddress, setLocalAddress] = useState(
    location || "Drag the map to select a location",
  );
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsTransitioning(false), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true },
      );
    }
  }, []);

  const handleRecenterLocal = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation({ lat, lng });
          mapRef.current?.flyTo({
            center: [lng, lat],
            zoom: 16.5,
            duration: 800,
          });
          onTempCoordsChange({ lat, lng });
        },
        () => {},
        { enableHighAccuracy: true },
      );
    }
  };

  const handleMoveEnd = async (e) => {
    const lat = e.viewState.latitude;
    const lng = e.viewState.longitude;
    setIsFetchingAddress(true);
    try {
      const { address } = await reverseGeocode(lat, lng);
      setLocalAddress(address);
    } catch {
      setLocalAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
    setIsFetchingAddress(false);
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "tween", duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10001,
        display: "flex",
        flexDirection: "column",
        background: "#f0ece8",
      }}
    >
      {/* Full-screen map */}
      <div style={{ flex: 1, position: "relative", background: "#f0ece8" }}>
        <MapView
          isTransitioning={isTransitioning}
          mapRef={mapRef}
          tempCoords={tempCoords}
          onTempCoordsChange={onTempCoordsChange}
          handleMoveEnd={handleMoveEnd}
          userLocation={userLocation}
        />

        {/* Fixed center pin */}
        <CenterPin />

        {/* Action buttons */}
        <BackButton onClick={onBack} />
        <RecenterButton onClick={handleRecenterLocal} />
      </div>

      {/* Bottom sheet */}
      <LocationBottomSheet
        isFetchingAddress={isFetchingAddress}
        localAddress={localAddress}
        onConfirm={onConfirm}
      />
    </motion.div>
  );
}
