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
    <div className="max-w-4xl mx-auto p-6 min-h-screen flex flex-col gap-6">
      <div className="mb-4 spacing-y-2">
        <h1 className="text-3xl font-bold">PolishedDex</h1>
        <p>A companion dex for Polished Crystal</p>
      </div>
      <div>
      <div className="flex flex-col sm:flex-row sm:space-x-12 space-y-4">
        <div className='flex flex-col'>
        <h2 className="text-xl mb-4 font-bold">Links:</h2>
          <div className="flex flex-col space-y-6">
            <Link href="/pokemon" className="group">
              <Card className="gap-2 py-4 md:py-6">
                <CardHeader className="px-4 md:px-6">
                  <CardTitle>Pokémon Database</CardTitle>
                </CardHeader>
                <CardContent className='text-sm px-4 md:px-6'>
                  <p> Browse all Pokémon, their types, evolutions, moves, and where to find them.</p>
                </CardContent>
                <CardFooter className='text-sm px-4 md:px-6'>
                  <CardAction className="text-blue-600 font-medium group-hover:underline">
                    View Pokémon &rarr;
                  </CardAction>
                </CardFooter>
              </Card>
            </Link>

            <Link href="/locations" className="group">
              <Card className="gap-2 py-4 md:py-6">
                <CardHeader className="px-4 md:px-6">
                  <CardTitle>Location Guide</CardTitle>
                </CardHeader>
                <CardContent className='text-sm px-4 md:px-6'>
                  <p>
                    Explore all areas in the game and discover which Pokémon you can find in each
                    location.
                  </p>
                </CardContent>
                <CardFooter className='text-sm px-4 md:px-6'>
                  <CardAction className="text-blue-600 font-medium group-hover:underline">
                    View Locations &rarr;
                  </CardAction>
                </CardFooter>
              </Card>
            </Link>
            <Link href="/items" className="group">
              <Card className="gap-2 py-4 md:py-6">
                <CardHeader className="px-4 md:px-6">
                  <CardTitle>Item Guide</CardTitle>
                </CardHeader>
                <CardContent className='text-sm px-4 md:px-6'>
                  <p>
                    Explore all items in the game and discover their effects and locations.
                  </p>
                </CardContent>
                <CardFooter className='text-sm px-4 md:px-6'>
                  <CardAction className="text-blue-600 font-medium group-hover:underline">
                    View Items &rarr;
                  </CardAction>
                </CardFooter>
              </Card>
            </Link>
          </div>
        </div>
      <div className="">
        <h2 className="text-xl mb-4 font-bold">Current Roadmap</h2>
      <ol className="relative border-s border-border pl-6 space-y-8">
        <li className="flex items-start gap-4">
          <div>
            <h3 className="font-semibold text-lg">Polished vs Faithful checks</h3>
            <p className="text-foreground/80 text-sm">
              Still handling some differences between the two versions, such as movesets and naming conventions.
            </p>
            <span className="block text-muted-foreground text-xs mt-1 ml-1">
              At this point I have spent more time on this than actually playing the game. I built this because I wanted a guide to help me play the game, and I am still working on it to make it better for myself and others.
            </span>
            <span className="block text-muted-foreground font-medium text-xs mt-1 ml-1">
              I appreciate the patience as I work through the differences between the faithful vs polished versions of the game. I do understand that the perspective of this not being ready for use because of the differences not beging fully documented but I am only one person and I am trying very hard!
            </span>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
              In Progress
            </span>
          </div>
        </li>
        <li className="flex items-start gap-4">
        <div>
          <h3 className="font-semibold text-lg">Item Database</h3>
          <p className="text-foreground/80 text-sm">
           Browse all items, their effects, and where to find them.
          </p>

          <span className="block text-muted-foreground text-xs mt-1 ml-1">
            *Basic item data is available, but not formatted.
          </span>
          <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
            In Progress
          </span>
        </div>
        </li>
        <li className="flex items-start gap-4">
          <div>
            <h3 className="font-semibold text-lg">Better Location Handling</h3>
            <p className="text-foreground/80 text-sm">
              Add details to locations, such as items found, Pokémon available, move tutors, and more.
            </p>
            <span className="block text-muted-foreground text-xs mt-1 ml-1">
              *Currently only basic location data is available + not all locations are included (cough, Pokemon found through headbutt)
            </span>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
              In Progress
            </span>
          </div>
          </li>
          <li className="flex items-start gap-4">
            <div>
              <h3 className="font-semibold text-lg">Move Database</h3>
              <p className="text-foreground/80 text-sm">
                Browse all moves, their effects, and type advantages vs disadvantages.
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
              Planned
              </span>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div>
              <h3 className="font-semibold text-lg">Update UI</h3>
              <p className="text-foreground/80 text-sm">
                Improve UI for better usability and aesthetics while being mobile focused.
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                Ongoing
              </span>
            </div>
          </li>
           <li className="flex items-start gap-4">
            <div>
              <h3 className="font-semibold text-lg">Team Picker for Type Match-ups</h3>
              <p className="text-foreground/80 text-sm">
                A tool to help you build a team based on type match-ups, weaknesses, and resistances for Pokemon and types specific to Polished Crystal.
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
              Planned
              </span>
            </div>
            </li>
          <li className="flex items-start gap-4">
          <div>
            <h3 className="font-semibold text-lg">Game Mechanics Guide</h3>
            <p className="text-foreground/80 text-sm">
            A guide to the game mechanics, including battle mechanics, breeding, and more.
            </p>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
            Idea
            </span>
            <span className="block text-muted-foreground text-xs mt-1 ml-1">
            *This may just default to wiki information instead of living on site, TBD
            </span>
          </div>
          </li>
        </ol>
        </div>
      </div>
    </div>
    <div className="max-w-xl mx-auto mt-8">

      </div>
    </div>
  );
}
