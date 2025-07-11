"use client";

import { BaseData } from "@/types/types";
import React, { useState } from "react";
import PokemonCard from "./PokemonCard";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface PokemonSearchProps {
  pokemon: BaseData[];
  sortType: string;
}

export default function PokemonSearch({ pokemon, sortType }: PokemonSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter Pokemon based on search query (name or type)
  const filteredPokemon = pokemon.filter((p) => {
    const query = searchQuery.toLowerCase();

    // Check if name matches
    if (p.name.toLowerCase().includes(query)) {
      return true;
    }    // Check if any type matches
    const types = Array.isArray(p.types) ? p.types : [p.types];
    if (types.some((type: string) => type.toLowerCase().includes(query))) {
      return true;
    }

    // Check if any form type matches
    if (p.forms) {
      for (const formName in p.forms) {
        const formTypes = Array.isArray(p.forms[formName].types)
          ? p.forms[formName].types
          : [p.forms[formName].types];

        if (formTypes.some((type: string) => type.toLowerCase().includes(query))) {
          return true;
        }
      }
    }

    return false;
  });

  return (
    <>
      <div className="grid w-full items-center gap-3">
        <Label htmlFor="pokemon-search">
          Search Pokémon
        </Label>
        <Input
        id="pokemon-search"
          placeholder="Search by name or type..."
          className="mb-18 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {filteredPokemon.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No Pokémon found matching your search.</p>
      ) : (
        <ul className="grid gap-2 md:gap-8 grid-cols-2 md:grid-cols-3">
          {filteredPokemon.map((p) => (
            <li key={p.name}>
              <PokemonCard pokemon={p} sortType={sortType} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
