import React from 'react';
import { Calendar, MapPin, Users, Globe, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const eventTypeColors = {
  'Conference': 'bg-purple-100 text-purple-700',
  'Workshop': 'bg-blue-100 text-blue-700',
  'Seminar': 'bg-teal-100 text-teal-700',
  'CME': 'bg-green-100 text-green-700',
  'Webinar': 'bg-orange-100 text-orange-700',
  'Meetup': 'bg-pink-100 text-pink-700',
  'Training': 'bg-indigo-100 text-indigo-700',
  'Other': 'bg-slate-100 text-slate-700'
};

export default function EventCard({ event, onInterested, onAttend, isInterested, isAttending, currentUserId }) {
  const isPast = new Date(event.date) < new Date();

  return (
    <div className={cn(
      "bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all",
      isPast && "opacity-60"
    )}>
      {event.image_url && (
        <div className="aspect-video bg-slate-100 relative overflow-hidden">
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {event.is_free && (
            <Badge className="absolute top-3 right-3 bg-green-500">Free</Badge>
          )}
        </div>
      )}
      
      <div className="p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn("text-xs", eventTypeColors[event.event_type])}>
            {event.event_type}
          </Badge>
          {event.is_online && (
            <Badge variant="outline" className="text-xs">
              <Globe className="w-3 h-3 mr-1" />
              Online
            </Badge>
          )}
        </div>

        <h3 className="font-semibold text-slate-800 mt-2 line-clamp-2">{event.title}</h3>

        <div className="space-y-2 mt-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-500" />
            <span>
              {format(new Date(event.date), 'EEE, MMM d, yyyy')}
              {event.time && ` at ${event.time}`}
            </span>
          </div>
          
          {!event.is_online && event.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-500" />
              <span className="line-clamp-1">{event.venue}, {event.location_city}</span>
            </div>
          )}

          {event.organizer && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-500" />
              <span>{event.organizer}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-slate-500 mt-3 line-clamp-2">{event.description}</p>
        )}

        {event.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {event.specialties.slice(0, 3).map((spec, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-slate-50">
                {spec}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          {!isPast && (
            <>
              <Button 
                variant={isInterested ? "secondary" : "outline"}
                size="sm"
                className="flex-1"
                onClick={onInterested}
              >
                {isInterested ? 'Interested ✓' : 'Interested'}
              </Button>
              {event.registration_link ? (
                <Button 
                  size="sm"
                  className="flex-1 bg-teal-500 hover:bg-teal-600"
                  onClick={() => window.open(event.registration_link, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Register
                </Button>
              ) : (
                <Button 
                  variant={isAttending ? "secondary" : "default"}
                  size="sm"
                  className={cn("flex-1", !isAttending && "bg-teal-500 hover:bg-teal-600")}
                  onClick={onAttend}
                >
                  {isAttending ? 'Attending ✓' : 'Attend'}
                </Button>
              )}
            </>
          )}
          {isPast && (
            <span className="text-sm text-slate-400">Event ended</span>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
          <span>{event.attendees?.length || 0} attending</span>
          <span>{event.interested?.length || 0} interested</span>
        </div>
      </div>
    </div>
  );
}