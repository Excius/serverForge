import { useEffect, useState } from 'react';
import { usersApi } from '@/api/users';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Users, Search, Shield, User } from 'lucide-react';

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.list();
      setUsers(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change role for user to "${newRole}"?`)) return;
    try {
      await usersApi.updateRole(userId, newRole);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const filteredUsers = users.filter(
    (u) => u.email?.toLowerCase().includes(search.toLowerCase()) || u.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            User Management & RBAC
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage user accounts, administrator privileges, and access roles across ServerForge.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="max-w-md">
        <Input
          placeholder="Search users by email or user ID..."
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
              <TableHead>User Account</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Assigned Role</TableHead>
              <TableHead className="text-right">Manage Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-zinc-500">
                  No user accounts registered.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-semibold text-white flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-xs">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span>{user.email}</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500">{user.id}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'indigo' : 'default'} className="capitalize">
                      {user.role === 'admin' ? (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-indigo-400" /> Administrator
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-zinc-400" /> Standard User
                        </span>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRoleToggle(user.id, user.role)}
                      className="text-xs"
                    >
                      Toggle to {user.role === 'admin' ? 'Standard User' : 'Admin'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
