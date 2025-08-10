import {
  Gift,
  Phone,
  Stars,
  Egg,
  Sparkles,
  Scissors,
  ShoppingBag,
  Trophy,
  CalendarDays,
} from 'lucide-react';

// Types
export type DayName =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type TimeOfDay = 'morning' | 'afternoon' | 'night';

export type DailyEvent = {
  id: string;
  name: string;
  day: DayName;
  location: string;
  description: string;
  npcName: string;
  reward?: string;
  timeOfDay?: TimeOfDay;
};

export type WeeklyEvent = {
  id: string;
  name: string;
  days: DayName[];
  location: string;
  description: string;
  type: EventType; // contest | shop | service | special
  timeOfDay?: TimeOfDay;
};

export type SpecialEvent = {
  id: string;
  name: string;
  location: string;
  description: string;
  type: EventType; // legendary | egg | gift
  pokemon?: string;
  conditions?: string;
};

export type EventType =
  | 'npc'
  | 'call'
  | 'contest'
  | 'shop'
  | 'service'
  | 'special'
  | 'legendary'
  | 'egg'
  | 'gift';

export type AnyEvent = DailyEvent | WeeklyEvent | SpecialEvent;

// Constants
export const dayNames: DayName[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const daylightOptions: { value: 'any' | TimeOfDay; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'night', label: 'Night' },
];

export const allEventTypes: EventType[] = [
  'npc',
  'call',
  'contest',
  'shop',
  'service',
  'special',
  'legendary',
  'egg',
  'gift',
];

// Helpers
export function getTodayName(d: Date): DayName {
  return dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1] as DayName; // JS: 0=Sun; our list starts at Monday
}

export function dayAbbrev(day: DayName): string {
  return day.slice(0, 3);
}

export function deriveDailyType(e: DailyEvent): 'npc' | 'call' {
  if (e.location.toLowerCase().includes('phone')) return 'call';
  // Some daily entries have timeOfDay but still are calls; we already detect via location.
  return 'npc';
}

export function getIconForType(t: EventType) {
  switch (t) {
    case 'npc':
    case 'gift':
      return Gift;
    case 'call':
      return Phone;
    case 'special':
      return Stars;
    case 'egg':
      return Egg;
    case 'legendary':
      return Sparkles;
    case 'service':
      return Scissors;
    case 'shop':
      return ShoppingBag;
    case 'contest':
      return Trophy;
    default:
      return CalendarDays;
  }
}

export function eventSearchText(e: AnyEvent): string {
  const base = [e.name, e.location, e.description].join(' | ');
  if ('npcName' in e) return [base, e.npcName, (e as any).reward ?? ''].join(' | ');
  if ('pokemon' in e) return [base, e.pokemon ?? '', (e as any).conditions ?? ''].join(' | ');
  return base;
}

export function matchesFilter({
  event,
  filters,
}: {
  event: AnyEvent;
  filters: {
    day: DayName | '';
    timeOfDay: 'any' | TimeOfDay;
    types: EventType[];
    query: string;
  };
}): boolean {
  // Type filtering
  const types = filters.types;
  let eventType: EventType | undefined;
  if ('type' in event) {
    eventType = event.type as EventType;
  } else {
    eventType = deriveDailyType(event as DailyEvent);
  }
  if (types.length > 0 && eventType && !types.includes(eventType)) {
    return false;
  }

  // Time of day filtering
  const filterTOD = filters.timeOfDay;
  if (filterTOD !== 'any') {
    // If event has a timeOfDay, it must match; if not specified, we treat it as available anytime
    if ('timeOfDay' in event) {
      const tod = (event as any).timeOfDay as TimeOfDay | undefined;
      if (tod && tod !== filterTOD) return false;
    }
  }

  // Day filtering is handled outside per tab (for daily and weekly). For safety, if filters.day is set and this is weekly: ensure include
  if ('days' in event && filters.day) {
    if (!(event as WeeklyEvent).days.includes(filters.day)) return false;
  }
  if ('day' in event && filters.day) {
    if ((event as DailyEvent).day !== filters.day) return false;
  }

  return true;
}
