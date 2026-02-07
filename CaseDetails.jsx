import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, User, Clock, Tag, ThumbsUp, ThumbsDown, MessageSquare, 
  Send, FileText, ExternalLink, CheckCircle, Reply, GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const statusColors = {
  open: 'bg-green-100 text-green-700',
  resolved: 'bg-blue-100 text-blue-700',
  closed: 'bg-slate-100 text-slate-600'
};

export default function CaseDetails() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isTreatmentSuggestion, setIsTreatmentSuggestion] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const profiles = await base44.entities.DoctorProfile.filter({ created_by: u.email });
      if (profiles.length > 0) setProfile(profiles[0]);
    };
    loadUser();
  }, []);

  const { data: patientCase, isLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      const cases = await base44.entities.PatientCase.filter({ id: caseId });
      return cases[0];
    },
    enabled: !!caseId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['caseComments', caseId],
    queryFn: () => base44.entities.CaseComment.filter({ case_id: caseId }),
    enabled: !!caseId,
  });

  // Sort comments by response rate and qualifications
  const sortedComments = [...comments].sort((a, b) => {
    const scoreA = (a.likes - a.dislikes) + (a.commenter_qualifications?.length || 0) * 2;
    const scoreB = (b.likes - b.dislikes) + (b.commenter_qualifications?.length || 0) * 2;
    return scoreB - scoreA;
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      const qualifications = profile?.qualifications?.map(q => q.degree) || [];
      
      await base44.entities.CaseComment.create({
        case_id: caseId,
        commenter_id: user.email,
        commenter_name: profile?.full_name || user.full_name,
        commenter_specialty: profile?.specialty,
        commenter_qualifications: qualifications,
        commenter_photo: profile?.profile_photo,
        content: newComment,
        is_treatment_suggestion: isTreatmentSuggestion,
        likes: 0,
        dislikes: 0,
        liked_by: [],
        disliked_by: [],
        replies: []
      });

      // Update profile response count
      if (profile?.id) {
        await base44.entities.DoctorProfile.update(profile.id, {
          response_count: (profile.response_count || 0) + 1
        });
      }

      await base44.entities.PatientCase.update(caseId, {
        discussion_count: (patientCase.discussion_count || 0) + 1
      });
    },
    onSuccess: () => {
      setNewComment('');
      setIsTreatmentSuggestion(false);
      queryClient.invalidateQueries(['caseComments', caseId]);
      queryClient.invalidateQueries(['case', caseId]);
    }
  });

  const voteMutation = useMutation({
    mutationFn: async ({ comment, voteType }) => {
      const hasLiked = comment.liked_by?.includes(user.email);
      const hasDisliked = comment.disliked_by?.includes(user.email);
      
      let newLikes = comment.likes || 0;
      let newDislikes = comment.dislikes || 0;
      let newLikedBy = [...(comment.liked_by || [])];
      let newDislikedBy = [...(comment.disliked_by || [])];

      if (voteType === 'like') {
        if (hasLiked) {
          newLikes--;
          newLikedBy = newLikedBy.filter(id => id !== user.email);
        } else {
          newLikes++;
          newLikedBy.push(user.email);
          if (hasDisliked) {
            newDislikes--;
            newDislikedBy = newDislikedBy.filter(id => id !== user.email);
          }
        }
      } else {
        if (hasDisliked) {
          newDislikes--;
          newDislikedBy = newDislikedBy.filter(id => id !== user.email);
        } else {
          newDislikes++;
          newDislikedBy.push(user.email);
          if (hasLiked) {
            newLikes--;
            newLikedBy = newLikedBy.filter(id => id !== user.email);
          }
        }
      }

      await base44.entities.CaseComment.update(comment.id, {
        likes: newLikes,
        dislikes: newDislikes,
        liked_by: newLikedBy,
        disliked_by: newDislikedBy
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['caseComments', caseId]);
    }
  });

  const addReplyMutation = useMutation({
    mutationFn: async (comment) => {
      const newReply = {
        id: Date.now().toString(),
        user_id: user.email,
        user_name: profile?.full_name || user.full_name,
        user_photo: profile?.profile_photo,
        content: replyContent,
        created_at: new Date().toISOString()
      };

      await base44.entities.CaseComment.update(comment.id, {
        replies: [...(comment.replies || []), newReply]
      });
    },
    onSuccess: () => {
      setReplyContent('');
      setReplyingTo(null);
      queryClient.invalidateQueries(['caseComments', caseId]);
    }
  });

  const markResolvedMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.PatientCase.update(caseId, { status: 'resolved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['case', caseId]);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!patientCase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-700">Case not found</h2>
          <Link to={createPageUrl('Cases')}>
            <Button className="mt-4" variant="outline">Back to Cases</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = patientCase.created_by === user?.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to={createPageUrl('Cases')} className="inline-flex items-center text-slate-600 hover:text-teal-600 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Cases
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn("text-xs", statusColors[patientCase.status])}>
                  {patientCase.status}
                </Badge>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 mt-2">{patientCase.title}</h1>
            </div>
            {isOwner && patientCase.status === 'open' && (
              <Button 
                variant="outline" 
                className="shrink-0 gap-2"
                onClick={() => markResolvedMutation.mutate()}
              >
                <CheckCircle className="w-4 h-4" />
                Mark Resolved
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{patientCase.patient_age}y {patientCase.patient_gender}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{format(new Date(patientCase.created_date), 'MMM d, yyyy')}</span>
                </div>
              </div>

              {patientCase.specialty_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {patientCase.specialty_tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-slate-50">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Case Details */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Chief Complaint</h3>
                <p className="text-slate-600">{patientCase.chief_complaint}</p>
              </div>

              {patientCase.history && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">History</h3>
                  <p className="text-slate-600 whitespace-pre-wrap">{patientCase.history}</p>
                </div>
              )}

              {patientCase.examination_findings && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Examination Findings</h3>
                  <p className="text-slate-600 whitespace-pre-wrap">{patientCase.examination_findings}</p>
                </div>
              )}

              {patientCase.investigations && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Investigations</h3>
                  <p className="text-slate-600 whitespace-pre-wrap">{patientCase.investigations}</p>
                </div>
              )}

              {patientCase.current_treatment && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Current Treatment</h3>
                  <p className="text-slate-600 whitespace-pre-wrap">{patientCase.current_treatment}</p>
                </div>
              )}

              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="font-semibold text-teal-800 mb-2">Question</h3>
                <p className="text-teal-700">{patientCase.question}</p>
              </div>
            </div>

            {/* Attachments */}
            {patientCase.attachments?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-4">Attachments</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {patientCase.attachments.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square bg-slate-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity relative group"
                    >
                      {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-12 h-12 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Discussion */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-500" />
                Discussion ({comments.length})
              </h3>

              {/* Add Comment */}
              <div className="mb-6">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your insights, suggestions, or questions..."
                  rows={3}
                  className="mb-3"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="treatment"
                      checked={isTreatmentSuggestion}
                      onCheckedChange={setIsTreatmentSuggestion}
                    />
                    <Label htmlFor="treatment" className="text-sm text-slate-600">
                      Treatment Suggestion
                    </Label>
                  </div>
                  <Button
                    onClick={() => addCommentMutation.mutate()}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    className="bg-teal-500 hover:bg-teal-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </Button>
                </div>
              </div>

              {/* Comments List - Sorted by response rate and qualifications */}
              <div className="space-y-4">
                {sortedComments.map(comment => {
                  const initials = comment.commenter_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';
                  const hasLiked = comment.liked_by?.includes(user?.email);
                  const hasDisliked = comment.disliked_by?.includes(user?.email);

                  return (
                    <div 
                      key={comment.id} 
                      className={cn(
                        "p-4 rounded-xl",
                        comment.is_treatment_suggestion 
                          ? "bg-teal-50 border border-teal-200" 
                          : "bg-slate-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {comment.commenter_photo ? (
                          <img src={comment.commenter_photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-800">{comment.commenter_name}</span>
                            {comment.commenter_qualifications?.length > 0 && (
                              <span className="text-xs text-teal-600 font-medium flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />
                                {comment.commenter_qualifications.join(', ')}
                              </span>
                            )}
                            {comment.commenter_specialty && (
                              <span className="text-xs text-slate-500">• {comment.commenter_specialty}</span>
                            )}
                            {comment.is_treatment_suggestion && (
                              <Badge className="bg-teal-500 text-xs">Treatment Suggestion</Badge>
                            )}
                          </div>
                          <p className="text-slate-600 mt-2 whitespace-pre-wrap">{comment.content}</p>
                          
                          {/* Like/Dislike/Reply buttons */}
                          <div className="flex items-center gap-4 mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn("gap-1 h-8", hasLiked && "text-teal-600")}
                              onClick={() => voteMutation.mutate({ comment, voteType: 'like' })}
                            >
                              <ThumbsUp className="w-4 h-4" />
                              {comment.likes || 0}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn("gap-1 h-8", hasDisliked && "text-red-500")}
                              onClick={() => voteMutation.mutate({ comment, voteType: 'dislike' })}
                            >
                              <ThumbsDown className="w-4 h-4" />
                              {comment.dislikes || 0}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 h-8"
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            >
                              <Reply className="w-4 h-4" />
                              Reply
                            </Button>
                            <span className="text-xs text-slate-400">
                              {format(new Date(comment.created_date), 'MMM d, HH:mm')}
                            </span>
                          </div>

                          {/* Reply Input */}
                          {replyingTo === comment.id && (
                            <div className="mt-3 flex gap-2">
                              <Input
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={() => addReplyMutation.mutate(comment)}
                                disabled={!replyContent.trim()}
                                className="bg-teal-500 hover:bg-teal-600"
                              >
                                Reply
                              </Button>
                            </div>
                          )}

                          {/* Replies */}
                          {comment.replies?.length > 0 && (
                            <div className="mt-3 space-y-2 pl-4 border-l-2 border-slate-200">
                              {comment.replies.map(reply => (
                                <div key={reply.id} className="flex items-start gap-2">
                                  {reply.user_photo ? (
                                    <img src={reply.user_photo} alt="" className="w-6 h-6 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-white text-xs font-semibold">
                                      {reply.user_name?.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-sm font-medium text-slate-700">{reply.user_name}</span>
                                    <p className="text-sm text-slate-600">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {comments.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <p>No comments yet. Be the first to contribute!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Posted By */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-4">Posted By</h3>
              <div className="flex items-center gap-3">
                {patientCase.poster_photo ? (
                  <img src={patientCase.poster_photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold">
                    {patientCase.poster_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-800">{patientCase.poster_name}</p>
                  {patientCase.poster_qualifications?.length > 0 && (
                    <p className="text-xs text-teal-600 font-medium">
                      {patientCase.poster_qualifications.join(', ')}
                    </p>
                  )}
                  {patientCase.poster_specialty && (
                    <p className="text-sm text-slate-500">{patientCase.poster_specialty}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Discussions</span>
                  <span className="font-semibold">{patientCase.discussion_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Helpful Votes</span>
                  <span className="font-semibold">{patientCase.helpful_count || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}