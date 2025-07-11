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
    <div className="max-w-5xl mx-auto p-6 min-h-screen flex flex-col">
      <div className="mb-4 spacing-y-2">
        <h1 className="text-3xl font-bold">PolishedDex</h1>
        <p>A companion dex for Polished Crystal</p>
      </div>

      <div className="mb-4 spacing-y-2">
        <h2 className="text-xl font-bold">What are you looking for?</h2>
      </div>

      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
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

        {/* TODO: */}
        {/* <Link href="/items" className="group">
          <Card className="p-6 h-full transition hover:shadow-lg hover:border-blue-500">
            <h2 className="text-2xl font-bold mb-3 group-hover:text-blue-700">Item Database</h2>
            <p className="text-gray-600 mb-4">
              Browse all items, their effects, and where to find them.
            </p>
            <span className="text-blue-600 font-medium group-hover:underline">
              Browse Items &rarr;
            </span>
          </Card>
        </Link> */}
      </div>
    </div>
  );
}
