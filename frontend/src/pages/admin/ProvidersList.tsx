import React, { useEffect, useState } from 'react';
import { providersApi } from '@/api/providers';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { AdapterConfigModal } from '@/components/admin/AdapterConfigModal';
import { Cloud, Plus, Search, Trash2, ShieldAlert, Cpu, Settings } from 'lucide-react';

export default function ProvidersList() {
  const [providers, setProviders] = useState<any[]>([]);
  const [supportedProviders, setSupportedProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [configTarget, setConfigTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchProvidersData = async () => {
    setLoading(true);
    try {
      const [listRes, supportedRes] = await Promise.all([
        providersApi.list(),
        providersApi.getSupported().catch(() => ({ items: [] })),
      ]);
      const pList = Array.isArray(listRes) ? listRes : listRes?.items || [];
      const supported = Array.isArray(supportedRes) ? supportedRes : supportedRes?.items || [];
      setProviders(pList);
      setSupportedProviders(supported);
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
    fetchProvidersData();
  }, []);

  const handleSelectSupported = (selectedSlug: string) => {
    setSlug(selectedSlug);
    const item = supportedProviders.find((p) => p.slug === selectedSlug);
    if (item) {
      setName(item.name);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await providersApi.create({ name, slug });
      setIsCreateOpen(false);
      fetchProvidersData();
    } catch (err: any) {
      setError(err.message || 'Failed to create provider entry');
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
      await providersApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchProvidersData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete provider');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProviders = providers.filter(
    (p) => p.name?.toLowerCase().includes(search.toLowerCase()) || p.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Cloud className="w-6 h-6 text-sky-400" />
            Infrastructure Providers & Nodes
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage infrastructure compute providers supported by backend node drivers.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Add Provider Node
        </Button>
      </div>

      {/* Filter */}
      <div className="max-w-md">
        <Input
          placeholder="Filter providers by name or slug..."
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
              <TableHead>Provider Name</TableHead>
              <TableHead>Provider Driver Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProviders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-zinc-500">
                  No infrastructure providers configured yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-semibold text-white flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <span>{provider.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="indigo" className="font-mono">
                      {provider.slug}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="emerald" className="capitalize">
                      Active Driver Node
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfigTarget({ id: provider.id, name: provider.name })}
                      className="text-zinc-400 hover:text-sky-400 hover:bg-sky-500/10"
                      icon={<Settings className="w-4 h-4" />}
                    >
                      Configure
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget({ id: provider.id, name: provider.name })}
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
        title="Register Infrastructure Compute Provider"
        description="Select from provider driver adapters currently implemented and supported by the backend."
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
              Supported Provider Driver
            </label>
            <select
              value={slug}
              onChange={(e) => handleSelectSupported(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              required
            >
              {supportedProviders.length === 0 ? (
                <option value="mock">Mock Cloud Provider (mock)</option>
              ) : (
                supportedProviders.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name} ({p.slug})
                  </option>
                ))
              )}
            </select>
            <span className="text-[11px] text-zinc-500">
              Only backend-supported compute provider drivers can be added.
            </span>
          </div>

          <Input
            label="Provider Display Name"
            placeholder="e.g. Mock Cloud Provider"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting}>
              Add Provider Node
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dynamic Adapter Configuration Modal */}
      {configTarget && (
        <AdapterConfigModal
          isOpen={!!configTarget}
          onClose={() => setConfigTarget(null)}
          entityType="provider"
          entityId={configTarget.id}
          entityName={configTarget.name}
          apiService={providersApi}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Infrastructure Provider"
        description={`Are you sure you want to delete provider node "${deleteTarget?.name}"? This action cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  );
}

