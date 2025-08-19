import React from 'react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DailyEvent,
  dayAbbrev,
  DayName,
  deriveDailyType,
  SpecialEvent,
  WeeklyEvent,
} from '@/lib/event-utils';
import Link from 'next/link';

type Accent = 'amber' | 'emerald' | 'violet' | 'slate';

export type EventCardProps =
  | {
      variant: 'daily';
      event: DailyEvent;
      icon?: string;
      accent?: Accent;
      className?: string;
    }
  | {
      variant: 'weekly';
      event: WeeklyEvent;
      icon?: string;
      accent?: Accent;
      className?: string;
    }
  | {
      variant: 'special';
      event: SpecialEvent;
      icon?: string;
      accent?: Accent;
      className?: string;
    };

export function EventCard(props: EventCardProps) {
  const { variant, event, className } = props;

  const timeOfDay = (() => {
    if ('timeOfDay' in event && event.timeOfDay) {
      switch (event.timeOfDay) {
        case 'morning':
          return 'morn';
        case 'afternoon':
          return 'day';
        case 'night':
          return 'nite';
        default:
          return event.timeOfDay;
      }
    }
  })();

  const iconImageUrl = (() => {
    if (variant === 'special') {
      switch ((event as SpecialEvent).type) {
        case 'egg':
          return '/sprites/items/mystery_egg.png';
        case 'gift':
          return '/sprites/items/poke_ball.png';
        default:
          break;
      }
    }
    if (variant === 'weekly') {
      switch (event.type) {
        case 'contest':
          return '/sprites/items/nugget.png';
        case 'shop':
          return '/sprites/items/basement_key.png';
        case 'service':
          return '/sprites/items/basement_key.png';
        default:
          return '/sprites/items/poke_doll.png';
      }
    }
    if (variant === 'daily') {
      // If it's a phone call event, use pokegear icon
      if (deriveDailyType(event as DailyEvent) === 'call') {
        return '/sprites/items/pokegear.png';
      }
      switch ((event as DailyEvent).reward?.toLowerCase()) {
        case 'silk scarf':
          return '/sprites/items/scarf.png';
        default:
          return `/sprites/items/${(event as DailyEvent).reward?.toLowerCase().replace(/ /g, '_')}.png`;
      }
    }
    return '';
  })();

  return (
    <div
      className={cn(
        'shadow-input row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-neutral-200 bg-white p-4 transition duration-200 dark:border-white/[0.2] dark:bg-black dark:shadow-none min-h-[200px]',
        className,
      )}
    >
      <div className="">
        <Image
          src={iconImageUrl}
          width={24}
          height={24}
          alt="Icon 1"
          className="rounded-md dark:bg-white"
        />
        <div className="mt-2 mb-2 font-sans font-bold text-neutral-600 dark:text-neutral-200">
          {event.name
            .replace(/^MR__MIME/, 'Mr. Mime')
            .replace(/^EEVEE/, 'Eevee')
            .replace(/^DRATINI/, 'Dratini')
            .replace(/^MAGIKARP/, 'Magikarp')
            .replace(
              /^([A-Z][A-Z0-9\-]*)/,
              (match) => match.charAt(0) + match.slice(1).toLowerCase(),
            )
            .replace(/__/g, ' ')
            .replace(/_/g, ' ')}
        </div>
        <p className="font-sans text-sm font-normal text-neutral-600 dark:text-neutral-300">
          {event.description}
        </p>
        {'reward' in event && (event as DailyEvent).reward ? (
          <span className="font-sans text-xs font-normal text-neutral-600 dark:text-neutral-300">
            <span className="font-bold">Reward:</span>{' '}
            <Link href={`/items/${(event as DailyEvent).reward?.toLowerCase().replace(/ /g, '')}`}>
              {(event as DailyEvent).reward}
            </Link>
          </span>
        ) : null}
        {'conditions' in event && (event as SpecialEvent).conditions ? (
          <span className="inline-flex text-xs w-full flex-1 wrap-anywhere capitalize">
            {((event as SpecialEvent).conditions as string).replace(/_/g, ' ')}
          </span>
        ) : null}
      </div>
      {(('day' in event && event.day) ||
        ('days' in event && event.days && (event.days as DayName[]).length > 0) ||
        ('timeOfDay' in event && event.timeOfDay)) && (
        <div className="flex flex-wrap items-center gap-2 mt-auto">
          {'day' in event ? <Badge variant="secondary">{event.day}</Badge> : null}

          {'days' in event ? (
            <div className="flex flex-wrap gap-1">
              {(event.days as DayName[]).map((d) => (
                <Badge key={d} variant="secondary">
                  {dayAbbrev(d)}
                </Badge>
              ))}
            </div>
          ) : null}

          {'timeOfDay' in event && event.timeOfDay ? (
            <Badge variant={timeOfDay}>
              <Clock className="h-3.5 w-3.5" />
              {event.timeOfDay}
            </Badge>
          ) : null}
        </div>
      )}
    </div>
  );
}
