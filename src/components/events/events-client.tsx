'use client';

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { DetailCard } from '@/components/ui/detail-card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Calendar, MapPin, Gift, Ship, Bug, Scissors, Store, Waves } from 'lucide-react';

// Types for events data
interface DailyEvent {
  id: string;
  name: string;
  day: string;
  location: string;
  locationName: string;
  type: string;
  item?: string;
  itemName?: string;
  description: string;
}

interface WeeklyEvent {
  id: string;
  name: string;
  days: string[];
  location: string;
  locationName: string;
  type: string;
  subtype?: string;
  description: string;
  pokemon?: string;
  level?: number;
  price?: number;
}

interface EventsClientProps {
  dailyEvents: DailyEvent[];
  weeklyEvents: WeeklyEvent[];
}

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const dayDisplayNames: Record<string, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

const getSubtypeIcon = (subtype?: string) => {
  switch (subtype) {
    case 'wild-pokemon':
      return <Waves className="h-4 w-4" />;
    case 'contest':
      return <Bug className="h-4 w-4" />;
    case 'travel':
      return <Ship className="h-4 w-4" />;
    case 'service':
      return <Scissors className="h-4 w-4" />;
    case 'shop':
      return <Store className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
};

function DailyEventCard({ event }: { event: DailyEvent }) {
  return (
    <DetailCard className="h-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{event.name}</h3>
          <Badge variant="secondary" className="capitalize">
            {dayDisplayNames[event.day]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{event.description}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Link
            href={`/locations/${event.location}`}
            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <MapPin className="h-3 w-3" />
            {event.locationName}
          </Link>
          {event.itemName && (
            <Link
              href={`/items/${event.item}`}
              className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline"
            >
              <Gift className="h-3 w-3" />
              {event.itemName}
            </Link>
          )}
        </div>
      </div>
    </DetailCard>
  );
}

function WeeklyEventCard({ event }: { event: WeeklyEvent }) {
  return (
    <DetailCard className="h-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {getSubtypeIcon(event.subtype)}
            <h3 className="font-semibold text-lg">{event.name}</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{event.description}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {event.days.map((day) => (
            <Badge key={day} variant="outline" className="capitalize text-xs">
              {dayDisplayNames[day]}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          <Link
            href={`/locations/${event.location}`}
            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <MapPin className="h-3 w-3" />
            {event.locationName}
          </Link>
          {event.pokemon && (
            <Link
              href={`/pokemon/${event.pokemon}`}
              className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline"
            >
              Lv. {event.level} {event.pokemon.charAt(0).toUpperCase() + event.pokemon.slice(1)}
            </Link>
          )}
          {event.price && (
            <span className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
              ¥{event.price}
            </span>
          )}
        </div>
      </div>
    </DetailCard>
  );
}

export function EventsClient({ dailyEvents, weeklyEvents }: EventsClientProps) {
  // Get today's day name
  const today = useMemo(() => {
    const now = new Date();
    return dayNames[now.getDay()];
  }, []);

  // Filter events for today
  const todayDaily = useMemo(() => {
    return dailyEvents.filter((e) => e.day === today);
  }, [dailyEvents, today]);

  const todayWeekly = useMemo(() => {
    return weeklyEvents.filter((e) => e.days.includes(today));
  }, [weeklyEvents, today]);

  const todayCount = todayDaily.length + todayWeekly.length;

  return (
    <Tabs defaultValue="today" className="w-full">
      <TabsList className="grid w-full grid-cols-3 border-border border p-1 h-12 bg-white dark:bg-white/5">
        <TabsTrigger value="today" className="relative">
          Today
          {todayCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100"
            >
              {todayCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="daily">
          Daily Siblings
          <Badge variant="outline" className="ml-2">
            {dailyEvents.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="weekly">
          Weekly
          <Badge variant="outline" className="ml-2">
            {weeklyEvents.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="today" className="mt-4 space-y-6">
        <div className="text-center text-sm text-muted-foreground mb-4">
          It&apos;s <span className="font-semibold capitalize">{dayDisplayNames[today]}</span>!
        </div>

        {todayDaily.length > 0 && (
          <section aria-labelledby="today-daily">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="today-daily" className="text-lg font-medium">
                Day of Week Sibling
              </h2>
              <Badge variant="default">{todayDaily.length} available</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {todayDaily.map((event) => (
                <DailyEventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {todayDaily.length > 0 && todayWeekly.length > 0 && <Separator />}

        {todayWeekly.length > 0 && (
          <section aria-labelledby="today-weekly">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="today-weekly" className="text-lg font-medium">
                Weekly Events
              </h2>
              <Badge variant="default">{todayWeekly.length} available</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {todayWeekly.map((event) => (
                <WeeklyEventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {todayDaily.length === 0 && todayWeekly.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No special events today.
          </div>
        )}
      </TabsContent>

      <TabsContent value="daily" className="mt-4">
        <p className="text-sm text-muted-foreground mb-4">
          The Day of Week siblings are seven NPCs who appear on their respective days and give you
          type-enhancing held items.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {dailyEvents.map((event) => (
            <DailyEventCard key={event.id} event={event} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="weekly" className="mt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Recurring events that happen on specific days of the week.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {weeklyEvents.map((event) => (
            <WeeklyEventCard key={event.id} event={event} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
