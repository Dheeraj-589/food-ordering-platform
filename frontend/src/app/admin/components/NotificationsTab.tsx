'use client';

import React, { useState, useEffect } from 'react';
import { Send, Bell, Loader2, Mail, Clock, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useToastStore } from '@/store/toastStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BroadcastRecord {
  id: number;
  subject: string;
  message: string;
  sentAt: string;
  status: 'pending' | 'success' | 'failed';
  recipientsCount: number;
  deliveryDetails?: string;
}

interface DeliveryDetail {
  email: string;
  status: string;
  error?: string;
}

export default function NotificationsTab() {
  const { addToast } = useToastStore();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>([]);
  const [fetching, setFetching] = useState(false);

  // Detail Modal States
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchBroadcastHistory = async () => {
    setFetching(true);
    try {
      const response = await api.get('/admin/broadcast-history');
      setBroadcasts(response.data);
    } catch (err) {
      console.error('Failed to load broadcasts history:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchBroadcastHistory();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      addToast('Please enter both Subject and Message.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/broadcast-notification', { subject, message });
      addToast(
        'Marketing announcement successfully broadcasted to all registered customers! ✉️',
        'success',
      );
      setSubject('');
      setMessage('');
      fetchBroadcastHistory();
    } catch (err) {
      console.error(err);
      addToast('Failed to broadcast email newsletter.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (broadcast: BroadcastRecord) => {
    setSelectedBroadcast(broadcast);
    setModalOpen(true);
  };

  let modalDeliveryList: DeliveryDetail[] = [];
  if (selectedBroadcast && selectedBroadcast.deliveryDetails) {
    try {
      modalDeliveryList = JSON.parse(selectedBroadcast.deliveryDetails) as DeliveryDetail[];
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-100">Broadcast Manager</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Send HTML marketing email campaigns and push dashboard notifications to all registered
          customer users.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form panel */}
        <div className="lg:col-span-2 p-6 bg-neutral-900 border border-neutral-850 rounded-3xl space-y-4">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-neutral-500 block">
            Draft Newsletter Broadcast
          </span>

          <form
            onSubmit={handleBroadcast}
            className="space-y-4 text-xs font-semibold text-neutral-400"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">
                Email Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="E.g. Sunday Funday: Buy 1 Pizza Get 1 Pizza Free!"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 placeholder-neutral-700 outline-none focus:border-red-500/50 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">
                Announcement Message Body
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Details of the marketing push, codes, or seasonal offerings..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 placeholder-neutral-700 outline-none focus:border-red-500/50 resize-none font-sans"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[10px] font-extrabold uppercase flex items-center gap-1.5 cursor-pointer shadow transition-transform active:scale-95"
              >
                {loading ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <Send className="h-4.5 w-4.5" />
                )}
                <span>Send Marketing Newsletter</span>
              </button>
            </div>
          </form>
        </div>

        {/* Info panel */}
        <div className="p-6 bg-neutral-900 border border-neutral-850 rounded-3xl space-y-4 text-xs font-semibold text-neutral-500 leading-relaxed">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-neutral-400 block">
            Notification Policies
          </span>
          <p>
            Standard marketing announcements are pushed directly to consumer account dashboard trays
            and email channels.
          </p>
          <p>
            Sending a newsletter broadcasts the SMTP email to **all registered customer users** in
            real-time. Please confirm details before sending.
          </p>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="p-6 bg-neutral-900 border border-neutral-850 rounded-3xl space-y-4">
        <span className="text-[10px] uppercase tracking-widest font-extrabold text-neutral-400 block flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-neutral-500" /> Broadcast History Logs
        </span>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-semibold text-neutral-400 text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-850 text-neutral-500 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Date Sent</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4 text-center">Recipients</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {fetching && broadcasts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-600">
                    Loading broadcast history logs...
                  </td>
                </tr>
              ) : broadcasts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-600">
                    No marketing newsletters broadcasted yet.
                  </td>
                </tr>
              ) : (
                broadcasts.map((b) => (
                  <tr key={b.id} className="border-b border-neutral-850/50 hover:bg-neutral-950/20">
                    <td className="py-3 px-4 text-neutral-500">
                      {new Date(b.sentAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-neutral-200 font-bold truncate max-w-xs">
                      {b.subject}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-neutral-300">
                      {b.recipientsCount}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold border ${
                          b.status === 'success'
                            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                            : 'border-red-500/20 bg-red-500/5 text-red-400'
                        }`}
                      >
                        {b.status === 'success' ? 'Completed' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetails(b)}
                        className="p-1 rounded bg-neutral-950 border border-neutral-800 hover:border-red-500/30 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                        title="View Delivery Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 max-w-lg rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="border-b border-neutral-850 pb-4">
            <DialogTitle className="text-sm font-extrabold text-neutral-200 uppercase tracking-widest flex items-center gap-2">
              <Mail className="h-5 w-5 text-red-500" /> Delivery Status Log
            </DialogTitle>
            {selectedBroadcast && (
              <div className="pt-2 text-left space-y-1">
                <h4 className="text-xs font-bold text-neutral-300">
                  Subject: "{selectedBroadcast.subject}"
                </h4>
                <p className="text-[10px] text-neutral-500">
                  Sent on: {new Date(selectedBroadcast.sentAt).toLocaleString()}
                </p>
              </div>
            )}
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto space-y-2 py-4 pr-1 scrollbar-none text-xs">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-500 block mb-2">
              Recipient Delivery Matrix
            </span>

            {modalDeliveryList.length === 0 ? (
              <p className="text-neutral-500 text-center py-4">No individual logs recorded.</p>
            ) : (
              modalDeliveryList.map((d, index) => (
                <div
                  key={index}
                  className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl flex items-center justify-between"
                >
                  <div className="space-y-0.5 text-left">
                    <span className="font-bold text-neutral-300 block">{d.email}</span>
                    {d.error && (
                      <span className="text-[9px] font-medium text-red-500 block">
                        Err: {d.error}
                      </span>
                    )}
                  </div>
                  <div>
                    {d.status === 'success' ? (
                      <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5" /> Sent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase text-red-400">
                        <AlertCircle className="h-3.5 w-3.5" /> Failed
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
