import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stethoscope, MapPin, Building2, GraduationCap, X, Plus, Upload, Camera } from 'lucide-react';

const specialties = [
  "General Medicine", "Cardiology", "Neurology", "Pediatrics", "Orthopedics",
  "Dermatology", "Psychiatry", "Radiology", "Surgery", "Emergency Medicine",
  "Oncology", "Gynecology", "Ophthalmology", "ENT", "Anesthesiology", "Other"
];

const institutionTypes = [
  "Government Hospital", "Private Hospital", "Clinic", 
  "Medical College", "Research Institute", "Other"
];

const commonDegrees = ["MBBS", "MD", "MS", "DNB", "DM", "MCh", "FRCS", "MRCP", "DCH", "DA", "FCPS"];

const suggestedInterests = [
  "Clinical Research", "Medical Education", "Public Health", "Digital Health",
  "Rare Diseases", "Emergency Care", "Chronic Disease Management", "Preventive Medicine"
];

export default function ProfileSetup({ onSave, initialData, loading }) {
  const [profile, setProfile] = useState(initialData || {
    full_name: '',
    profile_photo: '',
    specialty: '',
    sub_specialty: '',
    qualifications: [],
    registration_number: '',
    location_city: '',
    location_country: '',
    years_experience: '',
    institution_name: '',
    institution_type: '',
    bio: '',
    interests: []
  });
  const [interestInput, setInterestInput] = useState('');
  const [newQualification, setNewQualification] = useState({ degree: '', institution: '', year: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoUpload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfile(p => ({ ...p, profile_photo: file_url }));
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const addQualification = () => {
    if (newQualification.degree) {
      setProfile(p => ({
        ...p,
        qualifications: [...(p.qualifications || []), { ...newQualification, year: parseInt(newQualification.year) || null }]
      }));
      setNewQualification({ degree: '', institution: '', year: '' });
    }
  };

  const removeQualification = (index) => {
    setProfile(p => ({
      ...p,
      qualifications: p.qualifications.filter((_, i) => i !== index)
    }));
  };

  const addInterest = (interest) => {
    if (interest && !profile.interests.includes(interest)) {
      setProfile(p => ({ ...p, interests: [...p.interests, interest] }));
    }
    setInterestInput('');
  };

  const removeInterest = (interest) => {
    setProfile(p => ({ ...p, interests: p.interests.filter(i => i !== interest) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(profile);
  };

  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Photo */}
      <div className="text-center mb-8">
        <div 
          className="w-24 h-24 rounded-full mx-auto relative cursor-pointer group overflow-hidden bg-slate-200"
          onClick={() => fileInputRef.current?.click()}
        >
          {profile.profile_photo ? (
            <img src={profile.profile_photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
              {initials}
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
        />
        <p className="text-xs text-slate-500 mt-2">Click to upload photo</p>
      </div>

      <div className="space-y-2">
        <Label>Full Name *</Label>
        <Input
          value={profile.full_name}
          onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
          placeholder="Dr. John Smith"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-500" />
            Specialty *
          </Label>
          <Select 
            value={profile.specialty} 
            onValueChange={v => setProfile(p => ({ ...p, specialty: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select specialty" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Sub-specialty</Label>
          <Input
            value={profile.sub_specialty}
            onChange={e => setProfile(p => ({ ...p, sub_specialty: e.target.value }))}
            placeholder="e.g., Interventional Cardiology"
          />
        </div>
      </div>

      {/* Qualifications Section */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-teal-500" />
          Qualifications & Degrees
        </Label>
        
        {profile.qualifications?.length > 0 && (
          <div className="space-y-2">
            {profile.qualifications.map((qual, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-semibold text-teal-700">{qual.degree}</span>
                  {qual.institution && <span className="text-slate-600"> - {qual.institution}</span>}
                  {qual.year && <span className="text-slate-400"> ({qual.year})</span>}
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeQualification(i)}>
                  <X className="w-4 h-4 text-slate-400" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-3">
            <Select value={newQualification.degree} onValueChange={v => setNewQualification(q => ({ ...q, degree: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Degree" />
              </SelectTrigger>
              <SelectContent>
                {commonDegrees.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-5">
            <Input
              value={newQualification.institution}
              onChange={e => setNewQualification(q => ({ ...q, institution: e.target.value }))}
              placeholder="Institution"
            />
          </div>
          <div className="col-span-2">
            <Input
              type="number"
              value={newQualification.year}
              onChange={e => setNewQualification(q => ({ ...q, year: e.target.value }))}
              placeholder="Year"
            />
          </div>
          <div className="col-span-2">
            <Button type="button" variant="outline" className="w-full" onClick={addQualification}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Medical Registration Number</Label>
        <Input
          value={profile.registration_number}
          onChange={e => setProfile(p => ({ ...p, registration_number: e.target.value }))}
          placeholder="e.g., MCI-12345"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-500" />
            City *
          </Label>
          <Input
            value={profile.location_city}
            onChange={e => setProfile(p => ({ ...p, location_city: e.target.value }))}
            placeholder="Your city"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Country *</Label>
          <Input
            value={profile.location_country}
            onChange={e => setProfile(p => ({ ...p, location_country: e.target.value }))}
            placeholder="Your country"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Years of Experience</Label>
          <Input
            type="number"
            min="0"
            max="50"
            value={profile.years_experience}
            onChange={e => setProfile(p => ({ ...p, years_experience: parseInt(e.target.value) || '' }))}
            placeholder="Years since graduation"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-500" />
            Institution Type
          </Label>
          <Select 
            value={profile.institution_type} 
            onValueChange={v => setProfile(p => ({ ...p, institution_type: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {institutionTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Current Institution/Hospital</Label>
        <Input
          value={profile.institution_name}
          onChange={e => setProfile(p => ({ ...p, institution_name: e.target.value }))}
          placeholder="Hospital or clinic name"
        />
      </div>

      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea
          value={profile.bio}
          onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
          placeholder="Tell others about your medical experience and expertise..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Interests</Label>
        <div className="flex gap-2">
          <Input
            value={interestInput}
            onChange={e => setInterestInput(e.target.value)}
            placeholder="Add an interest"
            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addInterest(interestInput))}
          />
          <Button type="button" variant="outline" onClick={() => addInterest(interestInput)}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {profile.interests.map(interest => (
            <Badge key={interest} variant="secondary" className="gap-1">
              {interest}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeInterest(interest)} />
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestedInterests.filter(i => !profile.interests.includes(i)).slice(0, 4).map(interest => (
            <Badge 
              key={interest} 
              variant="outline" 
              className="cursor-pointer hover:bg-teal-50"
              onClick={() => addInterest(interest)}
            >
              + {interest}
            </Badge>
          ))}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-teal-500 hover:bg-teal-600"
        disabled={loading || uploading}
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  );
}