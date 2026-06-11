"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface ClaimInfo {
  code: string;
  status: string;
  claimedAt: string;
  usedAt?: string;
  offer: { title: string; discount: number; validTo: string };
  consumer: { name?: string | null; email: string };
}

export default function ScanPage() {
  const t = useTranslations("scan");
  const [code, setCode] = useState("");
  const [claim, setClaim] = useState<ClaimInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      scanFrame();
    } catch {
      setCameraError("Caméra inaccessible. Utilisez la saisie manuelle.");
    }
  }

  function scanFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) { rafRef.current = requestAnimationFrame(scanFrame); return; }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    import("jsqr").then(({ default: jsQR }) => {
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      if (result?.data) {
        // Extract code from URL if needed (e.g. /scan?code=xxx)
        const match = result.data.match(/[?&]code=([^&]+)/);
        const scannedCode = match ? match[1] : result.data;
        stopCamera();
        setCode(scannedCode);
        void lookupCode(scannedCode);
      } else {
        rafRef.current = requestAnimationFrame(scanFrame);
      }
    });
  }

  async function lookupCode(codeValue: string) {
    if (!codeValue.trim()) return;
    setLoading(true);
    setError("");
    setClaim(null);
    setValidated(false);
    const res = await fetch(`/api/scan?code=${encodeURIComponent(codeValue.trim())}`);
    const data = await res.json() as ClaimInfo & { error?: string };
    setLoading(false);
    if (!res.ok) { setError(data.error ?? t("invalidCode")); return; }
    setClaim(data);
  }

  async function lookup() {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setClaim(null);
    setValidated(false);

    const res = await fetch(`/api/scan?code=${encodeURIComponent(code.trim())}`);
    const data = await res.json() as ClaimInfo & { error?: string };
    setLoading(false);

    if (!res.ok) { setError(data.error ?? t("invalidCode")); return; }
    setClaim(data);
  }

  async function validate() {
    if (!claim) return;
    setLoading(true);
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: claim.code }),
    });
    const data = await res.json() as { error?: string };
    setLoading(false);
    if (!res.ok) { setError(data.error ?? t("failedValidate")); return; }
    setValidated(true);
    setClaim((c) => c ? { ...c, status: "used" } : c);
  }

  const expired = claim ? new Date(claim.offer.validTo) < new Date() : false;
  const alreadyUsed = claim?.status === "used";

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("enterCode")}
        </label>
        <div className="flex gap-2 mb-3">
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            placeholder={t("placeholder")}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono text-sm"
          />
          <button onClick={lookup} disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-60">
            {t("check")}
          </button>
        </div>

        {!scanning ? (
          <button
            onClick={startCamera}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-orange-400 text-gray-600 hover:text-orange-500 px-4 py-2.5 rounded-lg text-sm font-medium transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t("scanWithCamera")}
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="w-full text-sm text-gray-500 hover:text-red-500 transition"
          >
            {t("closeCamera")}
          </button>
        )}

        {cameraError && (
          <p className="text-xs text-red-500 mt-2">{cameraError}</p>
        )}
      </div>

      {scanning && (
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 mb-6 bg-black">
          <video ref={videoRef} className="w-full rounded-2xl" playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-52 h-52 border-2 border-orange-400 rounded-xl opacity-70" />
          </div>
          <p className="absolute bottom-3 left-0 right-0 text-center text-white text-xs opacity-80">
            {t("pointAtQR")}
          </p>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
          ✗ {error}
        </div>
      )}

      {claim && (
        <div className={`rounded-2xl border p-6 ${
          validated || alreadyUsed ? "bg-gray-50 border-gray-200" :
          expired ? "bg-red-50 border-red-200" :
          "bg-green-50 border-green-200"
        }`}>
          <div className="mb-4">
            <p className="text-lg font-bold text-gray-900">{claim.offer.title}</p>
            <p className="text-orange-500 font-semibold text-xl">-{claim.offer.discount}%</p>
            <p className="text-sm text-gray-500 mt-1">
              {t("customer", { name: claim.consumer.name ?? claim.consumer.email })}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {t("validUntil", { date: new Date(claim.offer.validTo).toLocaleDateString() })}
            </p>
          </div>

          {validated ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-green-700 font-semibold">{t("validated")}</p>
            </div>
          ) : alreadyUsed ? (
            <div className="bg-gray-100 rounded-xl p-4 text-center text-gray-500">
              {t("alreadyUsed", { date: new Date(claim.usedAt!).toLocaleDateString() })}
            </div>
          ) : expired ? (
            <div className="bg-red-100 rounded-xl p-4 text-center text-red-600">
              {t("offerExpired")}
            </div>
          ) : (
            <button onClick={validate} disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
              {loading ? t("validating") : t("validate")}
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-6">
        {t("footer")}
      </p>
    </div>
  );
}
