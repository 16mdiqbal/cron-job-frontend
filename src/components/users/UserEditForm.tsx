import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserStore } from '@/stores/userStore';
import type { UpdateUserRequest } from '@/services/api/userService';
import type { User } from '@/types/models';

interface UserEditFormProps {
  user: User;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UserEditForm = ({ user, onClose, onSuccess }: UserEditFormProps) => {
  const { updateUser, isLoading, error } = useUserStore();
  const [formData, setFormData] = useState<UpdateUserRequest>({
    email: user.email,
    role: user.role,
    is_active: user.is_active,
  });
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (password && password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const updateData: UpdateUserRequest = {
        ...formData,
      };

      // Only include password if it's been set
      if (password) {
        updateData.password = password;
      }

      await updateUser(user.id, updateData);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleChange = (field: keyof UpdateUserRequest, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (formErrors[field as string]) {
      setFormErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Edit User: {user.username}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={user.username}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Username cannot be changed</p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="john@example.com"
                className={formErrors.email ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {formErrors.email && <p className="text-sm text-red-600">{formErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password (optional)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) {
                    setFormErrors((prev) => ({ ...prev, password: '' }));
                  }
                }}
                placeholder="Leave blank to keep current password"
                className={formErrors.password ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {formErrors.password && (
                <p className="text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isLoading}
              >
                <option value="viewer">Viewer - Read only access</option>
                <option value="user">User - Can create and manage own jobs</option>
                <option value="admin">Admin - Full system access</option>
              </select>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
                disabled={isLoading}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active (user can log in)
              </Label>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
