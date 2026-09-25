import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { serversApi } from '@/api/servers';
import { Link } from 'react-router-dom';
import { StatusBadge, type ServerStatus } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Server,
  Search,
  LayoutGrid,
  List,
  RefreshCw,
  Users,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Gamepad2,
  SlidersHorizontal,
} from 'lucide-react';

export default function ServersList() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchServers = async () => {
    setLoading(true);
    try {
      const data = await serversApi.list();
      setServers(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      console.error('Failed to load server list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleCopyIp = (id: string, ip: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredServers = useMemo(() => {
    return servers.filter((s) => {
      const matchesSearch =
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.gameSlug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.ipAddress?.includes(searchQuery);

      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [servers, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-zinc-900/60 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-zinc-900/60 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-zinc-900/60 border border-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Server className="w-6 h-6 text-indigo-400" />
            My Game Servers
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Access, monitor, and control all game servers assigned to your user account.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="glass" size="sm" onClick={fetchServers} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>

          {/* View Toggle */}
          <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'table' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="High-Density Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by server name, game, or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4 text-zinc-500" />}
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-zinc-500 mr-1 hidden lg:inline-flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> Status:
          </span>
          {['all', 'running', 'starting', 'stopped', 'error'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-zinc-950/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Server Content */}
      {filteredServers.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No game servers found</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'No servers match your active search filters.'
                  : "You don't have access to any game servers yet. Ask an administrator to assign server permissions to your account."}
              </p>
            </div>
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServers.map((server) => (
            <Card key={server.id} className="flex flex-col justify-between group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base group-hover:text-indigo-300 transition-colors">
                      {server.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="purple" className="text-[10px]">
                        <Gamepad2 className="w-3 h-3" />
                        {server.gameSlug || 'game'}
                      </Badge>
                      {server.ipAddress && (
                        <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-zinc-500" />
                          {server.ipAddress}:{server.port || 27015}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={(server.status || 'unknown') as ServerStatus} />
                </div>
              </CardHeader>

              <CardContent className="py-3 space-y-3">
                {/* Player count gauge */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-zinc-500" /> Active Players
                    </span>
                    <span className="font-semibold text-zinc-200">
                      {server.currentPlayers || 0} / {server.maxPlayers || 32}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(((server.currentPlayers || 0) / (server.maxPlayers || 32)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>

              <div className="px-6 py-3 bg-zinc-950/50 border-t border-white/5 flex items-center justify-between">
                {server.ipAddress ? (
                  <button
                    onClick={(e) => handleCopyIp(server.id, `${server.ipAddress}:${server.port || 27015}`, e)}
                    className="text-xs font-mono text-zinc-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedId === server.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-sans">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Copy IP</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-xs text-zinc-600 italic">No IP allocated</span>
                )}

                <Link to={`/servers/${server.id}`}>
                  <Button variant="primary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Manage Console
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Server Name</TableHead>
              <TableHead>Game</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Address / Port</TableHead>
              <TableHead>Players</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServers.map((server) => (
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
                  <StatusBadge status={(server.status || 'unknown') as ServerStatus} />
                </TableCell>
                <TableCell className="font-mono text-xs text-zinc-300">
                  {server.ipAddress ? (
                    <button
                      onClick={(e) => handleCopyIp(server.id, `${server.ipAddress}:${server.port || 27015}`, e)}
                      className="inline-flex items-center gap-1.5 hover:text-indigo-300 transition-colors"
                    >
                      {server.ipAddress}:{server.port || 27015}
                      {copiedId === server.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-zinc-500" />
                      )}
                    </button>
                  ) : (
                    <span className="text-zinc-600 italic">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs font-semibold">
                      {server.currentPlayers || 0} / {server.maxPlayers || 32}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Link to={`/servers/${server.id}`}>
                    <Button variant="secondary" size="sm">
                      Manage
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
