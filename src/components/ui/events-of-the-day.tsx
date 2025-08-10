'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Gift, Clock, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DailyEvent {
  id: string;
  name: string;
  day: string;
  location: string;
  description: string;
  npcName?: string;
  reward?: string;
  timeOfDay?: string;
}

interface WeeklyEvent {
  id: string;
  name: string;
  days: string[];
  location: string;
  description: string;
  type: string;
  timeOfDay?: string;
}

interface SpecialEvent {
  id: string;
  name: string;
  location: string;
  description: string;
  type: 'legendary' | 'gift' | 'egg' | 'other';
  pokemon?: string;
  conditions?: string;
}

interface EventData {
  dailyEvents: DailyEvent[];
  weeklyEvents: WeeklyEvent[];
  specialEvents: SpecialEvent[];
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const EVENT_TYPE_COLORS = {
  contest: 'bg-blue-100 text-blue-800 border-blue-200',
  shop: 'bg-green-100 text-green-800 border-green-200',
  service: 'bg-purple-100 text-purple-800 border-purple-200',
  special: 'bg-yellow-100 text-yellow-800 border-yellow-200',
} as const;

const getEventTypeColor = (type: string) => {
  return EVENT_TYPE_COLORS[type as keyof typeof EVENT_TYPE_COLORS] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export default function EventsOfTheDay() {
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [currentDay, setCurrentDay] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current day
    const today = new Date();
    const dayName = DAYS_OF_WEEK[today.getDay()];
    setCurrentDay(dayName);

    // Load events data
    const loadEvents = async () => {
      try {
        // Load from static file in public directory
        const response = await fetch('/output/events.json');
        if (response.ok) {
          const data = await response.json();
          setEventData(data);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Loading Events...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!eventData) {
    return null;
  }

  const todaysDailyEvents = eventData.dailyEvents.filter(
    (event) => event.day === currentDay
  );

  const todaysWeeklyEvents = eventData.weeklyEvents.filter((event) =>
    event.days.includes(currentDay)
  );

  const allTodaysEvents = [...todaysDailyEvents, ...todaysWeeklyEvents];

  if (allTodaysEvents.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Events Today ({currentDay})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">No special events happening today. Check back tomorrow!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          Events Today ({currentDay})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {todaysDailyEvents.map((event) => (
            <div key={event.id} className="flex flex-col space-y-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-green-800">{event.name}</h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-700">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-32 sm:max-w-none">{event.location}</span>
                    </div>
                    {event.timeOfDay && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.timeOfDay}
                      </div>
                    )}
                    {event.location === 'Phone Call' && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Call
                      </div>
                    )}
                  </div>
                </div>
                {event.reward && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs bg-white border-green-300 text-green-700 shrink-0">
                    <Gift className="h-3 w-3" />
                    {event.reward}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-800 leading-relaxed">{event.description}</p>
            </div>
          ))}

          {todaysWeeklyEvents.map((event) => (
            <div key={event.id} className="flex flex-col space-y-2 p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-blue-800">{event.name}</h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-700">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-32 sm:max-w-none">{event.location}</span>
                    </div>
                    {event.timeOfDay && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.timeOfDay}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs shrink-0 ${getEventTypeColor(event.type)}`}>
                  {event.type}
                </Badge>
              </div>
              <p className="text-xs text-gray-800 leading-relaxed">{event.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {event.days.map((day) => (
                  <Badge
                    key={day}
                    variant={day === currentDay ? "default" : "outline"}
                    className={`text-xs ${
                      day === currentDay 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-blue-600 border-blue-300'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}