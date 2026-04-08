"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, AlertTriangle, History } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, runAfterOverlayTransition } from "@/lib/utils";

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

interface InventoryLogRow {
  _id: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason?: string;
  date: string;
  createdAt?: string;
}

const CATEGORY_MAP: Record<string, string> = {
  uniform: "Uniform", equipment: "Equipment", book: "Textbook", merchandise: "Merchandise", other: "Other",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<{ id: string; name: string; qty: number } | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ id: string; name: string } | null>(null);
  const [historyLogs, setHistoryLogs] = useState<InventoryLogRow[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
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

  useEffect(() => {
    if (!historyTarget) {
      setHistoryLogs([]);
      setHistoryTotal(0);
      return;
    }
    setHistoryLoading(true);
    fetch(`/api/inventory/${historyTarget.id}/logs?limit=100`)
      .then((r) => r.json())
      .then((data) => {
        setHistoryLogs(Array.isArray(data.logs) ? data.logs : []);
        setHistoryTotal(typeof data.total === "number" ? data.total : 0);
      })
      .catch(() => {
        setHistoryLogs([]);
        setHistoryTotal(0);
        toast.error("Failed to load history.");
      })
      .finally(() => setHistoryLoading(false));
  }, [historyTarget]);

  async function handleCreate() {
    if (!form.name) { toast.error("Please enter an item name."); return; }
    const res = await fetch("/api/inventory", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantity: Number(form.quantity), minQuantity: Number(form.minQuantity), price: Number(form.price) }),
    });
    if (res.ok) {
      toast.success("Item has been added.");
      setShowDialog(false);
      setForm({ name: "", category: "uniform", quantity: "0", minQuantity: "0", price: "0", supplier: "", sku: "", description: "" });
      runAfterOverlayTransition(() => fetchItems());
    }
  }

  async function handleAdjust() {
    if (!adjustTarget || !adjustValue) return;
    const res = await fetch(`/api/inventory/${adjustTarget.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adjustment: Number(adjustValue), reason: adjustReason }),
    });
    if (res.ok) {
      toast.success("Inventory has been updated.");
      setAdjustTarget(null);
      setAdjustValue("");
      setAdjustReason("");
      runAfterOverlayTransition(() => fetchItems());
    } else {
      const err = await res.json();
      toast.error(err.error || "An error occurred");
    }
  }

  const lowStock = items.filter(i => i.quantity <= i.minQuantity);

  return (
    <>
      <Header title="Inventory Management" />
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {lowStock.length > 0 && (
          <div className="border border-amber-200 rounded-md px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <span className="text-[13px] text-amber-700 font-medium">{lowStock.length} item{lowStock.length > 1 ? "s" : ""} low on stock</span>
              <p className="text-[11px] text-amber-500 mt-0.5">{lowStock.map(i => i.name).join(", ")}</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <p className="text-[13px] text-slate-500">{items.length} items</p>
          <Button onClick={() => setShowDialog(true)} size="sm">
            <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} /> Add Item
          </Button>
        </div>

        <div className="border border-slate-200 rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200">
                <TableHead className="text-xs text-slate-500 font-medium h-8">Item</TableHead>
                <TableHead className="text-xs text-slate-500 font-medium h-8">Category</TableHead>
                <TableHead className="text-xs text-slate-500 font-medium h-8">SKU</TableHead>
                <TableHead className="text-xs text-slate-500 font-medium h-8">Stock</TableHead>
                <TableHead className="text-xs text-slate-500 font-medium h-8">Min</TableHead>
                <TableHead className="text-xs text-slate-500 font-medium h-8">Price</TableHead>
                <TableHead className="text-xs text-slate-500 font-medium h-8">Supplier</TableHead>
                <TableHead className="text-xs text-slate-500 font-medium h-8 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-400 text-[13px]">
                    <Package className="w-5 h-5 mx-auto mb-1.5 text-slate-300" strokeWidth={1.5} />
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const isLow = item.quantity <= item.minQuantity;
                  return (
                    <TableRow key={item._id} className="border-b border-slate-100">
                      <TableCell className="py-2">
                        <span className="text-[13px] font-medium text-slate-800">{item.name}</span>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="rounded-md text-[11px] font-medium border-slate-200 text-slate-600">
                          {CATEGORY_MAP[item.category] ?? item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-400 py-2">{item.sku || "—"}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[13px] font-medium ${isLow ? "text-amber-600" : "text-slate-800"}`}>
                            {item.quantity}
                          </span>
                          {isLow && (
                            <AlertTriangle className="w-3 h-3 text-amber-500" strokeWidth={1.5} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-400 py-2">{item.minQuantity}</TableCell>
                      <TableCell className="text-[13px] text-slate-600 py-2">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-[13px] text-slate-400 py-2">{item.supplier || "—"}</TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => setHistoryTarget({ id: item._id, name: item.name })}
                            className="h-6 text-[11px] px-2"
                          >
                            <History className="w-3 h-3 mr-1" strokeWidth={1.5} />
                            History
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            onClick={() => setAdjustTarget({ id: item._id, name: item.name, qty: item.quantity })}
                            className="h-6 text-[11px] px-2"
                          >
                            Adjust
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-[15px]">Add Item</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Item Name *</Label>
              <Input className="h-8 text-[13px]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Category</Label>
                <Select value={form.category} onValueChange={(v) => v !== null && setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">SKU</Label>
                <Input className="h-8 text-[13px]" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Initial Stock</Label>
                <Input className="h-8 text-[13px]" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Min Stock</Label>
                <Input className="h-8 text-[13px]" type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Unit Price ($)</Label>
                <Input className="h-8 text-[13px]" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Supplier</Label>
              <Input className="h-8 text-[13px]" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adjustTarget} onOpenChange={() => setAdjustTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-[15px]">Adjust Stock — {adjustTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-[13px] text-slate-500">Current stock: <span className="font-medium text-slate-800">{adjustTarget?.qty}</span></p>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Adjustment (+ inbound, - outbound)</Label>
              <Input
                className="h-8 text-[13px]"
                type="number" value={adjustValue}
                onChange={(e) => setAdjustValue(e.target.value)}
                placeholder="+10 or -5"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Reason</Label>
              <Input className="h-8 text-[13px]" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Restock, sold, damaged, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAdjustTarget(null)}>Cancel</Button>
            <Button size="sm" onClick={handleAdjust}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyTarget} onOpenChange={() => setHistoryTarget(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Stock history — {historyTarget?.name}</DialogTitle>
            <p className="text-[11px] text-slate-500 font-normal">
              {historyTotal} record{historyTotal !== 1 ? "s" : ""} (in / out from adjustments)
            </p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 border border-slate-200 rounded-md">
            {historyLoading ? (
              <p className="text-[13px] text-slate-400 text-center py-8">Loading…</p>
            ) : historyLogs.length === 0 ? (
              <p className="text-[13px] text-slate-400 text-center py-8">No movement logs yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="text-xs h-8">Date</TableHead>
                    <TableHead className="text-xs h-8">Type</TableHead>
                    <TableHead className="text-xs h-8">Qty</TableHead>
                    <TableHead className="text-xs h-8">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLogs.map((log) => (
                    <TableRow key={log._id} className="border-b border-slate-100">
                      <TableCell className="text-[12px] py-1.5">{formatDate(log.date)}</TableCell>
                      <TableCell className="text-[12px] py-1.5 capitalize">{log.type}</TableCell>
                      <TableCell className="text-[12px] py-1.5 font-medium">{log.quantity}</TableCell>
                      <TableCell className="text-[12px] text-slate-500 py-1.5">{log.reason || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
