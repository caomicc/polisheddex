import React from 'react';
// import { PokemonType } from '@/types/types';
import { Badge } from '../ui/badge';
import PokemonFormSelect from './pokemon-form-select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import Link from 'next/link';
import { Hero } from '../ui/Hero';

const PokedexHeader = ({
  formData,
  uniqueForms,
  pokemonName,
  selectedForm,
  setSelectedForm,
}: {
  formData: {
    name: string;
    nationalDex: number;
    types: string[];
    species: string;
    description: string;
  };
  uniqueForms: string[];
  pokemonName: string;
  selectedForm: string;
  setSelectedForm: React.Dispatch<React.SetStateAction<string>>;
  breadcrumbs?: React.ReactNode;
}) => {
  return (
    <Hero
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" className="pokemon-breadcrumb-inactive">
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="pokemon-breadcrumb-inactive" />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/pokemon" className="pokemon-breadcrumb-inactive">
                  Pokemon
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="pokemon-breadcrumb-inactive" />
            <BreadcrumbItem>
              <BreadcrumbPage className="capitalize pokemon-breadcrumb-active">
                {pokemonName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
      types={
        <div className="flex flex-wrap gap-2" aria-label="Pokemon Types" role="group">
          {(() => {
            const types = formData.types;
            if (!types) return <Badge variant="secondary">Unknown</Badge>;
            const typeArray = Array.isArray(types) ? types : [types];
            return typeArray.map((type: string) => (
              <Badge key={type} variant={type.toLowerCase()}>
                {type}
              </Badge>
            ));
          })()}
        </div>
      }
      image={`/sprites/pokemon/${pokemonName.toLowerCase().replace(/-/g, '_')}${selectedForm && selectedForm !== 'plain' ? `_${selectedForm.toLowerCase().replace(/-/g, '_')}` : ''}/normal_front.png`}
      form={selectedForm}
      headline={pokemonName}
    >
      <div className="flex flex-col flex-wrap items-start gap-2 ">
        {uniqueForms.length > 1 && (
          <PokemonFormSelect
            selectedForm={selectedForm}
            setSelectedForm={setSelectedForm}
            uniqueForms={uniqueForms}
            classes="md:absolute md:right-0 md:bottom-6 md:w-[200px] w-full"
          />
        )}
      </div>
    </Hero>
  );
};

export default PokedexHeader;
