"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "@/components/shared/SignaturePad";
import { ArrowLeft, Download, PenLine, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Contract {
  _id: string;
  title: string;
  terms: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: string;
  signatureData?: string;
  signedAt?: string;
  notes?: string;
  userId: { _id: string; name: string; email: string; phone?: string };
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "초안", color: "bg-slate-100 text-slate-600" },
  pending: { label: "서명 대기", color: "bg-yellow-100 text-yellow-700" },
  signed: { label: "서명 완료", color: "bg-emerald-100 text-emerald-700" },
  expired: { label: "만료", color: "bg-red-100 text-red-700" },
  cancelled: { label: "취소", color: "bg-slate-100 text-slate-500" },
};

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignPad, setShowSignPad] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/contracts/${id}`)
      .then((r) => r.json())
      .then((d) => { setContract(d.contract ?? d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSign(dataUrl: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureData: dataUrl,
          status: "signed",
          signedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setContract(updated.contract ?? updated);
        setShowSignPad(false);
        toast.success("전자서명이 완료됐습니다.");
      } else {
        toast.error("서명 저장에 실패했습니다.");
      }
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Header title="계약서 상세" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout>
        <Header title="계약서 상세" />
        <div className="flex-1 flex items-center justify-center text-slate-400">
          계약서를 찾을 수 없습니다.
        </div>
      </DashboardLayout>
    );
  }

  const statusConf = STATUS_MAP[contract.status] ?? STATUS_MAP.draft;

  return (
    <DashboardLayout>
      <Header title="계약서 상세" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* 상단 액션 바 */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 text-slate-500">
              <ArrowLeft className="w-4 h-4" /> 목록으로
            </Button>
            <div className="flex gap-2">
              {contract.status !== "signed" && contract.status !== "expired" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => setShowSignPad(true)}
                >
                  <PenLine className="w-4 h-4" /> 전자서명
                </Button>
              )}
              <Button size="sm" className="gap-1.5 bg-slate-700 hover:bg-slate-800" onClick={handlePrint}>
                <Download className="w-4 h-4" /> PDF 출력
              </Button>
            </div>
          </div>

          {/* 계약서 본문 (인쇄 영역) */}
          <div id="contract-print" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

            {/* 계약서 헤더 */}
            <div className="bg-slate-50 border-b border-slate-100 px-8 py-6 text-center">
              <h1 className="text-2xl font-bold text-slate-800 mb-1">{contract.title}</h1>
              <span className={cn("text-xs font-semibold px-3 py-1 rounded-full", statusConf.color)}>
                {statusConf.label}
              </span>
            </div>

            <div className="px-8 py-6 space-y-6">

              {/* 당사자 정보 */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">회원 정보</h3>
                  <div className="space-y-1.5">
                    <div className="flex gap-2 text-sm">
                      <span className="text-slate-400 w-16 shrink-0">이름</span>
                      <span className="font-medium text-slate-700">{contract.userId?.name}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-slate-400 w-16 shrink-0">이메일</span>
                      <span className="text-slate-700">{contract.userId?.email}</span>
                    </div>
                    {contract.userId?.phone && (
                      <div className="flex gap-2 text-sm">
                        <span className="text-slate-400 w-16 shrink-0">연락처</span>
                        <span className="text-slate-700">{contract.userId.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">계약 정보</h3>
                  <div className="space-y-1.5">
                    <div className="flex gap-2 text-sm">
                      <span className="text-slate-400 w-16 shrink-0">시작일</span>
                      <span className="text-slate-700">{new Date(contract.startDate).toLocaleDateString("ko-KR")}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-slate-400 w-16 shrink-0">종료일</span>
                      <span className="text-slate-700">{new Date(contract.endDate).toLocaleDateString("ko-KR")}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-slate-400 w-16 shrink-0">금액</span>
                      <span className="font-semibold text-slate-700">₩{contract.amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* 계약 내용 */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">계약 내용</h3>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {contract.terms}
                </div>
              </div>

              {contract.notes && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">특이사항</h3>
                  <p className="text-sm text-slate-600">{contract.notes}</p>
                </div>
              )}

              <div className="border-t border-slate-100" />

              {/* 서명 영역 */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">서명</h3>

                {showSignPad ? (
                  <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30">
                    {saving ? (
                      <div className="flex items-center justify-center py-8 gap-2 text-blue-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">저장 중...</span>
                      </div>
                    ) : (
                      <SignaturePad onSave={handleSign} onCancel={() => setShowSignPad(false)} />
                    )}
                  </div>
                ) : contract.signatureData ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        전자서명 완료
                        {contract.signedAt && (
                          <span className="text-slate-400 font-normal ml-1.5">
                            ({new Date(contract.signedAt).toLocaleDateString("ko-KR")})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-3 bg-white inline-block">
                      <img
                        src={contract.signatureData}
                        alt="전자서명"
                        className="max-h-24 max-w-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                    <PenLine className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">서명이 없습니다.</p>
                    <p className="text-xs text-slate-300 mt-1">위 &apos;전자서명&apos; 버튼을 눌러 서명하세요.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 인쇄 스타일 */}
      <style jsx global>{`
        @media print {
          body > * { display: none !important; }
          #contract-print { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
          aside, header, button { display: none !important; }
        }
      `}</style>
    </DashboardLayout>
  );
}
