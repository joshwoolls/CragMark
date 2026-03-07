import React, { useRef } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";

export default function PhotoUploader({ onUpload, isUploading }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(file);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 px-6">
      <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center">
        <Camera className="w-9 h-9 text-zinc-500" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Capture the Wall</h2>
        <p className="text-zinc-500 text-sm mt-1">Take a photo or upload an image of the climbing wall</p>
      </div>

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