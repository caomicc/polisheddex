"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MoveRow, LocationListItem } from "@/components/pokemon";
import {
  LocationEntryProps,
  MoveDetail,
  FormData,
  EvolutionMethod,
  Move,
} from "@/types/types";
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export default function PokemonFormClient({
  forms,
  allFormData,
  moveDescData,
  pokemonName,
}: {
  forms: string[];
  allFormData: Record<string, FormData>;
  moveDescData: Record<string, MoveDetail>;
  pokemonName: string;
}) {
  const [selectedForm, setSelectedForm] = useState("default");
  const formData = allFormData[selectedForm] || allFormData["default"];

  console.log("Form Data:", formData);

  return (
    <>
      {forms.length > 0 && (
        <div className="mb-4">
          <label className="font-semibold mr-2">Form:</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
          >
            <option value="default">Default</option>
            {forms.map((form) => (
              <option key={form} value={form}>
                {form}
              </option>
            ))}
          </select>
        </div>
      )}
      {/* Sprite Display */}
      <div className="mb-4 flex items-center gap-4">
        {formData.frontSpriteUrl ? (
          <Image
            src={formData.frontSpriteUrl ?? ""}
            alt={`Sprite of Pokémon ${pokemonName}`}
            width={64}
            height={64}
            className="w-16 h-16"
          />
        ) : (
          <span className="text-gray-400">No sprite available</span>
        )}
      </div>
      {/* Evolution Info */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-1">
          Type
          {Array.isArray(formData.types) && formData.types.length > 1
            ? "s"
            : ""}
        </h2>
        <div className="flex gap-2">
          {Array.isArray(formData.types) ? (
            formData.types.map((type: string) => (
              <span
                key={type}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono text-sm"
              >
                {type}
              </span>
            ))
          ) : (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono text-sm">
              {formData.types}
            </span>
          )}
        </div>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-1">Evolution Chain</h2>
        {formData.evolution ? (
          <div className="mb-2 flex flex-wrap gap-2 items-center">
            {formData.evolution.chain.map((name: string, i: number) => (
              <React.Fragment key={name}>
                <span className="px-2 py-1 rounded bg-gray-100 font-mono">
                  <Link
                    href={`/pokemon/${name}`}
                    className="hover:underline text-blue-700"
                  >
                    {name}
                  </Link>
                </span>
                {i < (formData.evolution?.chain.length ?? 0) - 1 && (
                  <span className="mx-1">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No evolution data.</div>
        )}
        {formData.evolution && formData.evolution.methods.length > 0 && (
          <div className="mt-2">
            <h3 className="font-semibold">Evolution Methods:</h3>
            <ul className="list-disc ml-6">
              {formData.evolution.methods.map(
                (m: EvolutionMethod, idx: number) => (
                  <li key={idx}>
                    <span className="font-mono">
                      {m.method.replace("EVOLVE_", "").toLowerCase()}
                    </span>
                    {m.parameter !== null && (
                      <>
                        :{" "}
                        <span className="font-mono">{String(m.parameter)}</span>
                      </>
                    )}
                    {m.form && (
                      <>
                        (form: <span className="font-mono">{m.form}</span>)
                      </>
                    )}
                    {m.target && (
                      <>
                        → <span className="font-mono">{m.target}</span>
                      </>
                    )}
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </div>
      {/* Moves List */}
      <h2 className="text-xl font-semibold mb-2">Moves</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="attheader cen align-middle text-center">
              Level
            </TableHead>
            <TableHead className="attheader cen align-middle text-left">
              Attack Name
            </TableHead>
            <TableHead className="attheader cen align-middle text-center">
              Type
            </TableHead>
            <TableHead className="attheader cen align-middle text-center">
              Cat.
            </TableHead>
            <TableHead className="attheader cen align-middle text-center">
              Att.
            </TableHead>
            <TableHead className="attheader cen align-middle text-center">
              Acc.
            </TableHead>
            <TableHead className="attheader cen align-middle text-center">
              PP
            </TableHead>
            <TableHead className="attheader cen align-middle text-center">
              Effect %
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formData.moves.flatMap((moveData: Move) => {
            const moveInfo = moveDescData[moveData.name] || null;
            return (
              <MoveRow
                key={`move-${moveData.name}-${moveData.level}`}
                name={moveData.name}
                level={moveData.level}
                info={moveInfo}
              />
            );
          })}
        </TableBody>
      </Table>
      <h2 className="text-xl font-semibold mt-6 mb-2">Egg Moves</h2>
      {formData.eggMoves && formData.eggMoves.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cen align-middle text-center attheader">
                Level
              </TableHead>
              <TableHead className="cen align-middle text-center attheader">
                Attack Name
              </TableHead>
              <TableHead className="cen align-middle text-center attheader">
                Type
              </TableHead>
              <TableHead className="cen align-middle text-center attheader">
                Cat.
              </TableHead>
              <TableHead className="cen align-middle text-center attheader">
                Att.
              </TableHead>
              <TableHead className="cen align-middle text-center attheader">
                Acc.
              </TableHead>
              <TableHead className="cen align-middle text-center attheader">
                PP
              </TableHead>
              <TableHead className="cen align-middle text-center attheader">
                Effect %
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formData.eggMoves.flatMap((moveName: string) => {
              const moveInfo = moveDescData[moveName] || null;
              return (
                <MoveRow
                  key={`egg-${moveName}`}
                  name={moveName}
                  level={1}
                  info={moveInfo}
                />
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-gray-400 text-sm mb-6">No egg moves</div>
      )}
      <h2 className="text-xl font-semibold mt-6 mb-2">Locations</h2>
      {formData.locations && formData.locations.length > 0 ? (
        <div className="mb-6">
          <ul className="divide-y divide-gray-200">
            {formData.locations.map((loc: LocationEntryProps, idx: number) => (
              <LocationListItem
                key={idx}
                area={loc.area}
                method={loc.method}
                time={loc.time}
                level={loc.level}
                chance={loc.chance}
                rareItem={loc.rareItem}
              />
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-gray-400 text-sm mb-6">No location data</div>
      )}
    </>
  );
}
