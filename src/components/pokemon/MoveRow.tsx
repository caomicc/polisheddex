import React from "react";
import { TableCell, TableRow } from "../ui/table";
import { cn } from "@/lib/utils";
import { Move, PokemonType } from "@/types/types";
import { Badge } from "../ui/badge";
import Image from "next/image";

const MoveRow: React.FC<Move> = ({ name, level, info }) => [
  <TableRow
    key={`row-${name}-${level}`}
    className="hover:bg-muted/50 border-b-0"
  >
    <TableCell rowSpan={2} className="fooinfo align-middle font-semibold">
      {level ?? "—"}
    </TableCell>
    <TableCell rowSpan={2} className="fooinfo align-middle font-medium">
      {name}
    </TableCell>
    <TableCell className="cen align-middle text-left">
      {/* Replace with type icon if available */}
      <Badge
        variant={String(info?.type ?? "-").toLowerCase() as PokemonType["name"]}
      >
        {info?.type ? String(info.type) : "-"}
      </Badge>
    </TableCell>
    <TableCell className="cen align-middle text-left">
      {/* Replace with category icon if available */}
      <Image
        src={`/sprites/attack-${info?.category}.svg`}
        alt={info?.category ?? "Unknown Category"}
        width={16}
        height={16}
        className="inline-block"
      />
    </TableCell>
    <TableCell className="cen align-middle text-left">
      {info?.power ?? "--"}
    </TableCell>
    <TableCell className="cen align-middle text-left">
      {info?.accuracy ?? "--"}
    </TableCell>
    <TableCell className="cen align-middle text-left">
      {info?.pp ?? "--"}
    </TableCell>
    <TableCell className="cen align-middle text-left">
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
