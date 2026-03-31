"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignaturePad } from "@/components/shared/SignaturePad";
import { ArrowLeft, Download, PenLine, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

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

const STATUS_MAP: Record<string, { label: string; dot: string; text: string }> = {
  draft: { label: "Draft", dot: "bg-slate-400", text: "text-slate-600 bg-slate-50 border border-slate-200" },
  pending: { label: "Pending Signature", dot: "bg-yellow-500", text: "text-yellow-700 bg-yellow-50 border border-yellow-200" },
  signed: { label: "Signed", dot: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50 border border-emerald-200" },
  expired: { label: "Expired", dot: "bg-red-500", text: "text-red-700 bg-red-50 border border-red-200" },
  cancelled: { label: "Cancelled", dot: "bg-slate-400", text: "text-slate-500 bg-slate-50 border border-slate-200" },
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
        toast.success("Signature saved successfully.");
      } else {
        toast.error("Failed to save signature.");
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
        <Header title="Contract Detail" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" strokeWidth={1.5} />
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout>
        <Header title="Contract Detail" />
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-[13px]">
          Contract not found.
        </div>
      </DashboardLayout>
    );
  }

  const statusConf = STATUS_MAP[contract.status] ?? STATUS_MAP.draft;

  return (
    <DashboardLayout>
      <Header title="Contract Detail" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 text-muted-foreground text-[13px]">
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back
            </Button>
            <div className="flex gap-2">
              {contract.status !== "signed" && contract.status !== "expired" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-[13px]"
                  onClick={() => setShowSignPad(true)}
                >
                  <PenLine className="w-3.5 h-3.5" strokeWidth={1.5} /> Sign
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-1.5 text-[13px]" onClick={handlePrint}>
                <Download className="w-3.5 h-3.5" strokeWidth={1.5} /> Print / PDF
              </Button>
            </div>
          </div>

          <div id="contract-print" className="border rounded-lg bg-card overflow-hidden">

            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h1 className="text-base font-semibold">{contract.title}</h1>
              <Badge variant="outline" className={`rounded-md text-[11px] font-normal gap-1.5 ${statusConf.text}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                {statusConf.label}
              </Badge>
            </div>

            <div className="px-6 py-5 space-y-5">

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Member Info</h3>
                  <div className="space-y-1.5">
                    <Row label="Name" value={contract.userId?.name} />
                    <Row label="Email" value={contract.userId?.email} />
                    {contract.userId?.phone && (
                      <Row label="Phone" value={contract.userId.phone} />
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Contract Info</h3>
                  <div className="space-y-1.5">
                    <Row label="Start" value={formatDate(contract.startDate)} />
                    <Row label="End" value={formatDate(contract.endDate)} />
                    <Row label="Amount" value={formatCurrency(contract.amount)} bold />
                  </div>
                </div>
              </div>

              <div className="border-t" />

              <div>
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Terms</h3>
                <div className="bg-muted/30 border rounded-md p-3 text-[13px] leading-relaxed whitespace-pre-wrap">
                  {contract.terms}
                </div>
              </div>

              {contract.notes && (
                <div>
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Notes</h3>
                  <p className="text-[13px] text-muted-foreground">{contract.notes}</p>
                </div>
              )}

              <div className="border-t" />

              <div>
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Signature</h3>

                {showSignPad ? (
                  <div className="border rounded-md p-4">
                    {saving ? (
                      <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                        <span className="text-[13px]">Saving…</span>
                      </div>
                    ) : (
                      <SignaturePad onSave={handleSign} onCancel={() => setShowSignPad(false)} />
                    )}
                  </div>
                ) : contract.signatureData ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span className="text-[13px] font-medium">
                        Signed
                        {contract.signedAt && (
                          <span className="text-muted-foreground font-normal ml-1.5 text-[11px]">
                            ({formatDate(contract.signedAt)})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="border rounded-md p-3 inline-block">
                      <img
                        src={contract.signatureData}
                        alt="Signature"
                        className="max-h-20 max-w-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-md p-6 text-center">
                    <PenLine className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1.5" strokeWidth={1.5} />
                    <p className="text-[13px] text-muted-foreground">No signature yet.</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Click the &quot;Sign&quot; button above to add a signature.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

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

function Row({ label, value, bold }: { label: string; value?: string; bold?: boolean }) {
  return (
    <div className="flex gap-2 text-[13px]">
      <span className="text-muted-foreground w-14 shrink-0">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value ?? "-"}</span>
    </div>
  );
}
