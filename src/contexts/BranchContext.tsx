"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface Branch {
  _id: string;
  name: string;
  code: string;
}

interface BranchContextValue {
  branches: Branch[];
  selectedBranchId: string | null;
  selectedBranch: Branch | null;
  setSelectedBranchId: (id: string | null) => void;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextValue>({
  branches: [],
  selectedBranchId: null,
  selectedBranch: null,
  setSelectedBranchId: () => {},
  isLoading: false,
});

const STORAGE_KEY = "hq_selected_branch";

export function BranchProvider({ children, isHQ }: { children: ReactNode; isHQ: boolean }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setSelectedBranchId = useCallback((id: string | null) => {
    setSelectedBranchIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!isHQ) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSelectedBranchIdState(saved);

    setIsLoading(true);
    fetch("/api/branches")
      .then((r) => r.json())
      .then((data) => {
        setBranches(data.branches ?? []);
        // Validate saved selection still exists
        if (saved && !data.branches?.find((b: Branch) => b._id === saved)) {
          setSelectedBranchId(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, [isHQ, setSelectedBranchId]);

  const selectedBranch = branches.find((b) => b._id === selectedBranchId) ?? null;

  return (
    <BranchContext.Provider value={{ branches, selectedBranchId, selectedBranch, setSelectedBranchId, isLoading }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  return useContext(BranchContext);
}
