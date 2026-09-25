import React, { useEffect, useState } from 'react';
import { serversApi } from '@/api/servers';
import { gamesApi } from '@/api/games';
import { providersApi } from '@/api/providers';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { StatusBadge, type ServerStatus } from '@/components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { Server, Plus, Search, Trash2, ExternalLink, ShieldAlert, Gamepad2, Cloud } from 'lucide-react';

export default function AdminServersList() {
  const [servers, setServers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [providerServerId, setProviderServerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [serversRes, gamesRes, providersRes] = await Promise.all([
        serversApi.list(),
        gamesApi.list(),
        providersApi.list(),
      ]);
      const sList = Array.isArray(serversRes) ? serversRes : serversRes?.items || [];
      const gList = Array.isArray(gamesRes) ? gamesRes : gamesRes?.items || [];
      const pList = Array.isArray(providersRes) ? providersRes : providersRes?.items || [];

      setServers(sList);
      setGames(gList);
      setProviders(pList);

      if (gList.length > 0 && !gameId) setGameId(gList[0].id);
      if (pList.length > 0 && !providerId) setProviderId(pList[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!gameId) {
      setError('Please select a registered Game Engine. If none exist, register one in Games Catalogue.');
      return;
    }
    if (!providerId) {
      setError('Please select an Infrastructure Provider Node. If none exist, add one in Providers & Nodes.');
      return;
    }

    setSubmitting(true);
    try {
      const finalProviderServerId =
        providerServerId.trim() || `srv-${Math.random().toString(36).substring(2, 9)}`;

      await serversApi.create({
        name,
        gameId,
        providerId,
        providerServerId: finalProviderServerId,
      });

      setName('');
      setProviderServerId('');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to provision new server');
    } finally {
      setSubmitting(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await serversApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete server');
    } finally {
      setDeleting(false);
    }
  };

  const filteredServers = servers.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.gameSlug?.toLowerCase().includes(search.toLowerCase()) ||
      s.providerSlug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Server className="w-6 h-6 text-indigo-400" />
            All Fleet Servers (Admin Control)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Global administrator panel for provisioning and managing all game servers across nodes.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Provision New Server
        </Button>
      </div>

      {/* Filter Search */}
      <div className="max-w-md">
        <Input
          placeholder="Filter fleet by server name, game, or provider..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4 text-zinc-500" />}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="h-64 bg-zinc-900/60 border border-white/5 rounded-2xl animate-pulse" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Server Instance</TableHead>
              <TableHead>Game Engine</TableHead>
              <TableHead>Node Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Provider Server ID</TableHead>
              <TableHead>Slots</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                  No fleet servers provisioned yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredServers.map((server) => (
                <TableRow key={server.id}>
                  <TableCell className="font-semibold text-white">
                    <Link to={`/servers/${server.id}`} className="hover:text-indigo-400 transition-colors">
                      {server.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="purple">{server.gameSlug || 'game'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="indigo">{server.providerSlug || 'provider'}</Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={(server.status || 'unknown') as ServerStatus} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-300">
                    {server.providerServerId || server.id}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-zinc-200">
                    {server.currentPlayers || server.playerCount || 0} Slots
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Link to={`/servers/${server.id}`}>
                      <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                        Manage
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget({ id: server.id, name: server.name })}
                      className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Provision Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision Game Server"
        description="Deploy a new dedicated game server instance on a compute provider node."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Server Display Name"
            placeholder="e.g. Competitive Server #1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300 tracking-wider uppercase flex items-center gap-1">
                <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" /> Game Engine
              </label>
              {games.length === 0 ? (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  No registered games found. Go to <strong>Games Catalogue</strong> to register a game engine first.
                </div>
              ) : (
                <select
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="bg-zinc-950/80 border border-zinc-800 text-zinc-100 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                >
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.slug})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300 tracking-wider uppercase flex items-center gap-1">
                <Cloud className="w-3.5 h-3.5 text-sky-400" /> Infrastructure Node
              </label>
              {providers.length === 0 ? (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  No provider nodes found. Go to <strong>Providers & Nodes</strong> to add a provider node first.
                </div>
              ) : (
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="bg-zinc-950/80 border border-zinc-800 text-zinc-100 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.slug})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <Input
            label="Provider Server Instance ID (Optional)"
            placeholder="Auto-generated if left blank (e.g. srv-mock-1)"
            value={providerServerId}
            onChange={(e) => setProviderServerId(e.target.value)}
            hint="Unique identifier assigned by the compute node host."
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={submitting}
              disabled={games.length === 0 || providers.length === 0}
            >
              Provision Server
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Game Server"
        description={`Are you sure you want to permanently delete server "${deleteTarget?.name}"? This action cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  );
}
