import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Search, Plus, Filter, Briefcase, Tag } from 'lucide-react';
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
import CaseCard from '@/components/cards/CaseCard';
import NewCaseForm from '@/components/cases/NewCaseForm';

const specialties = [
  "All", "General Medicine", "Cardiology", "Neurology", "Pediatrics",
  "Orthopedics", "Dermatology", "Psychiatry", "Radiology", "Surgery",
  "Emergency Medicine", "Oncology", "Gynecology", "Ophthalmology", "ENT", "Other"
];

export default function Cases() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [showNewCase, setShowNewCase] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const profiles = await base44.entities.DoctorProfile.filter({ created_by: u.email });
      if (profiles.length > 0) setProfile(profiles[0]);
    };
    loadUser();
  }, []);

  const { data: cases = [], isLoading, refetch } = useQuery({
    queryKey: ['allCases'],
    queryFn: () => base44.entities.PatientCase.list('-created_date', 100),
  });

  const filteredCases = cases.filter(c => {
    const matchesSearch = searchQuery === '' ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.chief_complaint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.question?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    const matchesSpecialty = specialtyFilter === 'All' ||
      c.specialty_tags?.includes(specialtyFilter);

    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  const handleNewCaseCreated = () => {
    setShowNewCase(false);
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
                <Briefcase className="w-7 h-7 text-teal-500" />
                Patient Cases
              </h1>
              <p className="text-slate-500 mt-1">
                Discuss challenging cases with peers
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cases..."
                  className="pl-10"
                />
              </div>

              <Dialog open={showNewCase} onOpenChange={setShowNewCase}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-500 hover:bg-teal-600 gap-2">
                    <Plus className="w-4 h-4" />
                    New Case
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Submit a New Case</DialogTitle>
                  </DialogHeader>
                  <NewCaseForm 
                    profile={profile} 
                    onSuccess={handleNewCaseCreated}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="bg-slate-100">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-48">
                <Tag className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {specialties.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-20 mb-3" />
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Briefcase className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No cases found</h3>
            <p className="text-slate-500 mt-1">Be the first to submit a case for discussion</p>
            <Button 
              className="mt-4 bg-teal-500 hover:bg-teal-600"
              onClick={() => setShowNewCase(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Submit a Case
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCases.map(patientCase => (
              <CaseCard
                key={patientCase.id}
                patientCase={patientCase}
                onClick={() => window.location.href = createPageUrl(`CaseDetails?id=${patientCase.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}