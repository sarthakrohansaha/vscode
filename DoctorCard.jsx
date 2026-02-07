import React from 'react';
import { MapPin, Briefcase, MessageCircle, GraduationCap, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function DoctorCard({ doctor, onMessage, isOnline }) {
  const initials = doctor.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';
  const qualificationString = doctor.qualifications?.map(q => q.degree).join(', ') || '';

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="relative">
          {doctor.profile_photo ? (
            <img 
              src={doctor.profile_photo} 
              alt={doctor.full_name}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-lg">
              {initials}
            </div>
          )}
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800 truncate">{doctor.full_name}</h3>
            {doctor.is_verified && (
              <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-xs">
                Verified
              </Badge>
            )}
          </div>
          
          {qualificationString && (
            <div className="flex items-center gap-1 mt-0.5 text-sm text-teal-600 font-medium">
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="truncate">{qualificationString}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 mt-1 text-sm text-slate-600">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{doctor.specialty}</span>
            {doctor.sub_specialty && (
              <span className="text-slate-400">• {doctor.sub_specialty}</span>
            )}
          </div>
          
          <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
            <MapPin className="w-3.5 h-3.5" />
            <span>{doctor.location_city}, {doctor.location_country}</span>
          </div>

          {doctor.institution_name && (
            <p className="text-xs text-slate-400 mt-1 truncate">
              {doctor.institution_name}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      {(doctor.response_count > 0 || doctor.helpful_votes_received > 0) && (
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{doctor.response_count || 0} responses</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>{doctor.helpful_votes_received || 0} helpful</span>
          </div>
        </div>
      )}

      {doctor.bio && (
        <p className="text-sm text-slate-600 mt-3 line-clamp-2">{doctor.bio}</p>
      )}

      {doctor.interests?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {doctor.interests.slice(0, 3).map((interest, i) => (
            <Badge key={i} variant="outline" className="text-xs bg-slate-50">
              {interest}
            </Badge>
          ))}
          {doctor.interests.length > 3 && (
            <Badge variant="outline" className="text-xs bg-slate-50">
              +{doctor.interests.length - 3}
            </Badge>
          )}
        </div>
      )}

      <Button 
        onClick={onMessage}
        className="w-full mt-4 bg-teal-500 hover:bg-teal-600"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Message
      </Button>
    </div>
  );
}