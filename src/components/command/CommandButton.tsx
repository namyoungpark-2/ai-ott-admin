"use client";

import * as React from "react";
import { Button } from "@/components/ui";
import { CommandPalette } from "@/components/command/CommandPalette";

export function CommandButton() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Button tone="secondary" className="h-9" onClick={() => setOpen(true)}>
        ⌘K
      </Button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
