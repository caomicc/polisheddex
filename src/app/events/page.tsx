'use client';

import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import {
  allEventTypes,
  dayNames,
  getTodayName,
  matchesFilter,
  type AnyEvent,
  eventSearchText,
} from '@/lib/event-utils';
import { defaultFilters, EventFilters, FiltersState } from '@/components/ui/event-filter';
import { EventCard } from '@/components/ui/event-card';
import eventsData from '../../../output/events.json';
import type { DailyEvent, WeeklyEvent, SpecialEvent } from '@/lib/event-utils';
import { Hero } from '@/components/ui';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';

const {
  dailyEvents: rawDailyEvents,
  weeklyEvents: rawWeeklyEvents,
  specialEvents: rawSpecialEvents,
} = eventsData;

const dailyEvents = rawDailyEvents as DailyEvent[];
const weeklyEvents = rawWeeklyEvents as WeeklyEvent[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const specialEvents = (rawSpecialEvents as Array<any>).map((e) => ({
  ...e,
  location: e.area,
  area: undefined,
})) as SpecialEvent[];

export default function Page() {
  const now = new Date();
  const todayName = getTodayName(now);

  // Global filter state
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);

  // const resetFilters = () => setFilters({ ...defaultFilters, day: todayName });

  // Derived collections
  const todayDaily = useMemo(() => {
    return dailyEvents.filter((e) => e.day === todayName);
  }, [todayName]);

  const todayWeekly = useMemo(() => {
    return weeklyEvents.filter((e) => e.days.includes(todayName));
  }, [todayName]);

  // Apply filters per tab
  const filteredDaily = useMemo(() => {
    return dailyEvents
      .filter((e) => (filters.day ? e.day === filters.day : true))
      .filter((e) => matchesFilter({ event: e as AnyEvent, filters }))
      .filter((e) =>
        filters.query
          ? eventSearchText(e).toLowerCase().includes(filters.query.toLowerCase())
          : true,
      );
  }, [filters]);

  const filteredWeekly = useMemo(() => {
    return weeklyEvents
      .filter((e) => (filters.day ? e.days.includes(filters.day) : true))
      .filter((e) => matchesFilter({ event: e as AnyEvent, filters }))
      .filter((e) =>
        filters.query
          ? eventSearchText(e).toLowerCase().includes(filters.query.toLowerCase())
          : true,
      );
  }, [filters]);

  const filteredSpecial = useMemo(() => {
    return specialEvents
      .filter((e) => matchesFilter({ event: e as AnyEvent, filters }))
      .filter((e) =>
        filters.query
          ? eventSearchText(e).toLowerCase().includes(filters.query.toLowerCase())
          : true,
      );
  }, [filters]);

  // Today tab uses "todayDaily" and "todayWeekly", but still respects selected time/type/query filters
  const todayDailyFiltered = useMemo(() => {
    return todayDaily
      .filter((e) => matchesFilter({ event: e as AnyEvent, filters }))
      .filter((e) =>
        filters.query
          ? eventSearchText(e).toLowerCase().includes(filters.query.toLowerCase())
          : true,
      );
  }, [todayDaily, filters]);

  const todayWeeklyFiltered = useMemo(() => {
    return todayWeekly
      .filter((e) => matchesFilter({ event: e as AnyEvent, filters }))
      .filter((e) =>
        filters.query
          ? eventSearchText(e).toLowerCase().includes(filters.query.toLowerCase())
          : true,
      );
  }, [todayWeekly, filters]);

  const todayCounts = {
    daily: todayDailyFiltered.length,
    weekly: todayWeeklyFiltered.length,
  };

  return (
    <>
      <Hero
        headline="Events"
        description="What's happening right now! Possible spoiler information."
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="hover:underline">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="">Events</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
        <EventFilters
          value={filters}
          onChange={setFilters}
          allTypes={allEventTypes}
          dayNames={dayNames}
        />

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-4 border-border border-1 p-1 h-12 bg-white dark:bg-white/5">
            <TabsTrigger value="today">
              Today
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                {todayCounts.daily + todayCounts.weekly}
              </span>
            </TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="special">Special/Gift</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4 space-y-8">
            <section aria-labelledby="today-daily">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="today-daily" className="text-lg font-medium">
                  Daily NPCs & Calls
                </h2>
                <Badge variant="default">{todayCounts.daily} today</Badge>
              </div>
              {todayDailyFiltered.length === 0 ? (
                <EmptyState message="No daily events match your filters for today." />
              ) : (
                <div className="flex gap-4">
                  {todayDailyFiltered.map((e) => (
                    <EventCard key={e.id} variant="daily" event={e} className={'flex-1'} />
                  ))}
                </div>
              )}
            </section>

            <Separator />

            <section aria-labelledby="today-weekly">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="today-weekly" className="text-lg font-medium">
                  Weekly happenings today
                </h2>
                <Badge variant="default">{todayCounts.weekly} today</Badge>
              </div>
              {todayWeeklyFiltered.length === 0 ? (
                <EmptyState message="No weekly events match your filters for today." />
              ) : (
                <div className="flex gap-4">
                  {todayWeeklyFiltered.map((e) => (
                    <EventCard key={e.id} variant="weekly" event={e} className={'flex-1'} />
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="daily" className="mt-4">
            {filteredDaily.length === 0 ? (
              <EmptyState message="No daily events match your filters." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDaily.map((e) => (
                  <EventCard key={e.id} variant="daily" event={e} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="weekly" className="mt-4">
            {filteredWeekly.length === 0 ? (
              <EmptyState message="No weekly events match your filters." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredWeekly.map((e) => (
                  <EventCard key={e.id} variant="weekly" event={e} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="special" className="mt-4">
            {filteredSpecial.length === 0 ? (
              <EmptyState message="No special events match your filters." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSpecial.map((e) => (
                  <EventCard key={e.id} variant="special" event={e} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function EmptyState(
  { message = 'No results.' }: { message?: string } = { message: 'No results.' },
) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
