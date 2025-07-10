import React from "react";
import { TableCell, TableRow } from "../ui/table";
import { cn } from "@/lib/utils";
import { Move } from "@/types/types";

const MoveRow: React.FC<Move> = ({ name, level, info }) => [
  <TableRow key={`row-${name}-${level}`} className="hover:bg-muted/50">
    <TableCell rowSpan={2} className="fooinfo align-middle font-semibold">
      {level ?? "—"}
    </TableCell>
    <TableCell rowSpan={2} className="fooinfo align-middle font-medium">
      {name}
    </TableCell>
    <TableCell className="cen align-middle text-center">
      {/* Replace with type icon if available */}
      {info?.type ?? "-"}
    </TableCell>
    <TableCell className="cen align-middle text-center">
      {/* Replace with category icon if available */}
      {info?.category ?? "-"}
    </TableCell>
    <TableCell className="cen align-middle text-center">
      {info?.power ?? "--"}
    </TableCell>
    <TableCell className="cen align-middle text-center">
      {info?.accuracy ?? "--"}
    </TableCell>
    <TableCell className="cen align-middle text-center">
      {info?.pp ?? "--"}
    </TableCell>
    <TableCell className="cen align-middle text-center">
      {info?.effectPercent ?? "--"}
    </TableCell>
  </TableRow>,
  <TableRow key={`desc-${name}-${level}`}>
    <TableCell
      className={cn(
        "fooinfo text-muted-foreground",
        !info?.description?.trim() && "text-error"
      )}
      colSpan={8}
    >
      {info?.description?.trim() ? info.description : "No description found."}
    </TableCell>
  </TableRow>,
];

export default MoveRow;
