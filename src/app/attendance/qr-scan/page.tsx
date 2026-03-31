"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, AlertCircle, ScanLine, Camera, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ScanResult = {
  success: boolean;
  alreadyChecked?: boolean;
  message: string;
  user?: { name: string; belt: string };
};

const BELT_LABELS: Record<string, string> = {
  white: "White", yellow: "Yellow", orange: "Orange", green: "Green",
  blue: "Blue", purple: "Purple", red: "Red", brown: "Brown", black: "Black",
};
const BELT_COLORS: Record<string, string> = {
  white: "bg-white border border-slate-200", yellow: "bg-yellow-400", orange: "bg-orange-400",
  green: "bg-green-500", blue: "bg-blue-500", purple: "bg-purple-500",
  red: "bg-red-500", brown: "bg-amber-800", black: "bg-slate-900",
};

const CLASS_TYPES = ["General", "Poomsae", "Sparring", "Self-defense", "Kids", "Adults", "After School"];

export default function QRScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScannedRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  const [classType, setClassType] = useState("General");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
      }
    } catch {
      setError("Camera access is required. Please allow camera permissions in your browser settings.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  useEffect(() => {
    if (!scanning) return;

    let animId: number;

    async function scanFrame() {
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
        animId = requestAnimationFrame(scanFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);

      if ("BarcodeDetector" in window) {
        try {
          // @ts-expect-error BarcodeDetector is not in TS lib yet
          const detector = new BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0) {
            const value = barcodes[0].rawValue as string;
            await handleQRCode(value);
          }
        } catch {
          // BarcodeDetector failed silently
        }
      }

      animId = requestAnimationFrame(scanFrame);
    }

    animId = requestAnimationFrame(scanFrame);
    return () => cancelAnimationFrame(animId);
  }, [scanning]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleQRCode(value: string) {
    const now = Date.now();
    if (value === lastScannedRef.current && now - lastScannedTimeRef.current < 3000) return;
    lastScannedRef.current = value;
    lastScannedTimeRef.current = now;

    let memberId = "";
    if (value.startsWith("dojang:")) {
      const parts = value.split(":");
      memberId = parts[2] ?? "";
    } else {
      memberId = value;
    }

    if (!memberId) {
      setResult({ success: false, message: "Invalid QR code." });
      return;
    }

    try {
      const res = await fetch("/api/attendance/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, classType }),
      });
      const data = await res.json();
      setResult(data);
      setTimeout(() => setResult(null), 4000);
    } catch {
      setResult({ success: false, message: "A network error occurred." });
    }
  }

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <DashboardLayout>
      <Header title="QR Attendance" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-lg mx-auto space-y-4">

          <div className="border rounded-md px-4 py-3 flex items-center gap-3">
            <ScanLine className="w-4 h-4 text-muted-foreground/60 shrink-0" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Class Type</p>
              <Select value={classType} onValueChange={setClassType}>
                <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden bg-slate-950 aspect-video relative">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />

            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Camera className="w-7 h-7 text-white/40" strokeWidth={1.5} />
                <p className="text-white/50 text-[13px]">Start the camera to scan a QR code</p>
                <Button onClick={startCamera} size="sm" className="h-8 text-[13px]">
                  Start Camera
                </Button>
              </div>
            )}

            {scanning && (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-44 h-44 relative">
                    <span className="absolute top-0 left-0 w-7 h-7" style={{ borderTop: "2px solid rgba(148,163,184,0.7)", borderLeft: "2px solid rgba(148,163,184,0.7)", borderTopLeftRadius: 4 }} />
                    <span className="absolute top-0 right-0 w-7 h-7" style={{ borderTop: "2px solid rgba(148,163,184,0.7)", borderRight: "2px solid rgba(148,163,184,0.7)", borderTopRightRadius: 4 }} />
                    <span className="absolute bottom-0 left-0 w-7 h-7" style={{ borderBottom: "2px solid rgba(148,163,184,0.7)", borderLeft: "2px solid rgba(148,163,184,0.7)", borderBottomLeftRadius: 4 }} />
                    <span className="absolute bottom-0 right-0 w-7 h-7" style={{ borderBottom: "2px solid rgba(148,163,184,0.7)", borderRight: "2px solid rgba(148,163,184,0.7)", borderBottomRightRadius: 4 }} />
                    <div className="absolute inset-x-0 top-1/2 h-px bg-white/30 animate-ping" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopCamera}
                    className="h-7 text-[11px] bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Stop Camera
                  </Button>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2.5 border border-red-200 rounded-md px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" strokeWidth={1.5} />
              <p className="text-[13px] text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div
              className={cn(
                "rounded-md px-4 py-3 border transition-all",
                result.success
                  ? "border-emerald-200 bg-emerald-50/50"
                  : result.alreadyChecked
                  ? "border-yellow-200 bg-yellow-50/50"
                  : "border-red-200 bg-red-50/50"
              )}
            >
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" strokeWidth={1.5} />
                ) : result.alreadyChecked ? (
                  <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0" strokeWidth={1.5} />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500 shrink-0" strokeWidth={1.5} />
                )}
                <div>
                  {result.user && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[15px] font-semibold text-foreground">{result.user.name}</span>
                      <div className="flex items-center gap-1">
                        <span className={cn("w-2.5 h-2.5 rounded-full", BELT_COLORS[result.user.belt ?? "white"])} />
                        <span className="text-[11px] text-muted-foreground">{BELT_LABELS[result.user.belt ?? "white"]}</span>
                      </div>
                    </div>
                  )}
                  <p className={cn(
                    "text-[13px] font-medium",
                    result.success ? "text-emerald-700" : result.alreadyChecked ? "text-yellow-700" : "text-red-700"
                  )}>
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="border rounded-md px-3 py-2.5">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-muted-foreground/60 mt-0.5 shrink-0" strokeWidth={1.5} />
              <div className="text-[11px] text-muted-foreground space-y-0.5">
                <p className="font-medium text-foreground">How to use QR check-in</p>
                <p>1. Print or display the QR code from Members &rarr; Member Details.</p>
                <p>2. Scan the member&apos;s QR code with the camera above for automatic check-in.</p>
                <p>3. Chrome or Edge browsers with BarcodeDetector API support are recommended.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
