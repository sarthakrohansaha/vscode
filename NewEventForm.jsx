import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Image } from 'lucide-react';

const eventTypes = [
  "Conference", "Workshop", "Seminar", "CME", "Webinar", "Meetup", "Training", "Other"
];

const specialties = [
  "General Medicine", "Cardiology", "Neurology", "Pediatrics", "Orthopedics",
  "Dermatology", "Psychiatry", "Radiology", "Surgery", "Emergency Medicine",
  "Oncology", "Gynecology", "Ophthalmology", "ENT", "Anesthesiology", "Other"
];

export default function NewEventForm({ onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'Conference',
    specialties: [],
    date: '',
    time: '',
    end_date: '',
    location_city: '',
    location_country: '',
    venue: '',
    is_online: false,
    online_link: '',
    registration_link: '',
    is_free: false,
    price: '',
    organizer: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialty = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await base44.entities.MedicalEvent.create({
        ...formData,
        image_url: imageUrl,
        attendees: [],
        interested: []
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create event:', error);
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Event Image</Label>
        {imageUrl ? (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setImageUrl('')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div 
            className="aspect-video border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-teal-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              <Image className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Click to upload event image</p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
        />
      </div>

      <div className="space-y-2">
        <Label>Event Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Event title"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Event Type *</Label>
          <Select value={formData.event_type} onValueChange={(v) => handleChange('event_type', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Organizer</Label>
          <Input
            value={formData.organizer}
            onChange={(e) => handleChange('organizer', e.target.value)}
            placeholder="Organization name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Event description and agenda"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Time</Label>
          <Input
            type="time"
            value={formData.time}
            onChange={(e) => handleChange('time', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>End Date (if multi-day)</Label>
        <Input
          type="date"
          value={formData.end_date}
          onChange={(e) => handleChange('end_date', e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Switch
            id="online"
            checked={formData.is_online}
            onCheckedChange={(v) => handleChange('is_online', v)}
          />
          <Label htmlFor="online">Online Event</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="free"
            checked={formData.is_free}
            onCheckedChange={(v) => handleChange('is_free', v)}
          />
          <Label htmlFor="free">Free Event</Label>
        </div>
      </div>

      {formData.is_online ? (
        <div className="space-y-2">
          <Label>Online Event Link</Label>
          <Input
            value={formData.online_link}
            onChange={(e) => handleChange('online_link', e.target.value)}
            placeholder="https://zoom.us/j/..."
          />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Venue</Label>
            <Input
              value={formData.venue}
              onChange={(e) => handleChange('venue', e.target.value)}
              placeholder="Venue name and address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={formData.location_city}
                onChange={(e) => handleChange('location_city', e.target.value)}
                placeholder="City"
              />
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={formData.location_country}
                onChange={(e) => handleChange('location_country', e.target.value)}
                placeholder="Country"
              />
            </div>
          </div>
        </>
      )}

      {!formData.is_free && (
        <div className="space-y-2">
          <Label>Price</Label>
          <Input
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            placeholder="e.g., $50, Free for students"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Registration Link</Label>
        <Input
          value={formData.registration_link}
          onChange={(e) => handleChange('registration_link', e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label>Relevant Specialties</Label>
        <div className="flex flex-wrap gap-2">
          {specialties.map(specialty => (
            <Badge
              key={specialty}
              variant={formData.specialties.includes(specialty) ? "default" : "outline"}
              className={`cursor-pointer ${formData.specialties.includes(specialty) ? 'bg-teal-500' : 'hover:bg-teal-50'}`}
              onClick={() => toggleSpecialty(specialty)}
            >
              {specialty}
            </Badge>
          ))}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-teal-500 hover:bg-teal-600"
        disabled={saving || uploading}
      >
        {saving ? 'Creating...' : 'Create Event'}
      </Button>
    </form>
  );
}