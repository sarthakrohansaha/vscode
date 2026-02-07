import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Filter, Calendar, MapPin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import EventCard from '@/components/cards/EventCard';
import NewEventForm from '@/components/events/NewEventForm';

const eventTypes = [
  "All", "Conference", "Workshop", "Seminar", "CME", "Webinar", "Meetup", "Training", "Other"
];

export default function Events() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showNewEvent, setShowNewEvent] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['allEvents'],
    queryFn: () => base44.entities.MedicalEvent.list('date', 100),
  });

  const filteredEvents = events.filter(e => {
    const matchesSearch = searchQuery === '' ||
      e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.organizer?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'All' || e.event_type === typeFilter;

    const matchesLocation = locationFilter === 'all' ||
      (locationFilter === 'online' && e.is_online) ||
      (locationFilter === 'in-person' && !e.is_online);

    return matchesSearch && matchesType && matchesLocation;
  });

  const upcomingEvents = filteredEvents.filter(e => new Date(e.date) >= new Date());
  const pastEvents = filteredEvents.filter(e => new Date(e.date) < new Date());

  const toggleInterestMutation = useMutation({
    mutationFn: async (event) => {
      const isInterested = event.interested?.includes(user.email);
      await base44.entities.MedicalEvent.update(event.id, {
        interested: isInterested
          ? event.interested.filter(i => i !== user.email)
          : [...(event.interested || []), user.email]
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['allEvents'])
  });

  const toggleAttendMutation = useMutation({
    mutationFn: async (event) => {
      const isAttending = event.attendees?.includes(user.email);
      await base44.entities.MedicalEvent.update(event.id, {
        attendees: isAttending
          ? event.attendees.filter(a => a !== user.email)
          : [...(event.attendees || []), user.email]
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['allEvents'])
  });

  const handleNewEventCreated = () => {
    setShowNewEvent(false);
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-7 h-7 text-teal-500" />
                Medical Events
              </h1>
              <p className="text-slate-500 mt-1">
                Conferences, workshops, and CME opportunities
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events..."
                  className="pl-10"
                />
              </div>

              <Dialog open={showNewEvent} onOpenChange={setShowNewEvent}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-500 hover:bg-teal-600 gap-2">
                    <Plus className="w-4 h-4" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add a Medical Event</DialogTitle>
                  </DialogHeader>
                  <NewEventForm onSuccess={handleNewEventCreated} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={locationFilter} onValueChange={setLocationFilter}>
              <TabsList className="bg-slate-100">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="online" className="gap-1">
                  <Globe className="w-3 h-3" />
                  Online
                </TabsTrigger>
                <TabsTrigger value="in-person" className="gap-1">
                  <MapPin className="w-3 h-3" />
                  In-Person
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                <div className="h-40 bg-slate-200 rounded-lg mb-4" />
                <div className="h-4 bg-slate-200 rounded w-20 mb-3" />
                <div className="h-5 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Upcoming Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      currentUserId={user?.email}
                      isInterested={event.interested?.includes(user?.email)}
                      isAttending={event.attendees?.includes(user?.email)}
                      onInterested={() => toggleInterestMutation.mutate(event)}
                      onAttend={() => toggleAttendMutation.mutate(event)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Past Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      currentUserId={user?.email}
                      isInterested={event.interested?.includes(user?.email)}
                      isAttending={event.attendees?.includes(user?.email)}
                    />
                  ))}
                </div>
              </section>
            )}

            {filteredEvents.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">No events found</h3>
                <p className="text-slate-500 mt-1">Be the first to add an event</p>
                <Button 
                  className="mt-4 bg-teal-500 hover:bg-teal-600"
                  onClick={() => setShowNewEvent(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}