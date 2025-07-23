import React from 'react';
import { cn } from '@/lib/utils';
import { FormData, PokemonType } from '@/types/types';
import { Badge } from '../ui/badge';
import PokemonFormSelect from './PokemonFormSelect';
import { getTypeGradientProps } from '@/utils/css-gradients';
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
  usePolished,
}: {
  formData: FormData;
  uniqueForms: string[];
  pokemonName: string;
  selectedForm: string;
  setSelectedForm: React.Dispatch<React.SetStateAction<string>>;
  usePolished: boolean;
  breadcrumbs?: React.ReactNode;
}) => {
  // Desktop version uses the original two-row layout

  // Mobile version uses a compact layout with each row
  // Determine which types to use for the gradient: faithful (original) or polished (updated)
  // const usePolished = selectedForm === 'polished' || selectedForm === 'updated'; // Adjust this logic if you have a more explicit trigger
  const faithfulTypes = Array.isArray(formData.types)
    ? formData.types
    : [formData.types].filter(Boolean);
  const polishedTypes = Array.isArray(formData.updatedTypes)
    ? formData.updatedTypes
    : [formData.updatedTypes].filter(Boolean);

  // Use selected types based on trigger
  const [primaryType, secondaryType] =
    usePolished && polishedTypes.length > 0 ? polishedTypes : faithfulTypes;

  const gradientProps = primaryType
    ? getTypeGradientProps(primaryType.toLowerCase(), secondaryType?.toLowerCase())
    : { className: '', style: {} };

  return (
    <Hero
      style={gradientProps.style}
      className={cn(
        gradientProps.className,
        'pt-24 md:pb-[26px] shadow-lg',
        `shadow-${secondaryType?.toLowerCase() || primaryType?.toLowerCase()}`,
      )}
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
      image={formData.frontSpriteUrl}
      headline={pokemonName}
    >
      <div className="flex flex-row flex-wrap md:flex-row items-start md:items-center gap-2 md:gap-6">
        <div className={'md:h-[60px]'}>
          <label className="leading-none text-xs w-[50px]">Faithful:</label>
          <div className="flex flex-wrap gap-2" aria-label="Pokemon Types" role="group">
            {formData.types ? (
              Array.isArray(formData.types) ? (
                formData.types.map((type: string) => (
                  <Badge key={type} variant={type.toLowerCase() as PokemonType['name']}>
                    {type}
                  </Badge>
                ))
              ) : (
                <Badge
                  key={formData.types}
                  variant={formData.types.toLowerCase() as PokemonType['name']}
                >
                  {formData.types}
                </Badge>
              )
            ) : (
              <Badge variant="secondary">Unknown</Badge>
            )}
          </div>
        </div>
        <div>
          <div className={'md:h-[60px]'}>
            <label className="leading-none text-xs w-[50px]">Polished:</label>
            <div className="flex flex-wrap gap-2" aria-label="Pokemon Types" role="group">
              {formData.updatedTypes ? (
                Array.isArray(formData.updatedTypes) ? (
                  formData.updatedTypes.map((type: string) => (
                    <Badge key={type} variant={type.toLowerCase() as PokemonType['name']}>
                      {type}
                    </Badge>
                  ))
                ) : (
                  <Badge
                    key={formData.updatedTypes}
                    variant={formData.updatedTypes.toLowerCase() as PokemonType['name']}
                  >
                    {formData.types}
                  </Badge>
                )
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
        {uniqueForms.length > 0 && (
          <PokemonFormSelect
            selectedForm={selectedForm}
            setSelectedForm={setSelectedForm}
            uniqueForms={uniqueForms}
          />
        )}
      </div>
    </Hero>
  );
};

export default PokedexHeader;
