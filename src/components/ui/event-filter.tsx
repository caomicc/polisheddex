'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Filter, Check, CalendarDays } from 'lucide-react';
// import { DayName, EventType, getTodayName } from '@/lib/event-utils';

export type FiltersState = {
  day: any | ''; // empty means all days
  timeOfDay: 'any' | 'morning' | 'afternoon' | 'night';
  types: any[];
  query: string;
};

export const defaultFilters: FiltersState = {
  day: '',
  timeOfDay: 'any',
  types: [],
  query: '',
};

export function EventFilters(
  {
    value = defaultFilters,
    onChange = () => {},
    allTypes = [],
    dayNames = [],
  }: {
    value?: FiltersState;
    onChange?: (next: FiltersState) => void;
    allTypes?: any[];
    dayNames?: any[];
  } = {
    value: defaultFilters,
    onChange: () => {},
    allTypes: [],
    dayNames: [],
  },
) {
  // const today = getTodayName(new Date());
  const today = 'Monday'; // TODO: replace with real value

  const activeTypeCount = value.types.length;
  const typeSummary = useMemo(() => {
    if (activeTypeCount === 0) return 'All types';
    if (activeTypeCount === 1) return value.types[0];
    return `${activeTypeCount} types`;
  }, [activeTypeCount, value.types]);

  const toggleType = (t: any) => {
    const set = new Set(value.types);
    if (set.has(t)) set.delete(t);
    else set.add(t);
    onChange({ ...value, types: Array.from(set) });
  };

  return (
    <div className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 rounded-xl mb-2 md:mb-4 dark:border-white/[0.2] dark:bg-black dark:shadow-none">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="query" className="label-text">
            Search
          </Label>
          <Input
            id="query"
            placeholder="Name, location, NPC, Pokémon..."
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="day" className="label-text">
            Day
          </Label>
          <div className="flex items-center gap-2">
            <Select
              value={value.day === '' ? 'all' : (value.day as any)}
              onValueChange={(v) => onChange({ ...value, day: v === 'all' ? '' : (v as any) })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All days</SelectItem>
                {dayNames.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              title="Set day to today"
              onClick={() => onChange({ ...value, day: today })}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="types" className="label-text">
            Types
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent border-border capitalize w-[150px]"
              >
                <Filter className="h-4 w-4" />
                {typeSummary}
                {activeTypeCount > 0 ? <Badge variant="secondary">{activeTypeCount}</Badge> : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[150px] border-border">
              <DropdownMenuLabel>Event types</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allTypes.map((t) => (
                <DropdownMenuCheckboxItem
                  key={t}
                  checked={value.types.includes(t)}
                  onCheckedChange={() => toggleType(t)}
                >
                  <span className="capitalize">{t}</span>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => onChange({ ...value, types: [] })}
              >
                <Check className="mr-2 h-4 w-4" />
                Select none
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="timeOfDay" className="label-text">
            Time of day
          </Label>
          <Select
            value={value.timeOfDay}
            onValueChange={(v) => onChange({ ...value, timeOfDay: v as FiltersState['timeOfDay'] })}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="afternoon">Afternoon</SelectItem>
              <SelectItem value="night">Night</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
