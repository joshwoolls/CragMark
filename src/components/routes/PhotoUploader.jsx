import React, { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, AlertCircle } from "lucide-react";

const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1200;
const JPEG_QUALITY = 0.75;

export default function PhotoUploader({ onUpload, isUploading }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [error, setError] = useState("");

  const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result;
      };

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Draw to canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              console.log(`Compressed ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB (${Math.round((1 - blob.size / file.size) * 100)}% reduction)`);
              resolve(compressedFile);
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          "image/jpeg",
          JPEG_QUALITY
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setError("");

    try {
      // Compress the image before uploading
      const compressedFile = await compressImage(file);
      onUpload(compressedFile);
    } catch (err) {
      console.error("Image compression failed:", err);
      setError("Failed to process image. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 px-6">
      <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center">
        <Camera className="w-9 h-9 text-zinc-500" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Capture the Wall</h2>
        <p className="text-zinc-500 text-sm mt-1">Take a photo or upload an image of the climbing wall</p>
        <p className="text-zinc-600 text-xs mt-2">Images are automatically compressed to save storage</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-4 py-2.5 rounded-xl">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {isUploading ? (
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Uploading...</span>
        </div>
      ) : (
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-medium py-3.5 rounded-xl transition-colors"
          >
            <Camera className="w-5 h-5" />
            Camera
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-3.5 rounded-xl transition-colors"
          >
            <ImagePlus className="w-5 h-5" />
            Gallery
          </button>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}