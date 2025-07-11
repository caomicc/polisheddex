import Link from "next/link";
import fs from "fs";
import path from "path";
import { BaseData } from "@/types/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import PokemonSearch from "@/components/pokemon/PokemonSearch";

export default async function PokemonList({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  // Read the JSON file at build time
  const filePath = path.join(process.cwd(), "pokemon_base_data.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const { sort = "johtodex" } = (await searchParams) ?? {};

  // Determine sort type from query param
  const sortType =
    sort === "nationaldex"
      ? "nationaldex"
      : sort === "johtodex"
      ? "johtodex"
      : "alphabetical";

  // Prepare an array of Pokémon with their names and dex numbers
  const pokemonList: BaseData[] = Object.values(data) as BaseData[];

  // Sort based on selected sort type
  const sortedPokemon = [...pokemonList].sort((a, b) => {
    if (sortType === "alphabetical") {
      return a.name.localeCompare(b.name);
    }
    if (sortType === "nationaldex") {
      return (
        (a.nationalDex ?? 0) - (b.nationalDex ?? 0) ||
        a.name.localeCompare(b.name)
      );
    }
    if (sortType === "johtodex") {
      return (
        (a.johtoDex ?? 999) - (b.johtoDex ?? 999) ||
        a.name.localeCompare(b.name)
      );
    }
    return 0;
  });

  return (
    <div className="max-w-xl md:max-w-4xl mx-auto p-4">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="hover:underline text-blue-700">
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Pokemon</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-bold mb-8">Pokémon List</h1>
      <div className="mb-16 flex gap-4">
        <SortLink label="Johto Dex" sort="johtodex" current={sortType} />
        <SortLink label="National Dex" sort="nationaldex" current={sortType} />
        <SortLink label="Alphabetical" sort="alphabetical" current={sortType} />
      </div>
      <PokemonSearch pokemon={sortedPokemon} sortType={sortType} />
    </div>
  );
}

function SortLink({
  label,
  sort,
  current,
}: {
  label: string;
  sort: string;
  current: string;
}) {
  return (
    <Link
      href={`?sort=${sort}`}
      aria-current={current === sort ? "page" : undefined}
    >
      <Button variant={current === sort ? "default" : "outline"} asChild>
        <span>{label}</span>
      </Button>
    </Link>
  );
}
