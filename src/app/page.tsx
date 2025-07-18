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
      <div className="mb-4 spacing-y-2">
        <h2 className="text-xl font-bold">What are you looking for?</h2>
      </div>

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
      <h2 className="text-xl mb-4 font-bold">Roadmap Features:</h2>
      <ul className="w-full space-y-3 text-foreground list-disc dark:text-gray-400">
          <li className="flex items-center text-md">
              {/* <svg className="w-3.5 h-3.5 me-2 text-green-500 dark:text-green-400 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
              </svg> */}
              Item Database - Browse all items, their effects, and where to find them.
          </li>
          <li className="flex items-center text-md">
              {/* <svg className="w-3.5 h-3.5 me-2 text-green-500 dark:text-green-400 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
              </svg> */}
              Move Database - Browse all moves, their effects, and type advantages vs disadvantages.
          </li>
          <li className="flex items-center text-md">
              {/* <svg className="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
              </svg> */}
              <span>
                Game Mechanics Guide - A guide to the game mechanics, including battle mechanics, breeding, and more.<span className="text-muted-foreground dark:text-muted-background text-xs block ml-4">*This may just default to wiki information instead of living on site, TBD</span>
              </span>
          </li>
          <li className="flex items-center text-md">
              {/* <svg className="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
              </svg> */}
              <span>
                Faithful vs. Polished - A guide to the differences between the two versions, including changes in graphics, mechanics, and more.<span className="text-muted-foreground dark:text-muted-background text-xs block ml-4">*Another instances of this may just default to wiki information instead of living on site, TBD</span>
              </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
