import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Settings, LogOut, Shield, GraduationCap, Building2, MapPin, Award, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProfileSetup from '@/components/profile/ProfileSetup';
import { cn } from '@/lib/utils';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: profiles = [], refetch } = useQuery({
    queryKey: ['myProfile', user?.email],
    queryFn: () => base44.entities.DoctorProfile.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const profile = profiles[0];

  const { data: myCases = [] } = useQuery({
    queryKey: ['myCases', user?.email],
    queryFn: () => base44.entities.PatientCase.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: myComments = [] } = useQuery({
    queryKey: ['myComments', user?.email],
    queryFn: () => base44.entities.CaseComment.filter({ commenter_id: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (profile?.id) {
        await base44.entities.DoctorProfile.update(profile.id, data);
      } else {
        await base44.entities.DoctorProfile.create(data);
      }
    },
    onSuccess: () => {
      refetch();
      setIsEditing(false);
    }
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';
  const qualificationString = profile?.qualifications?.map(q => q.degree).join(', ') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {profile?.profile_photo ? (
              <img 
                src={profile.profile_photo} 
                alt={profile.full_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30">
                {initials}
              </div>
            )}
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {profile?.full_name || user?.full_name || 'Doctor'}
              </h1>
              {qualificationString && (
                <p className="text-teal-100 mt-1 flex items-center justify-center md:justify-start gap-1">
                  <GraduationCap className="w-4 h-4" />
                  {qualificationString}
                </p>
              )}
              <p className="text-teal-100 mt-1">
                {profile?.specialty} {profile?.sub_specialty && `• ${profile.sub_specialty}`}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                {profile?.is_verified && (
                  <Badge className="bg-white/20 text-white">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {profile?.location_city && (
                  <Badge variant="outline" className="border-white/30 text-white">
                    <MapPin className="w-3 h-3 mr-1" />
                    {profile?.location_city}, {profile?.location_country}
                  </Badge>
                )}
              </div>
            </div>
            <div className="md:ml-auto flex gap-2">
              <Button 
                variant="secondary" 
                className="bg-white/20 text-white hover:bg-white/30"
                onClick={() => setIsEditing(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button 
                variant="secondary" 
                className="bg-white/20 text-white hover:bg-white/30"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isEditing ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileSetup 
                initialData={profile}
                onSave={(data) => updateProfileMutation.mutate(data)}
                loading={updateProfileMutation.isPending}
              />
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="about">
            <TabsList className="w-full bg-white border mb-6">
              <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
              <TabsTrigger value="qualifications" className="flex-1">Qualifications</TabsTrigger>
              <TabsTrigger value="cases" className="flex-1">My Cases ({myCases.length})</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1">Activity ({myComments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <div className="space-y-6">
                {/* Bio */}
                {profile?.bio && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600">{profile.bio}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Professional Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Specialty</p>
                        <p className="font-medium">{profile?.specialty || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Sub-specialty</p>
                        <p className="font-medium">{profile?.sub_specialty || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Experience</p>
                        <p className="font-medium">
                          {profile?.years_experience ? `${profile.years_experience} years` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Registration No.</p>
                        <p className="font-medium">{profile?.registration_number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Institution</p>
                        <p className="font-medium">{profile?.institution_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Institution Type</p>
                        <p className="font-medium">{profile?.institution_type || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Interests */}
                {profile?.interests?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Interests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest, i) => (
                          <Badge key={i} variant="secondary">{interest}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contribution Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-2xl font-bold text-teal-600">{myCases.length}</p>
                        <p className="text-sm text-slate-500">Cases Posted</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-2xl font-bold text-teal-600">{profile?.response_count || 0}</p>
                        <p className="text-sm text-slate-500">Responses</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-2xl font-bold text-teal-600">{profile?.helpful_votes_received || 0}</p>
                        <p className="text-sm text-slate-500">Helpful Votes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="qualifications">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-teal-500" />
                    Qualifications & Degrees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile?.qualifications?.length > 0 ? (
                    <div className="space-y-4">
                      {profile.qualifications.map((qual, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-6 h-6 text-teal-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{qual.degree}</h4>
                            {qual.institution && (
                              <p className="text-slate-600">{qual.institution}</p>
                            )}
                            {qual.year && (
                              <p className="text-sm text-slate-500">Year: {qual.year}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p>No qualifications added yet</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsEditing(true)}
                      >
                        Add Qualifications
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cases">
              <div className="space-y-4">
                {myCases.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-slate-500">
                      <p>You haven't posted any cases yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  myCases.map(c => (
                    <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={cn(
                            "text-xs",
                            c.status === 'open' ? 'bg-green-100 text-green-700' :
                            c.status === 'resolved' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          )}>
                            {c.status}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-slate-800">{c.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{c.chief_complaint}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {c.discussion_count || 0} comments
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="space-y-4">
                {myComments.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-slate-500">
                      <p>You haven't commented on any cases yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  myComments.map(comment => (
                    <Card key={comment.id}>
                      <CardContent className="py-4">
                        {comment.is_treatment_suggestion && (
                          <Badge className="bg-teal-500 text-xs mb-2">Treatment Suggestion</Badge>
                        )}
                        <p className="text-slate-600 line-clamp-2">{comment.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {comment.likes || 0} likes
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {comment.replies?.length || 0} replies
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}