import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';
import { UserCreateForm } from '@/components/users/UserCreateForm';
import { UserEditForm } from '@/components/users/UserEditForm';
import { UserPlus, Pencil, Trash2, Mail, Shield } from 'lucide-react';
import type { User } from '@/types/models';

export const UsersPage = () => {
  const { users, isLoading, error, fetchUsers, deleteUser, clearError } = useUserStore();
  const { user: currentUser } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [createModalKey, setCreateModalKey] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId: string) => {
    if (deleteConfirm !== userId) {
      setDeleteConfirm(userId);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      await deleteUser(userId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'success' | 'warning' | 'info' => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'user':
        return 'success';
      case 'viewer':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Users</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage users and permissions</p>
          </div>
          <Button 
            onClick={() => {
              setCreateModalKey(prev => prev + 1);
              setShowCreateModal(true);
            }} 
            className="gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all"
          >
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-center py-8 text-muted-foreground">Loading users...</p>
          )}

          {!isLoading && users.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No users found</p>
          )}

          {!isLoading && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-semibold">Username</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Created</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.username}</span>
                          {user.id === currentUser?.id && (
                            <Badge variant="info" className="text-xs">You</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                          <Shield className="h-3 w-3" />
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Badge variant={user.is_active ? 'success' : 'warning'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user.id)}
                              className={
                                deleteConfirm === user.id
                                  ? 'text-white bg-red-600 hover:bg-red-700'
                                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                              {deleteConfirm === user.id && <span className="ml-1">Confirm?</span>}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <UserCreateForm
          key={`create-user-modal-${createModalKey}`}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchUsers();
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <UserEditForm
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default UsersPage;
