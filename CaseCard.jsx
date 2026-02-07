import React from 'react';
import { MessageSquare, ThumbsUp, Clock, User, Tag, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusColors = {
  open: 'bg-green-100 text-green-700',
  resolved: 'bg-blue-100 text-blue-700',
  closed: 'bg-slate-100 text-slate-600'
};

export default function CaseCard({ patientCase, onClick }) {
  const initials = patientCase.poster_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';
  const qualificationString = patientCase.poster_qualifications?.join(', ') || '';

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("text-xs", statusColors[patientCase.status])}>
              {patientCase.status}
            </Badge>
            {patientCase.visibility === 'specialty_only' && (
              <Badge variant="outline" className="text-xs">
                Specialty Only
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-slate-800 mt-2 line-clamp-1">{patientCase.title}</h3>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <User className="w-3.5 h-3.5" />
          <span>{patientCase.patient_age}y {patientCase.patient_gender}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{format(new Date(patientCase.created_date), 'MMM d')}</span>
        </div>
      </div>

      <p className="text-sm text-slate-600 mt-3 line-clamp-2">
        <span className="font-medium">CC:</span> {patientCase.chief_complaint}
      </p>

      {patientCase.question && (
        <p className="text-sm text-teal-700 mt-2 line-clamp-2 bg-teal-50 p-2 rounded-lg">
          <span className="font-medium">Q:</span> {patientCase.question}
        </p>
      )}

      {patientCase.specialty_tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {patientCase.specialty_tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="outline" className="text-xs bg-slate-50">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {patientCase.poster_photo ? (
            <img src={patientCase.poster_photo} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-semibold">
              {initials.slice(0, 1)}
            </div>
          )}
          <div className="text-xs">
            <span className="font-medium text-slate-700">{patientCase.poster_name}</span>
            {qualificationString && (
              <span className="text-teal-600 ml-1 flex items-center gap-0.5 inline-flex">
                <GraduationCap className="w-3 h-3" />
                {qualificationString}
              </span>
            )}
            {patientCase.poster_specialty && !qualificationString && (
              <span className="text-slate-500"> • {patientCase.poster_specialty}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{patientCase.discussion_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{patientCase.helpful_count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}