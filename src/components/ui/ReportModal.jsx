import { useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { reverseGeocode } from "./report/reportConstants";
import Step1CategoryPicker from "./report/Step1CategoryPicker";
import Step2DetailsForm from "./report/Step2DetailsForm";
import Step3MapPicker from "./report/Step3MapPicker";
import Step4Success from "./report/Step4Success";
import imageCompression from "browser-image-compression";
import { AnimatePresence, motion } from "framer-motion";

function ReportModal({ isOpen, onClose, onSubmit, session }) {
  const fileRef = useRef(null);

  // Navigation
  const [step, setStep] = useState(1);

  // Step 1 output
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState("ClipboardList");

  // Location
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState(null);
  const [locStatus, setLocStatus] = useState("idle"); // idle | loading | done | error
  const [tempCoords, setTempCoords] = useState(null);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");

  // Form
  const [description, setDescription] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep(1);
    setSelectedCategory(null);
    setSelectedIcon("ClipboardList");
    setLocation("");
    setCoords(null);
    setLocStatus("idle");
    setTempCoords(null);
    setAddressLine1("");
    setAddressLine2("");
    setDescription("");
    setGuestName("");
    setGuestContact("");
    setPhotos([]);
    setPhotoPreviews([]);
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocation("Hindi sinusuportahan ng device mo ang geolocation.");
      setLocStatus("error");
      return;
    }
    setLocStatus("loading");
    setLocation("");
    setCoords(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        const latLng = { lat: c.latitude, lng: c.longitude };
        setCoords(latLng);
        setTempCoords(latLng);
        try {
          const { address, barangay, road } = await reverseGeocode(
            c.latitude,
            c.longitude,
          );
          setLocation(address);
          if (road) setAddressLine1(road);
          if (barangay) setAddressLine2(barangay);
        } catch {
          setLocation(`${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`);
        }
        setLocStatus("done");
        setErrors((e) => ({ ...e, location: undefined }));
      },
      (err) => {
        const msgs = {
          1: "Pinigilan mo ang access sa lokasyon.",
          2: "Hindi matukoy ang lokasyon.",
          3: "Nag-timeout. Subukan ulit.",
        };
        setLocation(msgs[err.code] || "Error sa geolocation.");
        setLocStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handlePhotoChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const allowed = 4 - photos.length;
    if (allowed <= 0) return;

    const filesToAddRaw = files.slice(0, allowed);

    const formatCoord = (val, isLat) => {
      if (typeof val !== "number") return "";
      const abs = Math.abs(val);
      const deg = Math.floor(abs);
      const minFloat = (abs - deg) * 60;
      const min = Math.floor(minFloat);
      const sec = ((minFloat - min) * 60).toFixed(4);
      const dir = isLat ? (val >= 0 ? "N" : "S") : val >= 0 ? "E" : "W";
      return `${deg}°${min}'${sec}"${dir}`; // Lat: N/S, Lng: E/W
    };

    const addWatermark = (file) => {
      return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;

          ctx.drawImage(img, 0, 0);

          const fontSize = Math.max(16, Math.floor(canvas.width / 25));
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.textAlign = "left";

          const d = new Date();
          const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          const dateStr = `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}-${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

          const latStr = coords?.lat ? formatCoord(coords.lat, true) : "";
          const lngStr = coords?.lng ? formatCoord(coords.lng, false) : "";
          const coordStr = latStr && lngStr ? `${latStr} ${lngStr}` : "";

          const lines = [dateStr, addressLine1, addressLine2, coordStr].filter(
            Boolean,
          );

          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 4;
          ctx.lineWidth = 2;
          ctx.strokeStyle = "rgba(0,0,0,0.8)";

          let y = canvas.height - 20 - lines.length * (fontSize + 10);

          for (const line of lines) {
            y += fontSize + 10;
            ctx.strokeText(line, 20, y);
            ctx.fillText(line, 20, y);
          }

          canvas.toBlob(
            (blob) => {
              if (blob) {
                let finalFile;
                try {
                  finalFile = new File([blob], file.name, {
                    type: file.type || "image/jpeg",
                  });
                } catch (e) {
                  blob.name = file.name;
                  blob.lastModified = new Date().getTime();
                  finalFile = blob;
                }
                resolve(finalFile);
              } else {
                resolve(file);
              }
            },
            file.type || "image/jpeg",
            0.95,
          );
        };
        img.onerror = () => resolve(file);
        img.src = objectUrl;
      });
    };

    const options = {
      maxSizeMB: 0.25,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    const compressedFiles = await Promise.all(
      filesToAddRaw.map(async (file) => {
        try {
          // Compress first to apply EXIF orientation naturally & reduce scale
          const compressed = await imageCompression(file, options);
          // Add watermark directly to the oriented, reduced image
          const watermarkedFile = await addWatermark(compressed);
          return watermarkedFile;
        } catch (error) {
          console.error("Processing failed for", file.name, error);
          return file;
        }
      }),
    );

    setPhotos((prev) => [...prev, ...compressedFiles]);
    setPhotoPreviews((prev) => [
      ...prev,
      ...compressedFiles.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const handlePhotoRemove = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);

    const newPreviews = [...photoPreviews];
    newPreviews.splice(index, 1);
    setPhotoPreviews(newPreviews);
  };

  const validate = () => {
    const errs = {};
    if (!description.trim()) errs.description = "Description is Required.";
    if (!addressLine2.trim()) errs.addressLine2 = "Brgy is Required.";
    if (locStatus !== "done") errs.location = "Location is Required.";
    if (!session) {
      if (!guestName.trim()) errs.guestName = "Full Name is Required.";
      if (!guestContact.trim())
        errs.guestContact = "Contact Number is Required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const isGuest = !session;
      const computedFullName = session
        ? `${session.user.user_metadata?.first_name || ""} ${session.user.user_metadata?.last_name || ""}`.trim()
        : guestName.trim();
      const userId = session?.user?.id || null;

      let photoUrlResult = null;
      if (photos && photos.length > 0) {
        const uploadedUrls = [];

        await Promise.all(
          photos.map(async (photo) => {
            let fileToUpload = photo;
            try {
              fileToUpload = await imageCompression(fileToUpload, {
                maxSizeMB: 0.25,
                maxWidthOrHeight: 1200,
                useWebWorker: true,
              });
            } catch (err) {
              console.error("Failed to compress image before upload", err);
            }

            const generateRandomString = (length = 32) => {
              const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
              const array = new Uint8Array(length);
              crypto.getRandomValues(array);
              return Array.from(array)
                .map((x) => chars[x % chars.length])
                .join("");
            };

            const folderName = generateRandomString(32);
            const fileExt = fileToUpload.name.split(".").pop() || "jpg";
            const fileName = `${generateRandomString(16)}-${Date.now()}.${fileExt}`;
            const filePath = `${folderName}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("reports")
              .upload(filePath, fileToUpload);

            if (uploadError) {
              console.error("Storage upload error:", uploadError);
            } else {
              const { data: publicUrlData } = supabase.storage
                .from("reports")
                .getPublicUrl(filePath);
              uploadedUrls.push(publicUrlData.publicUrl);
            }
          }),
        );

        if (uploadedUrls.length > 0) {
          photoUrlResult = uploadedUrls.join(",");
        }
      }

      const { data, error } = await supabase
        .from("reports")
        .insert([
          {
            icon: selectedIcon,
            title: selectedCategory,
            location: [addressLine1, addressLine2, location]
              .filter(Boolean)
              .join(", "),
            lat: coords?.lat ?? null,
            lng: coords?.lng ?? null,
            status: "pending",
            status_label: "Pending",
            category: selectedCategory,
            description:
              (!session && guestName.trim()
                ? `[GUEST: ${guestName.trim()} - Contact: ${guestContact.trim()}]\n\n`
                : "") + description.trim(),
            photo_url: photoUrlResult,
            full_name: computedFullName,
            is_guest: isGuest,
            user_id: userId,
          },
        ])
        .select();

      if (error) throw error;
      const newReport = data[0];
      onSubmit({
        ...newReport,
        id: newReport.id,
        createdAt: newReport.created_at,
        statusLabel: newReport.status_label,
        photoPreviews: photoPreviews.length > 0 ? photoPreviews : null,
      });
      setStep(4);
    } catch (err) {
      console.error("Error inserting report:", err);
      setErrors({
        description:
          "There was a problem saving to the database. Check your Supabase credentials.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Confirm pin from Step 3 ────────────────────────────────────────────────
  const handleConfirmPin = () => {
    if (tempCoords) {
      setCoords(tempCoords);
      reverseGeocode(tempCoords.lat, tempCoords.lng)
        .then(({ address, barangay, road }) => {
          setLocation(address);
          if (road) setAddressLine1(road);
          if (barangay) setAddressLine2(barangay);
          setLocStatus("done");
          setErrors((e) => ({
            ...e,
            location: undefined,
            addressLine2: undefined,
          }));
        })
        .catch(() => {
          setLocation(
            `${tempCoords.lat.toFixed(5)}, ${tempCoords.lng.toFixed(5)}`,
          );
          setLocStatus("done");
        });
    }
    setStep(2);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && step === 1 && (
        <Step1CategoryPicker
          key="step1"
          onClose={handleClose}
          onNext={(category, icon) => {
            setSelectedCategory(category);
            setSelectedIcon(icon);
            setStep(2);
            if (locStatus === "idle") handleUseLocation();
          }}
        />
      )}

      {isOpen && step === 2 && (
        <Step2DetailsForm
          key="step2"
          selectedCategory={selectedCategory}
          coords={coords}
          locStatus={locStatus}
          location={location}
          errors={errors}
          addressLine1={addressLine1}
          addressLine2={addressLine2}
          description={description}
          guestName={guestName}
          guestContact={guestContact}
          session={session}
          photoPreviews={photoPreviews}
          fileRef={fileRef}
          isSubmitting={isSubmitting}
          onBack={() => setStep(1)}
          onOpenMap={() => {
            setTempCoords(coords ?? { lat: 15.5415, lng: 121.0509 });
            setStep(3);
          }}
          onAddressLine1Change={setAddressLine1}
          onAddressLine2Change={setAddressLine2}
          onDescriptionChange={setDescription}
          onGuestNameChange={setGuestName}
          onGuestContactChange={setGuestContact}
          onPhotoChange={handlePhotoChange}
          onPhotoRemove={handlePhotoRemove}
          onSubmit={handleSubmit}
          setErrors={setErrors}
        />
      )}

      {isOpen && step === 3 && (
        <Step3MapPicker
          key="step3"
          tempCoords={tempCoords}
          location={location}
          onBack={() => setStep(2)}
          onTempCoordsChange={setTempCoords}
          onConfirm={handleConfirmPin}
          onRecenter={handleUseLocation}
        />
      )}

      {isOpen && step === 4 && (
        <Step4Success key="step4" onClose={handleClose} />
      )}
    </AnimatePresence>
  );
}

export default ReportModal;
