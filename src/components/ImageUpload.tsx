"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploadProps {
  onUpload: (path: string) => void;
  current?: string | null;
  label?: string;
}

export default function ImageUpload({ onUpload, current, label = "Upload image" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json() as { path?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      if (data.path) onUpload(data.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-orange-400 transition"
        onClick={() => inputRef.current?.click()}
      >
        {current ? (
          <div className="relative h-32 w-full">
            <Image src={current} alt="Uploaded" fill className="object-contain rounded-lg" />
          </div>
        ) : (
          <div className="text-gray-400">
            <p className="text-2xl mb-1">📷</p>
            <p className="text-sm">{uploading ? "Uploading..." : label}</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
