'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, FileText, CheckCircle2, XCircle, Users } from 'lucide-react';
import api from '@/lib/api';
import { AuditLog } from './types';
import { useToastStore } from '@/store/toastStore';

export default function SecurityTab() {
  const { addToast } = useToastStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Permission Matrix state loaded dynamically from MySQL SystemSettings
  const [permissions, setPermissions] = useState<{ id: string; label: string; roles: any }[]>([]);

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data && res.data.permission_matrix) {
        setPermissions(JSON.parse(res.data.permission_matrix));
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await api.get('/admin/audit-logs');
      setLogs(response.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch system logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchPermissions();
  }, []);

  // Compute failed logins from audit logs
  const failedLogins = logs
    .filter((log) => log.action === 'FAILED_LOGIN')
    .map((log) => {
      const diffMs = Date.now() - new Date(log.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      let timeStr = 'Just now';
      if (diffMins > 0 && diffMins < 60) {
        timeStr = `${diffMins} mins ago`;
      } else if (diffMins >= 60 && diffMins < 1440) {
        timeStr = `${Math.floor(diffMins / 60)} hrs ago`;
      } else if (diffMins >= 1440) {
        timeStr = `${Math.floor(diffMins / 1440)} days ago`;
      }

      return {
        id: log.id,
        email: log.userEmail || 'unknown@user.com',
        ip: log.ipAddress || '127.0.0.1',
        time: timeStr,
        reason: log.details || 'Incorrect credentials',
      };
    });

  const handleTogglePermission = async (
    permissionId: string,
    roleKey: 'admin' | 'manager' | 'kitchen' | 'delivery' | 'customer',
  ) => {
    let updatedPerm: any = null;
    const updatedList = permissions.map((perm) => {
      if (perm.id === permissionId) {
        updatedPerm = {
          ...perm,
          roles: {
            ...perm.roles,
            [roleKey]: !perm.roles[roleKey],
          },
        };
        return updatedPerm;
      }
      return perm;
    });

    setPermissions(updatedList);

    try {
      await api.patch('/admin/settings', {
        key: 'permission_matrix',
        value: JSON.stringify(updatedList),
      });
      if (updatedPerm) {
        addToast(`Permission modified on "${roleKey}" for "${updatedPerm.label}"!`, 'success');
      }
    } catch (err) {
      console.error('Failed to sync permissions:', err);
      addToast('Failed to save permissions to database.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-500" /> Security & Audit Desk
        </h2>
        <p className="text-xs text-foreground mt-1">
          Review fail attempts logs, administrator actions tracking, and check custom roles
          permission matrices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold text-foreground">
        {/* Permission matrix block */}
        <div className="lg:col-span-2 p-6 bg-card border border-neutral-300/50 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-950 pb-2">
            <Users className="h-4.5 w-4.5 text-foreground shrink-0" />
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-foreground block">
              Role Access Controls Matrix
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-950">
            <table className="w-full text-left text-xs font-semibold text-foreground select-none">
              <thead className="bg-background text-foreground font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Permission Node</th>
                  <th className="p-3 text-center">Admin</th>
                  <th className="p-3 text-center">Manager</th>
                  <th className="p-3 text-center">Kitchen</th>
                  <th className="p-3 text-center">Rider</th>
                  <th className="p-3 text-center">Buyer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-950">
                {permissions.map((perm) => (
                  <tr key={perm.id} className="hover:bg-background/20">
                    <td className="p-3 font-bold text-foreground">{perm.label}</td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.roles.admin}
                        onChange={() => handleTogglePermission(perm.id, 'admin')}
                        className="h-4.5 w-4.5 accent-red-650 rounded cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.roles.manager}
                        onChange={() => handleTogglePermission(perm.id, 'manager')}
                        className="h-4.5 w-4.5 accent-red-650 rounded cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.roles.kitchen}
                        onChange={() => handleTogglePermission(perm.id, 'kitchen')}
                        className="h-4.5 w-4.5 accent-red-650 rounded cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.roles.delivery}
                        onChange={() => handleTogglePermission(perm.id, 'delivery')}
                        className="h-4.5 w-4.5 accent-red-650 rounded cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.roles.customer}
                        onChange={() => handleTogglePermission(perm.id, 'customer')}
                        className="h-4.5 w-4.5 accent-red-650 rounded cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Failed Logins Panel */}
        <div className="p-6 bg-card border border-neutral-300/50 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-950 pb-2">
            <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-red-700 block">
              Failed Login Attempts
            </span>
          </div>

          <div className="space-y-3">
            {failedLogins.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-background border border-neutral-300/50/80 space-y-1 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">{item.email}</span>
                  <span className="text-[9px] text-foreground">{item.time}</span>
                </div>
                <span className="text-[9px] text-foreground font-bold block">
                  Source IP: {item.ip}
                </span>
                <p className="text-[10px] text-red-500 font-semibold">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log list */}
        <div className="p-6 bg-card border border-neutral-300/50 rounded-3xl space-y-4 lg:col-span-3">
          <div className="flex items-center gap-2 border-b border-neutral-950 pb-2">
            <FileText className="h-4.5 w-4.5 text-foreground shrink-0" />
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-foreground block">
              System Administrator Action Audits
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-950">
            <table className="w-full text-left text-xs font-semibold text-foreground">
              <thead className="bg-background text-foreground font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">User Action</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Triggered By</th>
                  <th className="p-3">Operation Details</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-950">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-foreground">
                      Loading audit records...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-foreground">
                      No actions logged yet.
                    </td>
                  </tr>
                ) : (
                  logs.slice(0, 10).map((log) => (
                    <tr key={log.id} className="hover:bg-background/20">
                      <td className="p-3 font-mono font-bold text-red-500">{log.action}</td>
                      <td className="p-3 text-foreground">{log.ipAddress || '127.0.0.1'}</td>
                      <td className="p-3 text-foreground">
                        {log.userName || 'Admin'}
                        <span className="text-[10px] text-foreground block font-semibold">
                          {log.userEmail || 'admin@foodies.com'}
                        </span>
                      </td>
                      <td className="p-3 text-foreground font-medium leading-relaxed font-sans">
                        {log.details || 'System operation executed.'}
                      </td>
                      <td className="p-3 font-semibold text-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
