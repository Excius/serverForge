import React, { useEffect, useState } from 'react';
import { gamesApi } from '@/api/games';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { AdapterConfigModal } from '@/components/admin/AdapterConfigModal';
import { Gamepad2, Plus, Search, Trash2, ShieldAlert, Settings } from 'lucide-react';

export default function GamesList() {
  const [games, setGames] = useState<any[]>([]);
  const [supportedGames, setSupportedGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [configTarget, setConfigTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchGamesData = async () => {
    setLoading(true);
    try {
      const [listRes, supportedRes] = await Promise.all([
        gamesApi.list(),
        gamesApi.getSupported().catch(() => ({ items: [] })),
      ]);
      const gList = Array.isArray(listRes) ? listRes : listRes?.items || [];
      const supported = Array.isArray(supportedRes) ? supportedRes : supportedRes?.items || [];
      setGames(gList);
      setSupportedGames(supported);
      if (supported.length > 0 && !slug) {
        setSlug(supported[0].slug);
        setName(supported[0].name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGamesData();
  }, []);

  const handleSelectSupported = (selectedSlug: string) => {
    setSlug(selectedSlug);
    const item = supportedGames.find((g) => g.slug === selectedSlug);
    if (item) {
      setName(item.name);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await gamesApi.create({ name, slug });
      setIsCreateOpen(false);
      fetchGamesData();
    } catch (err: any) {
      setError(err.message || 'Failed to create game entry');
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
      await gamesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchGamesData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete game');
    } finally {
      setDeleting(false);
    }
  };

  const filteredGames = games.filter(
    (g) => g.name?.toLowerCase().includes(search.toLowerCase()) || g.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Gamepad2 className="w-6 h-6 text-indigo-400" />
            Games Catalogue
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure game server templates dynamically supported by backend adapters.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Register Game Engine
        </Button>
      </div>

      {/* Filter */}
      <div className="max-w-md">
        <Input
          placeholder="Filter games by name or slug..."
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
              <TableHead>Game Name</TableHead>
              <TableHead>Engine Adapter Slug</TableHead>
              <TableHead>Game ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGames.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-zinc-500">
                  No game templates registered yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredGames.map((game) => (
                <TableRow key={game.id}>
                  <TableCell className="font-semibold text-white flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                    <span>{game.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="purple" className="font-mono">
                      {game.slug}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500">{game.id}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfigTarget({ id: game.id, name: game.name })}
                      className="text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                      icon={<Settings className="w-4 h-4" />}
                    >
                      Configure
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget({ id: game.id, name: game.name })}
                      className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Backend Game Engine"
        description="Select from game engine adapters currently implemented and supported by the backend."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 tracking-wider uppercase">
              Supported Game Adapter
            </label>
            <select
              value={slug}
              onChange={(e) => handleSelectSupported(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              required
            >
              {supportedGames.length === 0 ? (
                <option value="mock">Mock Game Engine (mock)</option>
              ) : (
                supportedGames.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.name} ({g.slug})
                  </option>
                ))
              )}
            </select>
            <span className="text-[11px] text-zinc-500">
              Only backend-implemented game engine adapters are available for registration.
            </span>
          </div>

          <Input
            label="Game Display Name"
            placeholder="e.g. Mock Game Engine"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting}>
              Register Game Engine
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dynamic Adapter Configuration Modal */}
      {configTarget && (
        <AdapterConfigModal
          isOpen={!!configTarget}
          onClose={() => setConfigTarget(null)}
          entityType="game"
          entityId={configTarget.id}
          entityName={configTarget.name}
          apiService={gamesApi}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Game Template"
        description={`Are you sure you want to delete game template "${deleteTarget?.name}"? This action cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  );
}

