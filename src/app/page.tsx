import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto p-6 min-h-screen flex flex-col gap-6">
      <div className="mb-4 spacing-y-2">
        <h1 className="text-3xl font-bold">PolishedDex</h1>
        <p>A companion dex for Polished Crystal</p>
      </div>
      <div>
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4">
        <Link href="/pokemon" className="group">
          <Card className="">
            <CardHeader>
              <CardTitle>Pokémon Database</CardTitle>
            </CardHeader>
            <CardContent>
              <p> Browse all Pokémon, their types, evolutions, moves, and where to find them.</p>
            </CardContent>
            <CardFooter>
              <CardAction className="text-blue-600 font-medium group-hover:underline">
                View Pokémon &rarr;
              </CardAction>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/locations" className="group">
          <Card>
            <CardHeader>
              <CardTitle>Location Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Explore all areas in the game and discover which Pokémon you can find in each
                location.
              </p>
            </CardContent>
            <CardFooter>
              <CardAction className="text-blue-600 font-medium group-hover:underline">
                View Locations &rarr;
              </CardAction>
            </CardFooter>
          </Card>
        </Link>
      </div>
    </div>
    <div>
      <h2 className="text-xl mb-4 font-bold">Current Roadmap</h2>
      <div className="">
      <ol className="relative border-s border-border pl-6 space-y-8">
        <li className="flex items-start gap-4">
        <div>
          <h3 className="font-semibold text-lg">Item Database</h3>
          <p className="text-foreground/80 text-sm">
          Browse all items, their effects, and where to find them.
          </p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
          Planned
          </span>
        </div>
        </li>
        <li className="flex items-start gap-4">
          <div>
            <h3 className="font-semibold text-lg">Better Location Handling</h3>
            <p className="text-foreground/80 text-sm">
            Add details to locations, confirm & update Hidden Grottos to not have label and consolidation issues.
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
              Planned
            </span>
          </div>
          </li>
          <li className="flex items-start gap-4">
          <div>
            <h3 className="font-semibold text-lg">Move Database</h3>
            <p className="text-foreground/80 text-sm">
            Browse all moves, their effects, and type advantages vs disadvantages.
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
            Planned
            </span>
          </div>
          </li>
           <li className="flex items-start gap-4">
            <div>
              <h3 className="font-semibold text-lg">Team Picker for Type Match-ups</h3>
              <p className="text-foreground/80 text-sm">
                A tool to help you build a team based on type match-ups, weaknesses, and resistances for Pokemon and types specific to Polished Crystal.
              </p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                Idea
              </span>
            </div>
            </li>
          <li className="flex items-start gap-4">
          <div>
            <h3 className="font-semibold text-lg">Game Mechanics Guide</h3>
            <p className="text-foreground/80 text-sm">
            A guide to the game mechanics, including battle mechanics, breeding, and more.
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
            Idea
            </span>
            <span className="block text-muted-foreground text-xs mt-1 ml-1">
            *This may just default to wiki information instead of living on site, TBD
            </span>
          </div>
          </li>
          <li className="flex items-start gap-4">
          <div>
            <h3 className="font-semibold text-lg">Faithful vs. Polished</h3>
            <p className="text-foreground/80 text-sm">
            A guide to the differences between the two versions, including changes in graphics, mechanics, and more.
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
            Idea
            </span>
            <span className="block text-muted-foreground text-xs mt-1 ml-1">
            *Another instance of this may just default to wiki information instead of living on site, TBD
            </span>
          </div>
          </li>
        </ol>
        </div>
      </div>
    </div>
  );
}
