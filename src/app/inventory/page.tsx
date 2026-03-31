"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
  supplier?: string;
  sku?: string;
  description?: string;
}

const CATEGORY_MAP: Record<string, string> = {
  uniform: "도복", equipment: "장비", book: "교재", merchandise: "상품", other: "기타",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<{ id: string; name: string; qty: number } | null>(null);
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [form, setForm] = useState({
    name: "", category: "uniform", quantity: "0",
    minQuantity: "0", price: "0", supplier: "", sku: "", description: "",
  });

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/inventory");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleCreate() {
    if (!form.name) { toast.error("품목명을 입력하세요."); return; }
    const res = await fetch("/api/inventory", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantity: Number(form.quantity), minQuantity: Number(form.minQuantity), price: Number(form.price) }),
    });
    if (res.ok) {
      toast.success("품목이 등록됐습니다.");
      setShowDialog(false);
      setForm({ name: "", category: "uniform", quantity: "0", minQuantity: "0", price: "0", supplier: "", sku: "", description: "" });
      fetchItems();
    }
  }

  async function handleAdjust() {
    if (!adjustTarget || !adjustValue) return;
    const res = await fetch(`/api/inventory/${adjustTarget.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adjustment: Number(adjustValue), reason: adjustReason }),
    });
    if (res.ok) {
      toast.success("재고가 업데이트됐습니다.");
      setAdjustTarget(null);
      setAdjustValue("");
      setAdjustReason("");
      fetchItems();
    } else {
      const err = await res.json();
      toast.error(err.error || "오류 발생");
    }
  }

  const lowStock = items.filter(i => i.quantity <= i.minQuantity);

  return (
    <DashboardLayout>
      <Header title="재고 관리" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {lowStock.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 text-sm text-orange-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span><strong>{lowStock.length}개</strong> 품목의 재고가 최소 수량 이하입니다: {lowStock.map(i => i.name).join(", ")}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">전체 {items.length}개 품목</p>
          <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> 품목 등록
          </Button>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>품목명</TableHead>
                  <TableHead>분류</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>현재 재고</TableHead>
                  <TableHead>최소 재고</TableHead>
                  <TableHead>단가</TableHead>
                  <TableHead>공급업체</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    등록된 품목이 없습니다.
                  </TableCell></TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item._id} className={`hover:bg-slate-50 ${item.quantity <= item.minQuantity ? "bg-orange-50" : ""}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell><Badge variant="outline">{CATEGORY_MAP[item.category] ?? item.category}</Badge></TableCell>
                      <TableCell className="text-sm text-slate-500">{item.sku || "-"}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${item.quantity <= item.minQuantity ? "text-orange-600" : "text-slate-800"}`}>
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{item.minQuantity}</TableCell>
                      <TableCell className="text-sm">₩{item.price.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-slate-500">{item.supplier || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm" variant="outline"
                            onClick={() => setAdjustTarget({ id: item._id, name: item.name, qty: item.quantity })}
                            className="h-7 text-xs"
                          >
                            수량조정
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>품목 등록</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>품목명 *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>분류</Label>
                <Select value={form.category} onValueChange={(v) => v !== null && setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>초기 재고</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>최소 재고</Label>
                <Input type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>단가 (원)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>공급업체</Label>
              <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>취소</Button>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adjustTarget} onOpenChange={() => setAdjustTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>재고 수량 조정 - {adjustTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-500">현재 재고: <strong>{adjustTarget?.qty}</strong></p>
            <div className="space-y-1.5">
              <Label>조정 수량 (입고: +, 출고: -)</Label>
              <Input
                type="number" value={adjustValue}
                onChange={(e) => setAdjustValue(e.target.value)}
                placeholder="+10 또는 -5"
              />
            </div>
            <div className="space-y-1.5">
              <Label>사유</Label>
              <Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="입고, 판매, 파손 등" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustTarget(null)}>취소</Button>
            <Button onClick={handleAdjust} className="bg-blue-600 hover:bg-blue-700">적용</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
