import EventsPageClient from './events-page-client';

export default function EventsPage() {
  return <EventsPageClient />;
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