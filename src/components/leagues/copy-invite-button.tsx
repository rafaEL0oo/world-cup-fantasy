"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CopyInviteButtonProps {
  code: string;
}

export function CopyInviteButton({ code }: CopyInviteButtonProps) {
  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    toast.success("Invite code copied");
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy}>
      <Copy className="size-4" />
      Copy
    </Button>
  );
}
