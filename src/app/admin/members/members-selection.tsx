"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Lightweight client-side selection store shared between MembersTable
// (which owns the row checkboxes + context menu) and MembersActionsMenu
// (whose Export menu item flips between "Export all members" and
// "Export N members" based on the current selection). Anchor is the
// last-clicked row id, kept here so Shift-range select survives a
// state reset triggered from the dropdown.

type Ctx = {
  selected: Set<string>;
  setSelected: (next: Set<string>) => void;
  anchor: string | null;
  setAnchor: (id: string | null) => void;
};

const MembersSelectionContext = createContext<Ctx | null>(null);

export function MembersSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [anchor, setAnchor] = useState<string | null>(null);

  const value = useMemo<Ctx>(
    () => ({ selected, setSelected, anchor, setAnchor }),
    [selected, anchor],
  );

  return (
    <MembersSelectionContext.Provider value={value}>
      {children}
    </MembersSelectionContext.Provider>
  );
}

export function useMembersSelection(): Ctx {
  const v = useContext(MembersSelectionContext);
  if (!v) {
    throw new Error(
      "useMembersSelection must be used inside <MembersSelectionProvider>",
    );
  }
  return v;
}
