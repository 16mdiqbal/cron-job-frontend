import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { getAndClearPostLoginRedirect, isSafeInternalRedirect } from '@/services/utils/authRedirect';

interface LoginFormData {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

export const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();
  const [serverError, setServerError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      emailOrUsername: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    try {
      // Determine if input is email or username
      const isEmail = data.emailOrUsername.includes('@');
      const credentials = isEmail
        ? { email: data.emailOrUsername, password: data.password }
        : { username: data.emailOrUsername, password: data.password };

      await login(credentials);
      const stateFrom = (location.state as any)?.from;
      const statePath =
        stateFrom && typeof stateFrom.pathname === 'string'
          ? `${stateFrom.pathname || ''}${stateFrom.search || ''}${stateFrom.hash || ''}`
          : null;
      const stored = getAndClearPostLoginRedirect();
      const next = statePath || stored;
      navigate(isSafeInternalRedirect(next || '') ? (next as string) : '/dashboard', { replace: true });
    } catch (error: unknown) {
      // Extract error message from various possible locations
      const axiosError = error as any;
      const message =
        axiosError?.response?.data?.error ||
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        'Login failed. Please check your credentials and try again.';
      setServerError(message);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="emailOrUsername">Email or Username</Label>
            <Input
              id="emailOrUsername"
              type="text"
              placeholder="name@example.com or username"
              error={errors.emailOrUsername?.message}
              {...register('emailOrUsername', {
                required: 'Email or username is required',
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              {...register('rememberMe')}
            />
            <Label htmlFor="rememberMe" className="cursor-pointer font-normal">
              Remember me
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
