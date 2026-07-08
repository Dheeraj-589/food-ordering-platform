'use client';

import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Check, X, Shield, Plus } from 'lucide-react';
import api from '@/lib/api';
import { User } from '@/types';
import { useToastStore } from '@/store/toastStore';

export default function ManagersTab() {
  const { addToast } = useToastStore();
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchManagers = async () => {
    try {
      const response = await api.get('/admin/managers');
      setManagers(response.data);
    } catch (err) {
      console.error(err);
      addToast('Could not load managers registry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleToggleBlock = async (user: User) => {
    const nextStatus = user.status === 'blocked' ? 'active' : 'blocked';
    if (
      !confirm(`Are you sure you want to change status of Manager ${user.name} to ${nextStatus}?`)
    )
      return;

    try {
      await api.patch(`/admin/users/${user.id}/status`, { status: nextStatus });
      addToast(`Manager account ${user.name} is now ${nextStatus}!`, 'success');
      fetchManagers();
    } catch (err) {
      console.error(err);
      addToast('Failed to modify manager status.', 'error');
    }
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPassword) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/admin/managers', {
        name: formName,
        email: formEmail,
        phoneNumber: formPhone,
        password: formPassword,
      });

      addToast('Manager account registered successfully!', 'success');
      setIsModalOpen(false);

      // Reset form
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormPassword('');

      fetchManagers();
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { message?: string } } };
      const errMsg = error.response?.data?.message || 'Failed to register manager.';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredManagers = managers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phoneNumber && u.phoneNumber.includes(searchTerm)),
  );

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Managers Directory</h2>
          <p className="text-xs text-foreground mt-1">
            Configure manager credentials, adjust administrative rights, and audit system access
            blocks.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Local Search */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-foreground">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search managers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-905 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-foreground outline-none focus:border-red-500"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-foreground font-bold text-xs py-2.5 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow whitespace-nowrap"
          >
            <Plus className="h-4.5 w-4.5" /> ADD MANAGER
          </button>
        </div>
      </div>

      {/* Grid List Table */}
      <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-neutral-900 max-h-[500px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs font-semibold text-foreground">
            <thead className="bg-background text-foreground font-bold uppercase tracking-wider sticky top-0 z-10 shadow">
              <tr>
                <th className="p-4">Manager Details</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">System Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-foreground font-bold">
                    Loading managers registry...
                  </td>
                </tr>
              ) : filteredManagers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-foreground font-bold">
                    No managers matches search criteria.
                  </td>
                </tr>
              ) : (
                filteredManagers.map((u) => (
                  <tr key={u.id} className="hover:bg-card/20">
                    <td className="p-4 flex items-center gap-3">
                      <div className="h-8 w-8 bg-background border border-neutral-800 rounded-xl overflow-hidden flex items-center justify-center font-extrabold text-foreground shrink-0">
                        {u.name ? u.name[0].toUpperCase() : 'M'}
                      </div>
                      <div>
                        <span className="text-foreground font-bold block">{u.name}</span>
                        <span className="text-[10px] text-foreground block truncate max-w-xs">
                          {u.email}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-foreground">{u.phoneNumber || 'N/A'}</td>
                    <td className="p-4 font-bold text-foreground capitalize">
                      <span className="px-2 py-0.5 rounded text-[9px] uppercase border bg-amber-600/10 text-amber-500 border-amber-500/20">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.status === 'blocked' ? (
                        <span className="px-2 py-0.5 rounded bg-red-600/10 text-red-500 border border-red-500/20 text-[9px] font-extrabold uppercase">
                          Blocked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-extrabold uppercase">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleBlock(u)}
                        className={`p-2 rounded-lg border cursor-pointer transition-colors inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${u.status === 'blocked'
                          ? 'bg-emerald-600/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-600/20'
                          : 'bg-red-600/10 text-red-500 border-red-500/20 hover:bg-red-600/20'
                          }`}
                      >
                        {u.status === 'blocked' ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-background border border-neutral-900 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" /> Register Manager
              </h3>
              <p className="text-xs text-foreground mt-1">
                Configure credentials for corporate restaurant administration.
              </p>
            </div>

            <form onSubmit={handleCreateManager} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="manager@foodies.com"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="E.g. +919876543210"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                  Access Password *
                </label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 font-sans"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-foreground hover:text-primary hover:bg-card transition-colors font-bold text-xs cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 text-foreground font-bold text-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'CREATING...' : 'CREATE ACCOUNT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
