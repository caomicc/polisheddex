import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Gift,
  Phone,
  Stars,
  Egg,
  Sparkles,
  Scissors,
  ShoppingBag,
  Trophy,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DailyEvent,
  dayAbbrev,
  DayName,
  deriveDailyType,
  SpecialEvent,
  WeeklyEvent,
} from '@/lib/event-utils';

type Accent = 'amber' | 'emerald' | 'violet' | 'slate';

export type EventCardProps =
  | {
      variant: 'daily';
      event: DailyEvent;
      icon?: React.ComponentType<{ className?: string }>;
      accent?: Accent;
    }
  | {
      variant: 'weekly';
      event: WeeklyEvent;
      icon?: React.ComponentType<{ className?: string }>;
      accent?: Accent;
    }
  | {
      variant: 'special';
      event: SpecialEvent;
      icon?: React.ComponentType<{ className?: string }>;
      accent?: Accent;
    };

export function EventCard(props: EventCardProps) {
  const { variant, event, icon: Icon, accent = 'slate' } = props;
  const accentRing = (() => {
    switch (accent) {
      case 'amber':
        return 'ring-amber-200';
      case 'emerald':
        return 'ring-emerald-200';
      case 'violet':
        return 'ring-violet-200';
      default:
        return 'ring-slate-200';
    }
  })();

  const pillBg = (() => {
    switch (accent) {
      case 'amber':
        return 'bg-amber-100 text-amber-900';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-900';
      case 'violet':
        return 'bg-violet-100 text-violet-900';
      default:
        return 'bg-slate-100 text-slate-900';
    }
  })();

  const headerIcon = (() => {
    if (Icon) return Icon;
    switch (variant) {
      case 'daily':
        return deriveDailyType(event as DailyEvent) === 'call' ? Phone : Gift;
      case 'weekly':
        switch (event.type) {
          case 'contest':
            return Trophy;
          case 'shop':
            return ShoppingBag;
          case 'service':
            return Scissors;
          default:
            return Stars;
        }
      case 'special':
        switch ((event as SpecialEvent).type) {
          case 'legendary':
            return Sparkles;
          case 'egg':
            return Egg;
          default:
            return Gift;
        }
      default:
        return Gift;
    }
  })();

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

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-shadow hover:shadow-md gap-4',
        'border-border/60',
      )}
    >
      <CardHeader className="">
        <div className="flex gap-4">
          <div
            className={cn(
              'flex w-10 h-10 square items-center justify-center rounded-md ring-4',
              pillBg,
              accentRing,
            )}
          >
            {headerIcon ? React.createElement(headerIcon) : null}
          </div>
          <p className="inline-flex text-sm w-auto items-center flex-1">{event.name}</p>
        </div>

        {(('day' in event && event.day) ||
          ('days' in event && event.days && (event.days as DayName[]).length > 0) ||
          ('timeOfDay' in event && event.timeOfDay)) && (
          <div className="flex flex-wrap items-center gap-2">
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
      </CardHeader>

      <CardContent className="space-y-3">
        {(event.location && event.location !== 'Phone Call') || (
          <div className="flex gap-4">
            <span className="flex gap-2 items-center w-full">
              <MapPin className="flex w-4 h-4" />
              <p className="inline-flex text-xs w-auto leading-none flex-1">{event.location}</p>
            </span>
          </div>
        )}
        <p className="text-sm text-muted-foreground">{event.description}</p>
        {'reward' in event && (event as DailyEvent).reward ? (
          <Badge variant="any">
            <Gift className="h-3.5 w-3.5" />
            Reward: {(event as DailyEvent).reward}
          </Badge>
        ) : null}
        {'conditions' in event && (event as SpecialEvent).conditions ? (
          <span className="inline-flex text-xs w-full flex-1 wrap-anywhere">
            {((event as SpecialEvent).conditions as string).replace(/_/g, ' ')}
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
