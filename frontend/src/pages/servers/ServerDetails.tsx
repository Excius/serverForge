import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { serversApi } from '@/api/servers';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { StatusBadge, type ServerStatus } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Play,
  Square,
  RefreshCw,
  Copy,
  Check,
  ArrowLeft,
  Users,
  Gamepad2,
  Cloud,
  Terminal,
  Cpu,
  HardDrive,
  ShieldAlert,
  Sliders,
} from 'lucide-react';

export default function ServerDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [server, setServer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'config' | 'telemetry'>('console');

  const fetchServer = async () => {
    if (!id) return;
    try {
      const data = await serversApi.get(id);
      setServer(data);
    } catch (err) {
      console.error('Failed to fetch server details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServer();
    const interval = setInterval(() => {
      if (server && (server.status === 'starting' || server.status === 'stopping')) {
        fetchServer();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id, server?.status]);

  const handleStart = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await serversApi.start(id);
      await fetchServer();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!id) return;
    if (!window.confirm(`Are you sure you want to stop server "${server?.name}"?`)) return;
    setActionLoading(true);
    try {
      await serversApi.stop(id);
      await fetchServer();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const copyIp = () => {
    if (server?.ipAddress) {
      const fullAddress = `${server.ipAddress}:${server.port || 27015}`;
      navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-36 bg-zinc-900/60 rounded animate-pulse" />
        <div className="h-44 bg-zinc-900/60 border border-white/5 rounded-2xl animate-pulse" />
        <div className="h-96 bg-zinc-900/60 border border-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!server) {
    return (
      <Card className="text-center py-16">
        <CardContent className="space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Server Not Found</h2>
          <p className="text-xs text-zinc-400">
            The specified server ID does not exist or you lack access permissions.
          </p>
          <Link to="/servers">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Return to Servers List
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div>
        <Link
          to="/servers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Server Fleet
        </Link>
      </div>

      {/* Hero Control Header Card */}
      <div className="glass-card rounded-2xl border border-white/10 bg-zinc-900/80 p-6 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Title & Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{server.name}</h1>
              <StatusBadge status={(server.status || 'unknown') as ServerStatus} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <Badge variant="purple" className="flex items-center gap-1">
                <Gamepad2 className="w-3 h-3" />
                {server.gameSlug || 'game'}
              </Badge>
              <Badge variant="indigo" className="flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                {server.providerSlug || 'provider'}
              </Badge>
              <span className="text-zinc-600">•</span>
              <span className="font-mono text-zinc-500">ID: {server.id}</span>
            </div>
          </div>

          {/* Quick Actions & Server Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="glass"
              size="md"
              onClick={fetchServer}
              icon={<RefreshCw className="w-4 h-4" />}
              title="Refresh telemetry"
            >
              Sync
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleStart}
              disabled={server.status === 'running' || server.status === 'starting'}
              isLoading={actionLoading && (server.status === 'stopped' || server.status === 'error')}
              icon={<Play className="w-4 h-4 fill-current" />}
            >
              Start Instance
            </Button>

            {user?.role === 'admin' && (
              <Button
                variant="danger"
                size="md"
                onClick={handleStop}
                disabled={server.status === 'stopped' || server.status === 'stopping'}
                isLoading={actionLoading && server.status === 'running'}
                icon={<Square className="w-4 h-4 fill-current" />}
              >
                Stop Instance
              </Button>
            )}
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Connection IP</span>
            {server.ipAddress ? (
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono font-bold text-indigo-300 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                  {server.ipAddress}:{server.port || 27015}
                </code>
                <button
                  onClick={copyIp}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                  title="Copy IP and Port"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic">No IP allocated</div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Active Players</span>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-400" />
              <span>
                {server.currentPlayers || 0} / {server.maxPlayers || 32}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Port Assignment</span>
            <div className="text-sm font-mono font-bold text-zinc-200">{server.port || 27015}</div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Health Status</span>
            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Optimal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('console')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'console'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Terminal className="w-4 h-4" /> Live Terminal Console
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'config'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Sliders className="w-4 h-4" /> Configuration Specs
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'telemetry'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Cpu className="w-4 h-4" /> Resource Usage
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'console' && (
        <Card className="border border-white/10 bg-zinc-950 shadow-2xl overflow-hidden font-mono">
          <div className="px-4 py-3 bg-zinc-900/80 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-zinc-400 ml-2 font-mono">server-stdout.log</span>
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> STDOUT STREAMING
            </div>
          </div>
          <div className="p-4 bg-zinc-950 text-zinc-300 text-xs leading-relaxed h-80 overflow-y-auto space-y-1">
            <p className="text-zinc-500">[SYSTEM] ServerForge Agent v1.0 initializing container engine...</p>
            <p className="text-indigo-400">[CONTAINER] Allocating port binding :{server.port || 27015}...</p>
            <p className="text-emerald-400">[BOOT] Mounting game image `{server.gameSlug || 'cs2'}`...</p>
            {server.status === 'running' ? (
              <>
                <p className="text-zinc-300">[SERVER] Dedicated server ready for incoming UDP connections.</p>
                <p className="text-zinc-400">
                  [TELEMETRY] Listening on IP {server.ipAddress || '127.0.0.1'}:{server.port || 27015}...
                </p>
                <p className="text-emerald-400">
                  [PLAYERS] Connected active sessions: {server.currentPlayers || 0} / {server.maxPlayers || 32}
                </p>
              </>
            ) : server.status === 'starting' ? (
              <p className="text-amber-400 animate-pulse">[BOOT] Server process starting up...</p>
            ) : (
              <p className="text-zinc-500">[STOPPED] Process terminated. Press "Start Instance" to boot.</p>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'config' && (
        <Card>
          <CardHeader>
            <CardTitle>Instance Specs & Environment Variables</CardTitle>
            <CardDescription>Target configuration parameters passed into the game worker container.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400">Game Engine Template</span>
                <p className="text-sm font-semibold text-white">{server.gameSlug || 'Standard Engine'}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400">Node Provider Region</span>
                <p className="text-sm font-semibold text-white">{server.providerSlug || 'Cloud Node'}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400">Max Player Limit</span>
                <p className="text-sm font-semibold text-white">{server.maxPlayers || 32} Max Slots</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400">Config Hash</span>
                <p className="text-xs font-mono text-indigo-300">sha256:7f8a9e01b2c3d4e5f6a7</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'telemetry' && (
        <Card>
          <CardHeader>
            <CardTitle>Telemetry Metrics</CardTitle>
            <CardDescription>Live CPU and Memory utilization on host node.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-300">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Cpu className="w-4 h-4 text-indigo-400" /> Host vCPU Load
                </span>
                <span className="font-mono text-indigo-300">12.4%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full w-[12.4%]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-300">
                <span className="flex items-center gap-1.5 font-semibold">
                  <HardDrive className="w-4 h-4 text-purple-400" /> RAM Memory Allocation
                </span>
                <span className="font-mono text-purple-300">1.8 GB / 4.0 GB</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full w-[45%]" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
