import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { MoveDescription } from '@/types/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Hero } from '@/components/ui/Hero';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import MoveRow from '@/components/pokemon/MoveRow';

export default async function PokemonList(
  {
    // searchParams,
  }: {
    searchParams: Promise<{ sort?: string }>;
  },
) {
  // Read the JSON file at build time
  const filePath = path.join(process.cwd(), 'output/manifests/moves.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Prepare an array of Pokémon with their names and dex numbers
  const moveList: MoveDescription[] = Object.values(data) as MoveDescription[];

  return (
    <>
      <Hero
        headline={'Moves'}
        className="text-white"
        description={'Browse all moves available in Pokémon Polished Crystal'}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="hover:underline text-white hover:text-slate-200">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Moves</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />

      <div className="max-w-xl md:max-w-4xl mx-auto md:p-4">
        <Table>
          <TableHeader className={'hidden md:table-header-group'}>
            <TableRow>
              {/* <TableHead className="attheader cen align-middle text-left w-[60px]">Level</TableHead> */}
              <TableHead className="attheader cen align-middle text-left w-[180px]">
                Attack Name
              </TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">Type</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">Cat.</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">Att.</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">Acc.</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">PP</TableHead>
              {/* <TableHead className="attheader cen align-middle text-left w-[80px]">
                Effect %
              </TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {moveList.map((moveData: MoveDescription) => {
              const name = moveData.name || '-';
              const info = {
                type: moveData?.type || '-',
                category: moveData?.category || '-',
                power: moveData?.power || '--',
                accuracy: moveData?.accuracy || '--',
                pp: moveData?.pp || '--',
                description: moveData?.description || 'No description found.',
              };
              return <MoveRow key={moveData.name} name={name} info={info} />;
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

// Generate metadata for SEO and social sharing
export async function generateMetadata(
  {
    // searchParams,
  }: {
    searchParams: Promise<{ sort?: string }>;
  },
) {
  // const { sort = 'johtodex' } = (await searchParams) ?? {};

  // const sortType =
  //   sort === 'nationaldex' ? 'National Dex' : sort === 'johtodex' ? 'Johto Dex' : 'Alphabetical';

  const title = `Moves | PolishedDex`;
  const description = `Browse all moves available in Pokémon Polished Crystal`;
  const url = `https://polisheddex.com/moves`;

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal',
      'pokedex',
      'pokemon list',
      'pokemon database',
      'polisheddex',
      // sortType.toLowerCase(),
      'pokemon stats',
      'pokemon types',
      'pokemon evolutions',
    ],

    // Open Graph metadata for Facebook, Discord, etc.
    openGraph: {
      title,
      description,
      url,
      siteName: 'PolishedDex',
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `Moves - PolishedDex`,
        },
      ],
      locale: 'en_US',
    },

    // Twitter Card metadata
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
      creator: '@polisheddex',
      site: '@polisheddex',
    },

    // Additional metadata
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Canonical URL
    alternates: {
      canonical: url,
    },
  };
}
