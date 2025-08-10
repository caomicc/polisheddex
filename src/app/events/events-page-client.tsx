'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  CalendarDays, 
  MapPin, 
  Gift, 
  Clock, 
  Phone, 
  Star, 
  Trophy, 
  Egg, 
  Users,
  Calendar,
  Filter
} from 'lucide-react';
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
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const EVENT_TYPE_ICONS = {
  contest: Trophy,
  shop: Users,
  service: Users,
  special: Star,
  legendary: Star,
  gift: Gift,
  egg: Egg,
  other: Calendar,
} as const;

const EVENT_TYPE_COLORS = {
  contest: 'bg-blue-100 text-blue-800 border-blue-200',
  shop: 'bg-green-100 text-green-800 border-green-200',
  service: 'bg-purple-100 text-purple-800 border-purple-200',
  special: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  legendary: 'bg-red-100 text-red-800 border-red-200',
  gift: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  egg: 'bg-orange-100 text-orange-800 border-orange-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

const getEventTypeColor = (type: string) => {
  return EVENT_TYPE_COLORS[type as keyof typeof EVENT_TYPE_COLORS] || EVENT_TYPE_COLORS.other;
};

const getEventTypeIcon = (type: string) => {
  return EVENT_TYPE_ICONS[type as keyof typeof EVENT_TYPE_ICONS] || EVENT_TYPE_ICONS.other;
};

export default function EventsPageClient() {
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [currentDay, setCurrentDay] = useState<string>('');

  useEffect(() => {
    // Get current day
    const today = new Date();
    const dayName = DAYS_OF_WEEK[today.getDay()];
    setCurrentDay(dayName);

    // Load events data
    const loadEvents = async () => {
      try {
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
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Events</h1>
          <p className="text-gray-600">Loading events...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="max-w-6xl mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold mb-2">Events</h1>
        <p className="text-gray-600">Failed to load events data.</p>
      </div>
    );
  }

  const filteredDailyEvents = selectedDay === 'all' 
    ? eventData.dailyEvents 
    : eventData.dailyEvents.filter(event => event.day === selectedDay);

  const filteredWeeklyEvents = selectedDay === 'all'
    ? eventData.weeklyEvents
    : eventData.weeklyEvents.filter(event => event.days.includes(selectedDay));

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 text-center">Events Guide</h1>
        <p className="text-gray-600 text-center text-lg">
          Discover all the special events, contests, and encounters in Pokémon Polished Crystal
        </p>
        
        {/* Day Filter */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <Button
            variant={selectedDay === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDay('all')}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            All Events
          </Button>
          {DAYS_OF_WEEK.map((day) => (
            <Button
              key={day}
              variant={selectedDay === day ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDay(day)}
              className={`${
                day === currentDay ? 'ring-2 ring-blue-300' : ''
              }`}
            >
              {day === currentDay && '⭐ '}
              {day}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Daily Events ({filteredDailyEvents.length})
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Events ({filteredWeeklyEvents.length})
          </TabsTrigger>
          <TabsTrigger value="special" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Special Events ({eventData.specialEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDailyEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between text-base">
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-800">{event.name}</h3>
                      <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                        {event.day}
                      </Badge>
                    </div>
                    {event.reward && (
                      <Badge variant="outline" className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0 ml-2">
                        <Gift className="h-3 w-3" />
                        {event.reward}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{event.location}</span>
                      </div>
                      {event.timeOfDay && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{event.timeOfDay}</span>
                        </div>
                      )}
                      {event.location === 'Phone Call' && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">Call</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {event.description}
                    </p>
                    {event.npcName && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="h-3 w-3" />
                        NPC: {event.npcName}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWeeklyEvents.map((event) => {
              const IconComponent = getEventTypeIcon(event.type);
              return (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between text-base">
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-800">{event.name}</h3>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.days.map((day) => (
                            <Badge
                              key={day}
                              variant={day === currentDay ? "default" : "outline"}
                              className={`text-xs ${
                                day === currentDay 
                                  ? 'bg-blue-600 text-white border-blue-600' 
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs shrink-0 ml-2 ${getEventTypeColor(event.type)}`}>
                        <IconComponent className="h-3 w-3 mr-1" />
                        {event.type}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{event.location}</span>
                        </div>
                        {event.timeOfDay && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{event.timeOfDay}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="special" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventData.specialEvents.map((event) => {
              const IconComponent = getEventTypeIcon(event.type);
              return (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between text-base">
                      <div className="flex-1">
                        <h3 className="font-semibold text-purple-800">{event.name}</h3>
                        <Badge 
                          variant="outline" 
                          className={`mt-1 text-xs ${getEventTypeColor(event.type)}`}
                        >
                          <IconComponent className="h-3 w-3 mr-1" />
                          {event.type}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{event.location}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {event.description}
                      </p>
                      {event.pokemon && (
                        <div className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                          <Star className="h-4 w-4" />
                          <strong>Pokémon:</strong> {event.pokemon}
                        </div>
                      )}
                      {event.conditions && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <strong>Conditions:</strong> {event.conditions}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}