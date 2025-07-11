import { BaseData, PokemonType } from "@/types/types";
import Link from "next/link";
import React from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import Image from "next/image";

export interface PokemonCardProps {
  pokemon: BaseData;
  sortType?: string;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, sortType = "nationaldex" }) => (
  <Link href={`/pokemon/${encodeURIComponent(pokemon.name)}`}>
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 text-center border-0 mt-8 relative pt-[64px]">
      <Image
        src={pokemon.frontSpriteUrl ?? "/images/pokemon-placeholder.png"}
        alt={`${pokemon.name} sprite`}
        width={64}
        height={64}
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      />
      <div className="flex flex-col gap-0">
        <p className="font-bold">
          #{sortType === "johtodex"
            ? (pokemon.johtoDex !== null && pokemon.johtoDex < 999 ? pokemon.johtoDex : "—")
            : (pokemon.nationalDex !== null ? pokemon.nationalDex : "—")}
        </p>
        <h2 className="text-xl mb-5 font-bold">{pokemon.name}</h2>
        <div className="flex justify-center gap-2">
          {(Array.isArray(pokemon.types) ? pokemon.types : [pokemon.types]).map(
            (type) => (
              <Badge
                key={type}
                variant={type.toLowerCase() as PokemonType["name"]}
              >
                {type}
              </Badge>
            )
          )}
        </div>
      </div>
    </Card>
  </Link>
);

export default PokemonCard;
