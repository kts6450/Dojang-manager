"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, AlertCircle, ScanLine, Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ScanResult = {
  success: boolean;
  alreadyChecked?: boolean;
  message: string;
  user?: { name: string; belt: string };
};

const BELT_LABELS: Record<string, string> = {
  white: "흰띠", yellow: "노란띠", orange: "주황띠", green: "초록띠",
  blue: "파란띠", purple: "보라띠", red: "빨간띠", brown: "갈색띠", black: "검정띠",
};
const BELT_COLORS: Record<string, string> = {
  white: "bg-white border-2 border-slate-200", yellow: "bg-yellow-400", orange: "bg-orange-400",
  green: "bg-green-500", blue: "bg-blue-500", purple: "bg-purple-500",
  red: "bg-red-500", brown: "bg-amber-800", black: "bg-slate-900",
};

const CLASS_TYPES = ["일반 수업", "품새", "겨루기", "호신술", "어린이반", "성인반", "방과후"];

export default function QRScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const lastScannedRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  const [classType, setClassType] = useState("일반 수업");
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
      setError("카메라 접근 권한이 필요합니다. 브라우저 설정에서 카메라를 허용해주세요.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
    scanningRef.current = false;
  }

  useEffect(() => {
    if (!scanning) return;

    let animId: number;
    const { Html5QrcodeScanner: _, ...zxing } = {} as Record<string, unknown>;
    void zxing;

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

      // BarcodeDetector API (Chrome/Edge 지원)
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
          // BarcodeDetector 오류는 무시
        }
      }

      animId = requestAnimationFrame(scanFrame);
    }

    animId = requestAnimationFrame(scanFrame);
    return () => cancelAnimationFrame(animId);
  }, [scanning]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleQRCode(value: string) {
    const now = Date.now();
    // 같은 QR코드는 3초 이내 재처리 방지
    if (value === lastScannedRef.current && now - lastScannedTimeRef.current < 3000) return;
    lastScannedRef.current = value;
    lastScannedTimeRef.current = now;

    // QR 값 파싱: "dojang:memberId:xxxx" 형식
    let memberId = "";
    if (value.startsWith("dojang:")) {
      const parts = value.split(":");
      memberId = parts[2] ?? "";
    } else {
      memberId = value; // 단순 memberId인 경우
    }

    if (!memberId) {
      setResult({ success: false, message: "올바르지 않은 QR 코드입니다." });
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
      // 3초 후 결과 초기화
      setTimeout(() => setResult(null), 4000);
    } catch {
      setResult({ success: false, message: "네트워크 오류가 발생했습니다." });
    }
  }

  // 수동 입력으로 테스트
  async function handleManualTest(memberId: string) {
    if (!memberId.trim()) return;
    await handleQRCode(memberId.trim());
  }

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <DashboardLayout>
      <Header title="QR 출결 체크" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto space-y-4">

          {/* 수업 종류 선택 */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <ScanLine className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700 mb-1.5">수업 종류</p>
              <Select value={classType} onValueChange={setClassType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 카메라 뷰 */}
          <div className="bg-slate-950 rounded-2xl overflow-hidden aspect-video relative shadow-lg">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <p className="text-white/60 text-sm">카메라를 시작해 QR 코드를 스캔하세요</p>
                <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700">
                  카메라 시작
                </Button>
              </div>
            )}

            {scanning && (
              <>
                {/* 스캔 가이드 박스 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 relative">
                    <span className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-blue-400 rounded-tl" style={{ borderTopWidth: 3, borderLeftWidth: 3 }} />
                    <span className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-blue-400 rounded-tr" style={{ borderTopWidth: 3, borderRightWidth: 3 }} />
                    <span className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-blue-400 rounded-bl" style={{ borderBottomWidth: 3, borderLeftWidth: 3 }} />
                    <span className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-blue-400 rounded-br" style={{ borderBottomWidth: 3, borderRightWidth: 3 }} />
                    {/* 스캔 라인 애니메이션 */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-400/60 animate-ping" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopCamera}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    카메라 중지
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 스캔 결과 */}
          {result && (
            <div
              className={cn(
                "rounded-xl p-5 border transition-all",
                result.success
                  ? "bg-emerald-50 border-emerald-200"
                  : result.alreadyChecked
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-red-50 border-red-200"
              )}
            >
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                ) : result.alreadyChecked ? (
                  <AlertCircle className="w-8 h-8 text-yellow-500 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500 shrink-0" />
                )}
                <div>
                  {result.user && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-slate-800">{result.user.name}</span>
                      <div className="flex items-center gap-1">
                        <span className={cn("w-3 h-3 rounded-full", BELT_COLORS[result.user.belt ?? "white"])} />
                        <span className="text-xs text-slate-500">{BELT_LABELS[result.user.belt ?? "white"]}</span>
                      </div>
                    </div>
                  )}
                  <p className={cn(
                    "text-sm font-medium",
                    result.success ? "text-emerald-700" : result.alreadyChecked ? "text-yellow-700" : "text-red-700"
                  )}>
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 안내 */}
          <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-600 space-y-1">
            <p className="font-semibold">📱 QR 코드 사용 방법</p>
            <p>1. 회원 관리 → 회원 상세에서 QR 코드를 출력하거나 화면에 표시합니다.</p>
            <p>2. 위 카메라로 회원의 QR 코드를 스캔하면 자동으로 출석 체크됩니다.</p>
            <p>3. BarcodeDetector API를 지원하는 Chrome, Edge 브라우저를 권장합니다.</p>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
