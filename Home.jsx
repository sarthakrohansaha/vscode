import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MessageCircle, Users, Calendar, Briefcase, ArrowRight, GraduationCap, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DoctorCard from '@/components/cards/DoctorCard';
import CaseCard from '@/components/cards/CaseCard';
import EventCard from '@/components/cards/EventCard';
import ProfileSetup from '@/components/profile/ProfileSetup';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Home() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: myProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['myProfile', user?.email],
    queryFn: () => base44.entities.DoctorProfile.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (myProfile?.length > 0) {
      setProfile(myProfile[0]);
    } else if (myProfile && myProfile.length === 0 && user) {
      setShowProfileSetup(true);
    }
  }, [myProfile, user]);

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => base44.entities.DoctorProfile.list('-created_date', 100),
  });

  // Sort doctors by response rate and qualifications
  const sortedDoctors = [...doctors]
    .filter(d => d.created_by !== user?.email)
    .sort((a, b) => {
      const scoreA = (a.response_count || 0) + (a.helpful_votes_received || 0) + (a.qualifications?.length || 0) * 5;
      const scoreB = (b.response_count || 0) + (b.helpful_votes_received || 0) + (b.qualifications?.length || 0) * 5;
      return scoreB - scoreA;
    })
    .slice(0, 6);

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.PatientCase.filter({ status: 'open' }, '-created_date', 4),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.MedicalEvent.list('date', 3),
  });

  const handleSaveProfile = async (profileData) => {
    setSaving(true);
    try {
      if (profile?.id) {
        await base44.entities.DoctorProfile.update(profile.id, profileData);
      } else {
        await base44.entities.DoctorProfile.create({
          ...profileData,
          response_count: 0,
          helpful_votes_received: 0
        });
      }
      refetchProfile();
      setShowProfileSetup(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
    setSaving(false);
  };

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
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Connect with Fellow Doctors
            </h1>
            <p className="mt-4 text-teal-100 text-lg">
              A professional network for doctors to discuss cases, share knowledge, and grow together.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to={createPageUrl('Network')}>
                <Button size="lg" className="bg-white text-teal-600 hover:bg-teal-50">
                  <Users className="w-5 h-5 mr-2" />
                  Find Doctors
                </Button>
              </Link>
              <Link to={createPageUrl('Cases')}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Browse Cases
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-8 mb-12">
          {[
            { icon: Users, label: 'Doctors', value: doctors.length, color: 'bg-teal-500' },
            { icon: Briefcase, label: 'Open Cases', value: cases.length, color: 'bg-blue-500' },
            { icon: Calendar, label: 'Upcoming Events', value: events.length, color: 'bg-purple-500' },
            { icon: MessageCircle, label: 'Discussions', value: '24/7', color: 'bg-orange-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Top Doctors Section - Sorted by response rate and qualifications */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Top Contributors</h2>
              <p className="text-slate-500">Doctors with highest response rates and qualifications</p>
            </div>
            <Link to={createPageUrl('Network')}>
              <Button variant="ghost" className="text-teal-600">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDoctors.slice(0, 3).map(doctor => (
              <DoctorCard 
                key={doctor.id} 
                doctor={doctor} 
                onMessage={() => startConversation(doctor)}
                isOnline={doctor.online_status === 'online'}
              />
            ))}
          </div>
        </section>

        {/* Cases Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Open Cases</h2>
              <p className="text-slate-500">Help fellow doctors with challenging cases</p>
            </div>
            <Link to={createPageUrl('Cases')}>
              <Button variant="ghost" className="text-teal-600">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.slice(0, 4).map(patientCase => (
              <CaseCard 
                key={patientCase.id} 
                patientCase={patientCase}
                onClick={() => window.location.href = createPageUrl(`CaseDetails?id=${patientCase.id}`)}
              />
            ))}
          </div>
        </section>

        {/* Events Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Upcoming Events</h2>
              <p className="text-slate-500">Conferences, workshops, and CME opportunities</p>
            </div>
            <Link to={createPageUrl('Events')}>
              <Button variant="ghost" className="text-teal-600">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.slice(0, 3).map(event => (
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
      </div>

      {/* Profile Setup Dialog */}
      <Dialog open={showProfileSetup} onOpenChange={setShowProfileSetup}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create Your Profile</DialogTitle>
          </DialogHeader>
          <p className="text-slate-500 mb-4">
            Complete your profile to connect with other doctors.
          </p>
          <ProfileSetup 
            onSave={handleSaveProfile} 
            initialData={profile}
            loading={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}