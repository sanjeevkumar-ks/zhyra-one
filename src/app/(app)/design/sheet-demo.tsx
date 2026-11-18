"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Sheet } from "@/components/ui-client";

export function DesignSheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Open side sheet</Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Keyword details" subtitle="Contextual panels replace most modals" footer={<Button onClick={() => setOpen(false)}>Add to content planner</Button>}>
        <p className="text-sm text-muted">Detail views open in a right-hand sheet that already knows the selected keyword, page or article.</p>
      </Sheet>
    </>
  );
}
