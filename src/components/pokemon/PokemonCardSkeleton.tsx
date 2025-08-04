import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function PokemonCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-8" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="w-12 h-12 md:w-20 md:h-20 rounded-lg" />
          <div className="flex gap-1">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PokemonGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul className="grid gap-4 md:gap-8 grid-cols-2 md:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <PokemonCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
