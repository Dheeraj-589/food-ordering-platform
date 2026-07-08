'use client';

import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Check, X, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { User } from '@/types';
import { useToastStore } from '@/store/toastStore';

export default function CustomersTab() {
  const { addToast } = useToastStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      // Filter out only customers or display all registered system users
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      addToast('Could not load user directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = async (user: User) => {
    const nextStatus = user.status === 'blocked' ? 'active' : 'blocked';
    if (!confirm(`Are you sure you want to change status of ${user.name} to ${nextStatus}?`))
      return;

    try {
      await api.patch(`/admin/users/${user.id}/status`, { status: nextStatus });
      addToast(`Account ${user.name} is now ${nextStatus}!`, 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      addToast('Failed to modify user status.', 'error');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phoneNumber.includes(searchTerm),
  );

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Customer Directory</h2>
          <p className="text-xs text-foreground mt-1">
            Review active system users, block spammers, audit loyalty tiers, and track customer
            lifetime values.
          </p>
        </div>

        {/* Local Search */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-foreground">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search email, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-905 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-foreground outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Grid List Table */}
      <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-neutral-900 max-h-[500px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs font-semibold text-foreground">
            <thead className="bg-background text-foreground font-bold uppercase tracking-wider sticky top-0 z-10 shadow">
              <tr>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">System Role</th>
                <th className="p-4">Loyalty Tiers</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-foreground font-bold">
                    Loading users registry...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-foreground font-bold">
                    No users matches search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-card/20">
                    <td className="p-4 flex items-center gap-3">
                      <div className="h-8 w-8 bg-background border border-neutral-800 rounded-xl overflow-hidden flex items-center justify-center font-extrabold text-foreground shrink-0">
                        {u.name ? u.name[0].toUpperCase() : 'C'}
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
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] uppercase border ${u.role === 'admin'
                          ? 'bg-red-600/10 text-red-500 border-red-500/20'
                          : u.role === 'delivery'
                            ? 'bg-blue-600/10 text-blue-500 border-blue-500/20'
                            : 'bg-background border-neutral-300/50 text-foreground'
                          }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-foreground">
                      {u.loyaltyPoints || 0} pts
                      <span className="text-[9px] text-foreground block font-semibold">
                        {u.rewardLevel || 'Bronze'} Tier
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
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleBlock(u)}
                          className={`p-2 rounded-lg border cursor-pointer transition-colors inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${u.status === 'blocked'
                            ? 'bg-emerald-650/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-950/20'
                            : 'bg-red-650/10 border-red-500/20 text-red-500 hover:bg-red-950/20'
                            }`}
                        >
                          {u.status === 'blocked' ? (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>Unblock</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>Block</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
