import React, { useEffect, useState } from 'react';
import { serverAccessApi } from '@/api/server-access';
import { serversApi } from '@/api/servers';
import { usersApi } from '@/api/users';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { KeyRound, Plus, Trash2, ShieldAlert, User, Server } from 'lucide-react';

export default function AdminAccessPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [accessList, setAccessList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBaseData = async () => {
    try {
      const [serversRes, usersRes] = await Promise.all([serversApi.list(), usersApi.list().catch(() => ({ items: [] }))]);
      const serverItems = Array.isArray(serversRes) ? serversRes : serversRes?.items || [];
      const userItems = Array.isArray(usersRes) ? usersRes : usersRes?.items || [];
      setServers(serverItems);
      setUsers(userItems);

      if (serverItems.length > 0 && !selectedServerId) {
        setSelectedServerId(serverItems[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAccessList = async (serverId: string) => {
    if (!serverId) return;
    try {
      const data = await serverAccessApi.list(serverId);
      setAccessList(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    if (selectedServerId) {
      loadAccessList(selectedServerId);
    }
  }, [selectedServerId]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServerId || !grantUserId) return;
    setError(null);
    setSubmitting(true);
    try {
      await serverAccessApi.grant({ serverId: selectedServerId, userId: grantUserId });
      setIsGrantOpen(false);
      loadAccessList(selectedServerId);
    } catch (err: any) {
      setError(err.message || 'Failed to grant access');
    } finally {
      setSubmitting(false);
    }
  };

  const [revokeTargetUserId, setRevokeTargetUserId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const confirmRevoke = async () => {
    if (!selectedServerId || !revokeTargetUserId) return;
    setRevoking(true);
    try {
      await serverAccessApi.revoke({ serverId: selectedServerId, userId: revokeTargetUserId });
      setRevokeTargetUserId(null);
      loadAccessList(selectedServerId);
    } catch (err: any) {
      alert(err.message || 'Failed to revoke access');
    } finally {
      setRevoking(false);
    }
  };

  const selectedServer = servers.find((s) => s.id === selectedServerId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <KeyRound className="w-6 h-6 text-indigo-400" />
            Server Access Control Rules
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Assign user permissions to manage and operate specific game server instances.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsGrantOpen(true)}
          disabled={!selectedServerId}
          icon={<Plus className="w-4 h-4" />}
        >
          Grant Server Access
        </Button>
      </div>

      {/* Select Server Selector Bar */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Server className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="flex flex-col w-full sm:w-80">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Select Target Game Server
            </label>
            <select
              value={selectedServerId}
              onChange={(e) => setSelectedServerId(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.gameSlug})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedServer && (
          <div className="flex items-center gap-3">
            <Badge variant="purple" className="py-1">
              {selectedServer.gameSlug}
            </Badge>
            <Badge variant="indigo" className="py-1">
              {selectedServer.providerSlug}
            </Badge>
          </div>
        )}
      </div>

      {/* Table of Active Access Permissions */}
      {loading ? (
        <div className="h-44 bg-zinc-900/60 border border-white/5 rounded-2xl animate-pulse" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID / Account</TableHead>
              <TableHead>Target Server</TableHead>
              <TableHead>Permission Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accessList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-zinc-500">
                  No user access rules granted for this server yet.
                </TableCell>
              </TableRow>
            ) : (
              accessList.map((rule) => (
                <TableRow key={rule.id || rule.userId}>
                  <TableCell className="font-semibold text-white flex items-center gap-2.5">
                    <User className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-zinc-100 font-semibold">{rule.email || rule.userId || rule.id}</span>
                      <span className="text-[10px] font-mono text-zinc-500 font-normal">{rule.id || rule.userId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300 font-mono text-xs">{selectedServer?.name || selectedServerId}</TableCell>
                  <TableCell>
                    <Badge variant="emerald">Operator / Manage</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevokeTargetUserId(rule.id || rule.userId)}
                      className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" /> Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Grant Access Modal */}
      <Modal
        isOpen={isGrantOpen}
        onClose={() => setIsGrantOpen(false)}
        title="Grant Server Access Rule"
        description={`Authorize a user to control instance "${selectedServer?.name}".`}
      >
        <form onSubmit={handleGrant} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {users.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300 tracking-wider uppercase">Select User</label>
              <select
                value={grantUserId}
                onChange={(e) => setGrantUserId(e.target.value)}
                className="bg-zinc-950/80 border border-zinc-800 text-zinc-100 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                required
              >
                <option value="">-- Choose User --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Input
              label="User ID"
              placeholder="Enter User UUID (e.g. usr_123)"
              value={grantUserId}
              onChange={(e) => setGrantUserId(e.target.value)}
              required
            />
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsGrantOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting}>
              Grant Access
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!revokeTargetUserId}
        onClose={() => setRevokeTargetUserId(null)}
        onConfirm={confirmRevoke}
        title="Revoke Server Access"
        description={`Are you sure you want to revoke server access for user "${
          accessList.find((r) => (r.id || r.userId) === revokeTargetUserId)?.email || revokeTargetUserId
        }" on server "${selectedServer?.name}"?`}
        confirmText="Revoke Access"
        isLoading={revoking}
      />
    </div>
  );
}
