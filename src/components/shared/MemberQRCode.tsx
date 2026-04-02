"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";
import QRCode from "qrcode";

interface MemberQRCodeProps {
  memberId: string;
  memberName: string;
  open: boolean;
  onClose: () => void;
}

export function MemberQRCode({ memberId, memberName, open, onClose }: MemberQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (!open || !memberId) return;
    // QR 코드 값: "dojang:memberId:{id}" 형식
    QRCode.toDataURL(`dojang:memberId:${memberId}`, {
      width: 300,
      margin: 2,
      color: { dark: "#1e293b", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [memberId, open]);

  function handleDownload() {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `QR_${memberName}.png`;
    a.click();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            {memberName} QR 코드
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`${memberName} QR 코드`}
              className="w-56 h-56 rounded-xl border border-slate-100 shadow-sm"
            />
          ) : (
            <div className="w-56 h-56 bg-slate-50 rounded-xl flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">{memberName}</p>
            <p className="text-xs text-slate-400 mt-0.5">QR 스캐너로 출결 체크</p>
          </div>
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={onClose}>닫기</Button>
            <Button className="flex-1 gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={handleDownload} disabled={!qrDataUrl}>
              <Download className="w-3.5 h-3.5" /> 저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
