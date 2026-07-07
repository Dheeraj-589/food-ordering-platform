'use client';

import React, { useState, useEffect } from 'react';
import { Star, Check, X, CornerDownRight, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Review } from './types';
import { useToastStore } from '@/store/toastStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ReviewsTab() {
  const { addToast } = useToastStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Reply Modal States
  const [replyOpen, setReplyOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReviews = async () => {
    try {
      const response = await api.get('/admin/reviews');
      setReviews(response.data);
    } catch (err) {
      console.error(err);
      addToast('Could not load reviews feed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (
    reviewId: number,
    status: 'pending' | 'approved' | 'rejected',
  ) => {
    try {
      await api.patch(`/admin/reviews/${reviewId}/status`, { status });
      addToast(`Review marked as ${status}!`, 'success');
      fetchReviews();
    } catch (err) {
      console.error(err);
      addToast('Failed to moderate review status.', 'error');
    }
  };

  const handleOpenReply = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.reply || '');
    setReplyOpen(true);
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    setActionLoading(true);
    try {
      await api.post(`/admin/reviews/${selectedReview.id}/reply`, { reply: replyText.trim() });
      addToast('Posted administrator response reply!', 'success');
      setReplyOpen(false);
      fetchReviews();
    } catch (err) {
      console.error(err);
      addToast('Could not reply to review.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAbuse = async (reviewId: number) => {
    try {
      await api.post(`/admin/reviews/${reviewId}/report`);
      addToast('Review flagged as abuse. Reported to moderation desk.', 'info');
      fetchReviews();
    } catch (err) {
      console.error(err);
      addToast('Failed to flag review.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div>
        <h2 className="text-xl font-bold text-neutral-100">Review Moderation</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Audit customer rating comments, reply as business owners, and flag abusive reports.
        </p>
      </div>

      {/* Reviews feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="md:col-span-2 p-8 text-center text-neutral-500 font-bold">
            Loading customer reviews feed...
          </div>
        ) : reviews.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center border border-dashed border-neutral-800 rounded-3xl text-neutral-500 font-bold">
            No feedback comments seeded.
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className={`p-5 rounded-3xl border bg-neutral-900/40 relative space-y-4 ${
                rev.isAbuseReported ? 'border-red-500/25 bg-red-950/5' : 'border-neutral-850'
              }`}
            >
              {/* Top rating details */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-neutral-200 block">
                    {rev.user?.name || 'Anonymous User'}
                  </span>
                  <span className="text-[9px] font-bold text-neutral-500 block">
                    {rev.user?.email || 'N/A'}
                  </span>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      className={`h-3 w-3 shrink-0 ${
                        starIdx < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Product Reference name */}
              {rev.product && (
                <div className="px-2.5 py-1 rounded bg-neutral-950/80 border border-neutral-850 text-[10px] font-bold text-neutral-400 inline-block">
                  🍕 Item: {rev.product.name}
                </div>
              )}

              {/* Comment text */}
              <p className="text-xs text-neutral-300 font-semibold leading-relaxed font-sans">
                {rev.comment}
              </p>

              {/* Administrator response reply */}
              {rev.reply && (
                <div className="p-3 bg-neutral-950/60 border border-neutral-850 rounded-2xl flex items-start gap-2.5">
                  <CornerDownRight className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-[11px] font-semibold text-neutral-400 leading-relaxed font-sans">
                    <span className="text-[9px] font-extrabold uppercase text-red-500 tracking-wider block mb-0.5">
                      Store Response
                    </span>
                    {rev.reply}
                  </div>
                </div>
              )}

              {/* Footer controllers */}
              <div className="border-t border-neutral-950 pt-3 flex justify-between items-center gap-4 text-[10px] font-extrabold">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(rev.id, 'approved')}
                    className={`px-3 py-1 rounded bg-neutral-950 hover:bg-neutral-850 border transition-all cursor-pointer flex items-center gap-1 ${
                      rev.status === 'approved'
                        ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'
                        : 'text-neutral-400 border-neutral-850'
                    }`}
                  >
                    <Check className="h-3 w-3" /> Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                    className={`px-3 py-1 rounded bg-neutral-950 hover:bg-neutral-850 border transition-all cursor-pointer flex items-center gap-1 ${
                      rev.status === 'rejected'
                        ? 'text-red-500 border-red-500/20 bg-red-500/5'
                        : 'text-neutral-400 border-neutral-850'
                    }`}
                  >
                    <X className="h-3 w-3" /> Reject
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenReply(rev)}
                    className="p-1.5 rounded bg-neutral-950 border border-neutral-850 hover:text-white cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleAbuse(rev.id)}
                    className={`p-1.5 rounded bg-neutral-950 border cursor-pointer ${
                      rev.isAbuseReported
                        ? 'text-red-500 border-red-500/20 bg-red-500/5'
                        : 'border-neutral-850 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Dialog Modal */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="bg-white border border-border text-foreground max-w-md rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-none">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <MessageSquare className="h-5 w-5 text-primary" />
              Reply to Review Comment
            </DialogTitle>
          </DialogHeader>

          {selectedReview && (
            <form
              onSubmit={handlePostReply}
              className="py-4 space-y-4 text-xs font-semibold text-muted-foreground"
            >
              <div className="p-3 bg-secondary rounded-2xl border border-border space-y-1 text-xs">
                <span className="font-bold text-foreground block">
                  {selectedReview.user?.name || 'Anonymous User'} said:
                </span>
                <p className="text-[11px] font-medium leading-relaxed font-sans">
                  {selectedReview.comment}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">
                  Business Response Message
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank you for your feedback! We always strive to provide hot, fresh meals..."
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 resize-none font-sans"
                />
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplyOpen(false)}
                  className="bg-transparent border border-border text-muted-foreground hover:bg-secondary rounded-xl py-2 px-4 cursor-pointer text-xs font-bold font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl py-2 px-6 shadow cursor-pointer text-xs flex items-center gap-1 font-sans"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'POST REPLY'}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
