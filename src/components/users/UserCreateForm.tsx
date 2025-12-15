import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserStore } from '@/stores/userStore';
import type { CreateUserRequest } from '@/services/api/userService';

interface UserFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const initialFormState: CreateUserRequest = {
  username: '',
  email: '',
  password: '',
  role: 'viewer',
};

export const UserCreateForm = ({ onClose, onSuccess }: UserFormProps) => {
  const { createUser, isLoading, error } = useUserStore();
  const [formData, setFormData] = useState<CreateUserRequest>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset form data when component mounts
  useEffect(() => {
    setFormData(initialFormState);
    setFormErrors({});
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
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
      await createUser(formData);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleChange = (field: keyof CreateUserRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="create-username">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-username"
                name="create-username"
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="john_doe"
                className={formErrors.username ? 'border-red-500' : ''}
                disabled={isLoading}
                autoComplete="off"
              />
              {formErrors.username && (
                <p className="text-sm text-red-600">{formErrors.username}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="create-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-email"
                name="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="john@example.com"
                className={formErrors.email ? 'border-red-500' : ''}
                disabled={isLoading}
                autoComplete="off"
              />
              {formErrors.email && <p className="text-sm text-red-600">{formErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="create-password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-password"
                name="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Minimum 6 characters"
                className={formErrors.password ? 'border-red-500' : ''}
                disabled={isLoading}
                autoComplete="new-password"
              />
              {formErrors.password && (
                <p className="text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="create-role">
                Role <span className="text-red-500">*</span>
              </Label>
              <select
                id="create-role"
                name="create-role"
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value as CreateUserRequest['role'])}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isLoading}
              >
                <option value="viewer">Viewer - Read only access</option>
                <option value="user">User - Can create and manage own jobs</option>
                <option value="admin">Admin - Full system access</option>
              </select>
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
                {isLoading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
