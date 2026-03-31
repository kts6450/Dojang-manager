"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check } from "lucide-react";
import SignaturePadLib from "signature_pad";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // 캔버스 크기 설정
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(ratio, ratio);

    padRef.current = new SignaturePadLib(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "#1e293b",
      minWidth: 1.5,
      maxWidth: 3,
    });

    padRef.current.addEventListener("beginStroke", () => setIsEmpty(false));

    return () => {
      padRef.current?.off();
    };
  }, []);

  function handleClear() {
    padRef.current?.clear();
    setIsEmpty(true);
  }

  function handleSave() {
    if (!padRef.current || padRef.current.isEmpty()) return;
    const dataUrl = padRef.current.toDataURL("image/png");
    onSave(dataUrl);
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-500 font-medium">서명을 아래 영역에 그려주세요</div>
      <div className="relative border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full touch-none"
          style={{ height: "160px", cursor: "crosshair" }}
        />
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <span className="text-[10px] text-slate-300 pointer-events-none">서명란</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleClear}>
          <RotateCcw className="w-3.5 h-3.5" /> 지우기
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={onCancel}>취소</Button>
        <Button
          size="sm"
          className="gap-1.5 bg-blue-600 hover:bg-blue-700"
          onClick={handleSave}
          disabled={isEmpty}
        >
          <Check className="w-3.5 h-3.5" /> 서명 완료
        </Button>
      </div>
    </div>
  );
}
