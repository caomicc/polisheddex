import { Hero } from '@/components/ui';
import EventsPageClient from './events-page-client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';

export default function EventsPage() {
  return (
    <>
      <Hero
        headline="Events"
        description="Browse all events. Basically spoilers."
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
      <div className="max-w-xl md:max-w-4xl mx-auto ">
        <EventsPageClient />
      </div>
    </>
  );
}

export async function generateMetadata() {
  const title = 'Events - PolishedDex';
  const description =
    'Discover all daily and weekly events in Pokémon Polished Crystal. Find out when to meet the Day-of-Week siblings, participate in Bug Catching Contests, and catch special event Pokémon.';

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal events',
      'bug catching contest',
      'day of week siblings',
      'monica tuscany wesley',
      'weekly events',
      'daily events',
      'event pokemon',
      'special events',
      'legendary pokemon',
    ],

    openGraph: {
      title,
      description,
      type: 'website',
    },

    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}
