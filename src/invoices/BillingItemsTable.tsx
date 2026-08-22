import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function BillingItemsTable() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Billing Items Table</h3>
        <p className="text-xs text-muted-foreground">
          Review and manage billing items in this invoice
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter table by Part Number, Item Name or Category..."
            className="pl-9 pr-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
              >
                Select Items to Act
              </Button>
            }
          />
        </DropdownMenu>
      </div>
    </div>
  );
}

export default BillingItemsTable;
