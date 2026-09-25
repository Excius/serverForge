import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { serversApi } from '@/api/servers';
import {
  Server as ServerIcon,
  Activity,
  Users,
  Cpu,
  ArrowUpRight,
  ExternalLink,
  Gamepad2,
  Globe,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge, type ServerStatus } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await serversApi.list();
      setServers(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      console.error('Failed to load dashboard servers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopyIp = (id: string, ip: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const runningServers = servers.filter((s) => s.status === 'running');
  const playersOnline = runningServers.reduce((acc, s) => acc + (s.currentPlayers || 0), 0);
  const totalCapacity = servers.reduce((acc, s) => acc + (s.maxPlayers || 32), 0);
  const capacityPercent = totalCapacity > 0 ? Math.round((playersOnline / totalCapacity) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 w-full rounded-2xl bg-zinc-900/60 border border-white/5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 rounded-xl bg-zinc-900/60 border border-white/5 animate-pulse" />
          <div className="h-32 rounded-xl bg-zinc-900/60 border border-white/5 animate-pulse" />
          <div className="h-32 rounded-xl bg-zinc-900/60 border border-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-950/80 via-zinc-900/90 to-purple-950/50 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge variant="indigo" className="px-2.5 py-1">
                Control Plane Active
              </Badge>
              <span className="text-xs text-zinc-400 font-mono">Logged in as {user?.email}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back to <span className="gradient-accent-text">ServerForge</span>
            </h1>
            <p className="text-sm text-zinc-400">
              Manage your high-performance game servers, monitor active player connections, and manage node capacity.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button variant="glass" size="md" onClick={fetchDashboardData} icon={<RefreshCw className="w-4 h-4" />}>
              Refresh Stats
            </Button>
            <Link to="/servers">
              <Button variant="primary" size="md" icon={<ServerIcon className="w-4 h-4" />}>
                View Fleet
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <Card className="hover:border-indigo-500/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Fleet Servers</span>
              <div className="text-2xl font-black text-white">{servers.length}</div>
              <div className="text-[11px] text-zinc-500">Configured in control plane</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <ServerIcon className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Stat 2 */}
        <Card className="hover:border-emerald-500/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Online Servers</span>
              <div className="text-2xl font-black text-emerald-400">{runningServers.length}</div>
              <div className="text-[11px] text-emerald-400/80 font-medium">
                {servers.length > 0 ? `${Math.round((runningServers.length / servers.length) * 100)}% uptime` : '0%'}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Activity className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Stat 3 */}
        <Card className="hover:border-sky-500/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Players Online</span>
              <div className="text-2xl font-black text-sky-400">{playersOnline}</div>
              <div className="text-[11px] text-zinc-500">Active sessions</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Stat 4 */}
        <Card className="hover:border-purple-500/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Node Utilization</span>
              <div className="text-2xl font-black text-purple-400">{capacityPercent}%</div>
              <div className="text-[11px] text-zinc-500">{playersOnline} / {totalCapacity} Slots</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Servers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-indigo-400" />
              Recent Game Servers
            </h2>
            <p className="text-xs text-zinc-400">Quick status overview of your active game servers</p>
          </div>
          <Link to="/servers">
            <Button variant="ghost" size="sm" icon={<ArrowUpRight className="w-4 h-4" />}>
              View All Servers ({servers.length})
            </Button>
          </Link>
        </div>

        {servers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-3">
              <ServerIcon className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-zinc-300 font-medium">No game servers provisioned yet.</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Get started by contacting your ServerForge administrator or creating a server access assignment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.slice(0, 6).map((server) => (
              <Card key={server.id} className="group relative flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base group-hover:text-indigo-300 transition-colors">
                        {server.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="purple" className="text-[10px]">
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
                  {/* Player capacity progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-zinc-500" /> Players
                      </span>
                      <span className="font-semibold text-zinc-200">
                        {server.currentPlayers || 0} / {server.maxPlayers || 32}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
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

                <div className="px-6 py-3 bg-zinc-950/50 border-t border-white/5 flex items-center justify-between gap-2">
                  {server.ipAddress ? (
                    <button
                      onClick={(e) => handleCopyIp(server.id, `${server.ipAddress}:${server.port || 27015}`, e)}
                      className="text-xs font-mono text-zinc-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                    >
                      {copiedId === server.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-sans">Copied IP!</span>
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
                    <Button variant="secondary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Manage Console
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
