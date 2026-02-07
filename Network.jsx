import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Search, MapPin, Filter, Users, GraduationCap, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import DoctorCard from '@/components/cards/DoctorCard';

const specialties = [
  "All Specialties", "General Medicine", "Cardiology", "Neurology", "Pediatrics",
  "Orthopedics", "Dermatology", "Psychiatry", "Radiology", "Surgery",
  "Emergency Medicine", "Oncology", "Gynecology", "Ophthalmology", "ENT", "Anesthesiology", "Other"
];

export default function Network() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sortBy, setSortBy] = useState('response_rate');

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const profiles = await base44.entities.DoctorProfile.filter({ created_by: u.email });
      if (profiles.length > 0) setProfile(profiles[0]);
    };
    loadUser();
  }, []);

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['allDoctors'],
    queryFn: () => base44.entities.DoctorProfile.list('-created_date', 100),
  });

  // Filter and sort doctors
  const filteredAndSortedDoctors = doctors
    .filter(doctor => {
      if (doctor.created_by === user?.email) return false;
      
      const matchesSearch = searchQuery === '' || 
        doctor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.interests?.some(i => i.toLowerCase().includes(searchQuery.toLowerCase())) ||
        doctor.qualifications?.some(q => q.degree?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesSpecialty = selectedSpecialty === 'All Specialties' || 
        doctor.specialty === selectedSpecialty;
      
      const matchesLocation = selectedLocation === '' ||
        doctor.location_city?.toLowerCase().includes(selectedLocation.toLowerCase()) ||
        doctor.location_country?.toLowerCase().includes(selectedLocation.toLowerCase());

      return matchesSearch && matchesSpecialty && matchesLocation;
    })
    .sort((a, b) => {
      if (sortBy === 'response_rate') {
        // Sort by response count + helpful votes + qualifications count
        const scoreA = (a.response_count || 0) + (a.helpful_votes_received || 0) + (a.qualifications?.length || 0) * 5;
        const scoreB = (b.response_count || 0) + (b.helpful_votes_received || 0) + (b.qualifications?.length || 0) * 5;
        return scoreB - scoreA;
      } else if (sortBy === 'qualifications') {
        return (b.qualifications?.length || 0) - (a.qualifications?.length || 0);
      } else if (sortBy === 'experience') {
        return (b.years_experience || 0) - (a.years_experience || 0);
      }
      return 0;
    });

  const uniqueLocations = [...new Set(doctors.map(d => d.location_city).filter(Boolean))];

  const startConversation = async (doctor) => {
    const existingConvos = await base44.entities.Conversation.filter({
      participants: { $all: [user.email, doctor.created_by] }
    });

    if (existingConvos.length > 0) {
      window.location.href = createPageUrl(`Chats?conversationId=${existingConvos[0].id}`);
      return;
    }

    const newConvo = await base44.entities.Conversation.create({
      participants: [user.email, doctor.created_by],
      participant_names: [profile?.full_name || user.full_name, doctor.full_name],
      participant_photos: [profile?.profile_photo, doctor.profile_photo],
      unread_count: { [user.email]: 0, [doctor.created_by]: 0 }
    });

    window.location.href = createPageUrl(`Chats?conversationId=${newConvo.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-7 h-7 text-teal-500" />
                Doctor Network
              </h1>
              <p className="text-slate-500 mt-1">
                Connect with {doctors.length} verified doctors
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, degree..."
                  className="pl-10"
                />
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                    {(selectedSpecialty !== 'All Specialties' || selectedLocation) && (
                      <Badge className="bg-teal-500 text-white ml-1">
                        {[selectedSpecialty !== 'All Specialties', selectedLocation].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Doctors</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Specialty</label>
                      <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {specialties.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          value={selectedLocation}
                          onChange={(e) => setSelectedLocation(e.target.value)}
                          placeholder="City or country"
                          className="pl-10"
                        />
                      </div>
                      {uniqueLocations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {uniqueLocations.slice(0, 5).map(loc => (
                            <Badge
                              key={loc}
                              variant="outline"
                              className="cursor-pointer hover:bg-teal-50"
                              onClick={() => setSelectedLocation(loc)}
                            >
                              {loc}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sort By</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="response_rate">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              Response Rate & Qualifications
                            </div>
                          </SelectItem>
                          <SelectItem value="qualifications">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4" />
                              Most Qualifications
                            </div>
                          </SelectItem>
                          <SelectItem value="experience">Experience</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setSelectedSpecialty('All Specialties');
                        setSelectedLocation('');
                        setSortBy('response_rate');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedSpecialty !== 'All Specialties' || selectedLocation) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedSpecialty !== 'All Specialties' && (
                <Badge 
                  variant="secondary" 
                  className="gap-1 cursor-pointer"
                  onClick={() => setSelectedSpecialty('All Specialties')}
                >
                  {selectedSpecialty} ×
                </Badge>
              )}
              {selectedLocation && (
                <Badge 
                  variant="secondary" 
                  className="gap-1 cursor-pointer"
                  onClick={() => setSelectedLocation('')}
                >
                  <MapPin className="w-3 h-3" /> {selectedLocation} ×
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-slate-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-slate-200 rounded w-32 mb-2" />
                    <div className="h-4 bg-slate-200 rounded w-24 mb-1" />
                    <div className="h-4 bg-slate-200 rounded w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedDoctors.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Users className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No doctors found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedDoctors.map(doctor => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onMessage={() => startConversation(doctor)}
                isOnline={doctor.online_status === 'online'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}