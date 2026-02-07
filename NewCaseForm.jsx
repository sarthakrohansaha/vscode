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
import { Upload, X, FileText, Image } from 'lucide-react';

const specialties = [
  "General Medicine", "Cardiology", "Neurology", "Pediatrics", "Orthopedics",
  "Dermatology", "Psychiatry", "Radiology", "Surgery", "Emergency Medicine",
  "Oncology", "Gynecology", "Ophthalmology", "ENT", "Anesthesiology", "Other"
];

export default function NewCaseForm({ profile, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    patient_age: '',
    patient_gender: 'Not Specified',
    chief_complaint: '',
    history: '',
    examination_findings: '',
    investigations: '',
    current_treatment: '',
    question: '',
    specialty_tags: [],
    visibility: 'public'
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialty = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialty_tags: prev.specialty_tags.includes(specialty)
        ? prev.specialty_tags.filter(s => s !== specialty)
        : [...prev.specialty_tags, specialty]
    }));
  };

  const handleFileUpload = async (files) => {
    setUploading(true);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setAttachments(prev => [...prev, { url: file_url, name: file.name, type: file.type }]);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
    setUploading(false);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const qualifications = profile?.qualifications?.map(q => q.degree) || [];
      
      await base44.entities.PatientCase.create({
        ...formData,
        patient_age: parseInt(formData.patient_age) || null,
        attachments: attachments.map(a => a.url),
        poster_name: profile?.full_name || 'Doctor',
        poster_photo: profile?.profile_photo,
        poster_specialty: profile?.specialty,
        poster_qualifications: qualifications,
        status: 'open',
        discussion_count: 0,
        helpful_count: 0
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create case:', error);
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>Privacy Notice:</strong> Ensure all patient information is anonymized. 
        Remove names, specific dates, and any identifying information.
      </div>

      <div className="space-y-2">
        <Label>Case Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Brief descriptive title"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Patient Age</Label>
          <Input
            type="number"
            min="0"
            max="120"
            value={formData.patient_age}
            onChange={(e) => handleChange('patient_age', e.target.value)}
            placeholder="Age in years"
          />
        </div>
        <div className="space-y-2">
          <Label>Patient Gender</Label>
          <Select value={formData.patient_gender} onValueChange={(v) => handleChange('patient_gender', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
              <SelectItem value="Not Specified">Not Specified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Chief Complaint *</Label>
        <Textarea
          value={formData.chief_complaint}
          onChange={(e) => handleChange('chief_complaint', e.target.value)}
          placeholder="Main presenting complaint and duration"
          rows={2}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Relevant History</Label>
        <Textarea
          value={formData.history}
          onChange={(e) => handleChange('history', e.target.value)}
          placeholder="Past medical history, medications, allergies, social history..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Examination Findings</Label>
        <Textarea
          value={formData.examination_findings}
          onChange={(e) => handleChange('examination_findings', e.target.value)}
          placeholder="Relevant clinical examination findings"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Investigations</Label>
        <Textarea
          value={formData.investigations}
          onChange={(e) => handleChange('investigations', e.target.value)}
          placeholder="Lab results, imaging findings, etc."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Current Treatment</Label>
        <Textarea
          value={formData.current_treatment}
          onChange={(e) => handleChange('current_treatment', e.target.value)}
          placeholder="Current medications and management"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Your Question *</Label>
        <Textarea
          value={formData.question}
          onChange={(e) => handleChange('question', e.target.value)}
          placeholder="What specific help or advice are you seeking?"
          rows={2}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Relevant Specialties</Label>
        <div className="flex flex-wrap gap-2">
          {specialties.map(specialty => (
            <Badge
              key={specialty}
              variant={formData.specialty_tags.includes(specialty) ? "default" : "outline"}
              className={`cursor-pointer ${formData.specialty_tags.includes(specialty) ? 'bg-teal-500' : 'hover:bg-teal-50'}`}
              onClick={() => toggleSpecialty(specialty)}
            >
              {specialty}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Attachments (Anonymized)</Label>
        <div 
          className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-teal-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">Click to upload anonymized images or documents</p>
          <p className="text-xs text-slate-400 mt-1">Ensure all identifying information is removed</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => e.target.files && handleFileUpload(Array.from(e.target.files))}
        />
        
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
                {att.type?.startsWith('image') ? (
                  <Image className="w-4 h-4 text-teal-500" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-sm truncate max-w-32">{att.name}</span>
                <X 
                  className="w-4 h-4 text-slate-400 cursor-pointer hover:text-red-500"
                  onClick={() => removeAttachment(i)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Visibility</Label>
        <Select value={formData.visibility} onValueChange={(v) => handleChange('visibility', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public - Visible to all doctors</SelectItem>
            <SelectItem value="specialty_only">Specialty Only - Visible to selected specialties</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-teal-500 hover:bg-teal-600"
        disabled={saving || uploading}
      >
        {saving ? 'Submitting...' : 'Submit Case'}
      </Button>
    </form>
  );
}