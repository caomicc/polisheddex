import React from "react";
import { TableCell, TableRow } from "../ui/table";
import { cn } from "@/lib/utils";
import { Move, PokemonType } from "@/types/types";
import { Badge } from "../ui/badge";
import TypeIcon from "./TypeIcon";
import MoveCategoryIcon from "./MoveCategoryIcon";

const MoveRow: React.FC<Move> = ({ name, level, info }) => {
  // Desktop version uses the original two-row layout
  const desktopRows = [
    <TableRow
      key={`row-${name}-${level}`}
      className="hover:bg-muted/50 border-b-0 group hidden md:table-row"
    >
      <TableCell
        rowSpan={2}
        className="align-middle font-semibold w-12 p-2 "
      >
        {level ?? "—"}
      </TableCell>

      <TableCell
        rowSpan={2}
        className="align-middle font-medium p-2 "
      >
        {name}
      </TableCell>

      <TableCell className="align-middle p-2 ">
        <Badge
          variant={String(info?.type ?? "-").toLowerCase() as PokemonType["name"]}
          className="w-full md:w-auto text-center"
        >
          {info?.type ? String(info.type) : "-"}
        </Badge>
      </TableCell>

      <TableCell className="align-middle p-2 ">
        <MoveCategoryIcon category={info?.category || ''} className={'w-6 h-6'} />
      </TableCell>

      <TableCell className="align-middle p-2 ">
        {info?.power ?? "--"}
      </TableCell>

      <TableCell className="align-middle p-2 ">
        {info?.accuracy ?? "--"}
      </TableCell>

      <TableCell className="align-middle p-2 ">
        {info?.pp ?? "--"}
      </TableCell>

      <TableCell className="align-middle p-2">
        {info?.effectPercent ?? "--"}
      </TableCell>
    </TableRow>,
    <TableRow key={`desc-${name}-${level}-desktop`} className="group-hover:bg-muted/50 hidden md:table-row">
      <TableCell
        className={cn(
          "text-muted-foreground text-sm p-2 pb-4",
          !info?.description?.trim() && "text-error"
        )}
        colSpan={8}
      >
        {info?.description?.trim() ? info.description : "No description found."}
      </TableCell>
    </TableRow>,
  ];

  // Mobile version uses a compact layout with each row
  const mobileRows = [
    <TableRow
      key={`row-${name}-${level}-mobile`}
      className="hover:bg-muted/50 border-b-0 md:hidden"
    >
      {/* Mobile combined cell for level and name */}
      <TableCell className="align-middle p-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Lv. {level ?? "—"}</span>
          <span className="font-bold">{name}</span>
        </div>
      </TableCell>

      {/* Power - Always visible */}
      <TableCell className="align-middle p-2 text-center w-16">
        {/* <span className="font-medium text-xs text-muted-foreground mr-1">PWR</span> */}
        <span>{info?.power ?? "--"}</span>
        /
        <span>{info?.accuracy ?? "--"}</span>

      </TableCell>
      {/* Type - Always visible */}
      <TableCell className="align-middle py-2 px-1 w-8">
        <Badge
          variant={String(info?.type ?? "-").toLowerCase() as PokemonType["name"]}
          className="hidden sm:inline-flex"
        >
          {info?.type ? String(info.type) : "-"}
        </Badge>
        <div className="sm:hidden text-center">
          {info?.type ? (
            <TypeIcon type={String(info.type)} size={20} />
          ) : (
            <span>-</span>
          )}
        </div>
      </TableCell>
      <TableCell className="align-middle py-2 w-8 px-1 text-center">
        <MoveCategoryIcon category={info?.category || ''} />
      </TableCell>
    </TableRow>,
    <TableRow key={`desc-${name}-${level}-mobile`} className="md:hidden">
      <TableCell
        className={cn(
          "text-muted-foreground text-xs px-2 pb-3 italic",
          !info?.description?.trim() && "text-error"
        )}
        colSpan={4}
      >
        {info?.description?.trim() ? info.description : "No description found."}
      </TableCell>
    </TableRow>,
  ];

  return [...mobileRows, ...desktopRows];
};

export default MoveRow;
