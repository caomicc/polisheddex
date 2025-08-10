import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Heart,
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

const defaultDaily: DailyEvent = {
  id: 'sample_daily',
  name: 'Sample Daily NPC',
  day: 'Monday',
  location: 'Route 1',
  description: 'An example daily event.',
  npcName: 'NPC',
  reward: 'Sample Reward',
};

const defaultWeekly: WeeklyEvent = {
  id: 'sample_weekly',
  name: 'Sample Weekly Event',
  days: ['Tuesday', 'Thursday'],
  location: 'Sample Location',
  description: 'An example weekly event.',
  type: 'contest',
};

const defaultSpecial: SpecialEvent = {
  id: 'sample_special',
  name: 'Sample Special',
  location: 'Secret Place',
  description: 'An example special event.',
  type: 'gift',
  conditions: 'None',
};

export function EventCard(
  props: EventCardProps = { variant: 'daily', event: defaultDaily, icon: Gift, accent: 'amber' },
) {
  const { variant, event, icon: Icon, accent = 'slate' } = props as any;

  const accentRing =
    accent === 'amber'
      ? 'ring-amber-200'
      : accent === 'emerald'
        ? 'ring-emerald-200'
        : accent === 'violet'
          ? 'ring-violet-200'
          : 'ring-slate-200';

  const pillBg =
    accent === 'amber'
      ? 'bg-amber-100 text-amber-900'
      : accent === 'emerald'
        ? 'bg-emerald-100 text-emerald-900'
        : accent === 'violet'
          ? 'bg-violet-100 text-violet-900'
          : 'bg-slate-100 text-slate-900';

  const headerIcon =
    Icon ??
    (variant === 'daily'
      ? deriveDailyType(event as DailyEvent) === 'call'
        ? Phone
        : Gift
      : variant === 'weekly'
        ? event.type === 'contest'
          ? Trophy
          : event.type === 'shop'
            ? ShoppingBag
            : event.type === 'service'
              ? Scissors
              : Stars
        : // special
          (event as SpecialEvent).type === 'legendary'
          ? Sparkles
          : (event as SpecialEvent).type === 'egg'
            ? Egg
            : Gift);

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-shadow hover:shadow-md',
        'border-border/60',
      )}
    >
      <CardHeader className="pb-3">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md ring-4',
              pillBg,
              accentRing,
            )}
          >
            {headerIcon ? <Heart className="h-4 w-4" /> : null}
          </span>
          <CardTitle className="text-base">{event.name}</CardTitle>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {'day' in event ? (
            <Badge variant="outline" className={pillBg}>
              {event.day}
            </Badge>
          ) : null}

          {'days' in event ? (
            <div className="flex flex-wrap gap-1">
              {(event.days as DayName[]).map((d) => (
                <Badge key={d} variant="outline" className="bg-transparent text-muted-foreground">
                  {dayAbbrev(d)}
                </Badge>
              ))}
            </div>
          ) : null}

          {'type' in event ? (
            <Badge variant="secondary" className="bg-transparent">
              {(event as any).type}
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-transparent">
              {deriveDailyType(event as DailyEvent) === 'call' ? 'call' : 'npc'}
            </Badge>
          )}

          {'timeOfDay' in event && event.timeOfDay ? (
            <Badge variant="outline" className="bg-transparent">
              <Clock className="mr-1 h-3.5 w-3.5" />
              {(event as any).timeOfDay}
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{event.description}</p>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center text-foreground/80">
            <MapPin className="mr-1.5 h-4 w-4 text-foreground/70" />
            {event.location}
          </span>

          {'npcName' in event && (event as DailyEvent).npcName ? (
            <Badge variant="outline" className="bg-transparent">
              NPC: {(event as DailyEvent).npcName}
            </Badge>
          ) : null}

          {'reward' in event && (event as DailyEvent).reward ? (
            <Badge variant="outline" className="bg-transparent">
              <Gift className="mr-1 h-3.5 w-3.5" />
              Reward: {(event as DailyEvent).reward}
            </Badge>
          ) : null}

          {'pokemon' in event && (event as SpecialEvent).pokemon ? (
            <Badge variant="outline" className="bg-transparent">
              Pokémon: {(event as SpecialEvent).pokemon}
            </Badge>
          ) : null}

          {'conditions' in event && (event as SpecialEvent).conditions ? (
            <Badge variant="outline" className="bg-transparent">
              {(event as SpecialEvent).conditions}
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
