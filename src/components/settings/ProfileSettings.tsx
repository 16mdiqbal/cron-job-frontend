import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { userService, type UpdateUserRequest } from '@/services/api/userService';
import { Shield, Mail, User as UserIcon, Calendar } from 'lucide-react';
import { getErrorMessage } from '@/services/utils/error';

export const ProfileSettings = () => {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Validate passwords if changing
      if (formData.newPassword) {
        if (formData.newPassword.length < 6) {
          setError('New password must be at least 6 characters');
          setIsLoading(false);
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
      }

      const updateData: UpdateUserRequest = {};

      // Only include changed fields
      if (formData.email !== user?.email) {
        updateData.email = formData.email;
      }

      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        setError('No changes to save');
        setIsLoading(false);
        return;
      }

      if (user?.id) {
        const updatedUser = await userService.updateUser(user.id, updateData);

        // Update the auth store with the new user data
        setUser(updatedUser);

        // Update form data with the new email
        setFormData({
          email: updatedUser.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        setSuccess('Profile updated successfully');
        setIsEditing(false);

        // Auto-hide success message after 10 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 10000);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update profile'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    // Reset to current user data
    setFormData({
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'success' | 'info' => {
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
      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>View and update your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username (Read-only) */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <UserIcon className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <Label className="text-sm font-medium">Username</Label>
              <p className="text-sm text-muted-foreground">{user?.username}</p>
            </div>
          </div>

          {/* Role (Read-only) */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <Label className="text-sm font-medium">Role</Label>
              <div className="mt-1">
                <Badge variant={getRoleBadgeVariant(user?.role || 'viewer')}>{user?.role}</Badge>
              </div>
            </div>
          </div>

          {/* Account Created */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <Label className="text-sm font-medium">Member Since</Label>
              <p className="text-sm text-muted-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <Label className="text-sm font-medium">Account Status</Label>
              <div className="mt-1">
                <Badge variant={user?.is_active ? 'success' : 'warning'}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message - Show outside form */}
      {success && !isEditing && (
        <div className="p-3 rounded-md bg-green-50 border border-green-200">
          <div className="flex items-start justify-between">
            <p className="text-sm text-green-600">{success}</p>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="text-green-600 hover:text-green-700 font-bold text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Editable Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Update Information</CardTitle>
              <CardDescription>Change your email or password</CardDescription>
            </div>
            {!isEditing && (
              <Button
                onClick={() => {
                  setIsEditing(true);
                  setSuccess(null);
                  setError(null);
                }}
                variant="outline"
              >
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-red-600">{error}</p>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="text-red-600 hover:text-red-700 font-bold text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              {/* Password Section */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Change Password (Optional)</h4>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Leave blank to keep current password"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      placeholder="Re-enter new password"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
