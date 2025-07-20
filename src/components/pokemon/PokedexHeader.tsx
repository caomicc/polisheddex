import Image from 'next/image';
import React from 'react';
import { cn } from '@/lib/utils';
import { FormData, PokemonType } from '@/types/types';
import { Badge } from '../ui/badge';
import PokemonFormSelect from './PokemonFormSelect';
import { getTypeGradientProps } from '@/utils/css-gradients';

const PokedexHeader = ({ formData, uniqueForms, pokemonName, selectedForm, setSelectedForm, usePolished } : { formData: FormData, uniqueForms: string[], pokemonName: string, selectedForm: string, setSelectedForm: React.Dispatch<React.SetStateAction<string>>, usePolished: boolean }) => {
  // Desktop version uses the original two-row layout

  // Mobile version uses a compact layout with each row
  // Determine which types to use for the gradient: faithful (original) or polished (updated)
  // const usePolished = selectedForm === 'polished' || selectedForm === 'updated'; // Adjust this logic if you have a more explicit trigger
  const faithfulTypes = Array.isArray(formData.types) ? formData.types : [formData.types].filter(Boolean);
  const polishedTypes = Array.isArray(formData.updatedTypes) ? formData.updatedTypes : [formData.updatedTypes].filter(Boolean);

  // Use selected types based on trigger
  const [primaryType, secondaryType] = usePolished && polishedTypes.length > 0 ? polishedTypes : faithfulTypes;

  const gradientProps = primaryType
    ? getTypeGradientProps(primaryType.toLowerCase(), secondaryType?.toLowerCase())
    : { className: '', style: {} };

  return (
    <>
      <div className="max-w-4xl mx-auto rounded-xl overflow-hidden hidden md:block">
        <div
          className={cn(
            'relative py-4 px-4 md:p-6 md:dark:from-gray-800 md:dark:to-gray-900 flex flex-row w-full justify-between md:justify-start gap-6',
            gradientProps.className
          )}
          style={gradientProps.style}
        >
          <div className={'md:hidden text-left'}>
            <div className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              {formData.johtoDex && (
                <p>
                  <span>Johto #{String(formData.johtoDex).padStart(3, '0')}</span>
                </p>
              )}
              <p>National #{String(formData.nationalDex).padStart(3, '0')}</p>
            </div>
            <p className="text-sm md:text-4xl font-bold capitalize text-gray-900 dark:text-gray-50">
              {pokemonName}
            </p>
            <div
              className="flex flex-col mt-2 spacing-y-2 gap-1"
              aria-label="Pokemon Faithful Types"
              role="group"
            >
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
            <div
              className="flex flex-col mt-2 spacing-y-2 gap-1"
              aria-label="Pokemon Polished Types"
              role="group"
            >
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
            {uniqueForms.length > 0 && (
              <PokemonFormSelect
                selectedForm={selectedForm}
                setSelectedForm={setSelectedForm}
                uniqueForms={uniqueForms}
                classes="block md:hidden md:ml-auto"
              />
            )}
          </div>{' '}
          <div className="w-36 p-1 md:p-0 md:w-36 md:h-auto md:mx-[initial] md:mr-0">
            <Image
              src={formData.frontSpriteUrl ?? ''}
              alt={`Sprite of Pokémon ${pokemonName}`}
              width={200}
              height={200}
              className="object-contain w-36 md:drop-shadow-xs md:w-36 md:h-auto md:mb-0"
              priority
            />
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs md:text-sm text-gray-800 dark:text-gray-200 mb-1 flex gap-3 flex-row">
              {formData.johtoDex && (
                <span>
                  Johto <span className="font-bold">#{formData.johtoDex}</span>
                </span>
              )}
              <span>
                National{' '}
                <span className="font-bold">#{String(formData.nationalDex).padStart(3, '0')}</span>
              </span>

            </div>
            <p className="text-sm md:text-xl font-bold capitalize text-gray-900 dark:text-gray-50">
              {pokemonName}
            </p>
            <div
              className="flex flex-col mt-2 spacing-y-2 md:gap-1"
              aria-label="Pokemon Faithful Types"
              role="group"
            >
              <label className="leading-none text-xs w-[50px]">Faithful:</label>
              <div className="gap-2 flex flex-wrap">
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
                  <></>
                )}
              </div>
            </div>
            <div
              className="flex flex-col mt-2 spacing-y-0 md:gap-1"
              aria-label="Pokemon Polished Types"
              role="group"
            >
              {formData.updatedTypes &&
                Array.isArray(formData.updatedTypes) &&
                formData.updatedTypes.length > 0 && (
                  <>
                    <label className="leading-none text-xs w-[50px]">Polished:</label>
                    <div className="gap-2 flex flex-wrap">
                      {formData.updatedTypes.map((type: string) => (
                        <Badge
                          key={`polished-${type}`}
                          variant={type.toLowerCase() as PokemonType['name']}
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
            </div>
          </div>
          {uniqueForms.length > 0 && (
            <PokemonFormSelect
              selectedForm={selectedForm}
              setSelectedForm={setSelectedForm}
              uniqueForms={uniqueForms}
              classes="hidden md:block md:ml-auto"
            />
          )}
        </div>
      </div>

      <div className={cn("max-w-4xl mx-auto rounded-xl overflow-hidden md:hidden p-4 mb-2",
            gradientProps.className
          )}
          style={gradientProps.style}>
        <div>
          <div className='flex flex-row items-start md:items-center gap-4 mb-2 justify-between'>
              <div className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                <p>National #{String(formData.nationalDex).padStart(3, '0')}</p>
                {formData.johtoDex && (
                  <p>
                    <span>Johto #{String(formData.johtoDex).padStart(3, '0')}</span>
                  </p>
                )}
                <p className="text-sm md:text-4xl font-bold capitalize text-gray-900 dark:text-gray-50">
                  {pokemonName}
                </p>
              </div>
              <div className='w-18'>
                <Image
                  src={formData.frontSpriteUrl ?? ''}
                  alt={`Sprite of Pokémon ${pokemonName}`}
                  width={200}
                  height={200}
                  className="object-contain w-36 md:drop-shadow-xs md:w-36 md:h-auto md:mb-0"
                  priority
              />
            </div>
        </div>
        <div className='flex flex-row gap-6'>
         <div>
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
      </div>
    </div>
    <div>
      {uniqueForms.length > 0 && (
        <PokemonFormSelect
          selectedForm={selectedForm}
          setSelectedForm={setSelectedForm}
          uniqueForms={uniqueForms}
          classes="block md:hidden md:ml-auto"
        />
      )}
    </div>
  </>
  );
};

export default PokedexHeader;
