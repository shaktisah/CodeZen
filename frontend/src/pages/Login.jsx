import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import axiosClient from '../utils/axiosClient';
import { EyeIcon, EyeOffIcon } from '../components/icons/EyeIcons';
import { GoogleLogin } from '@react-oauth/google';

const loginSchema = z.object({
  emailId: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser, googleLogin } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = searchParams.get('redirect') || '/';

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      await axiosClient.post('/user/login', data);
      await refreshUser();
      navigate(redirectTarget);
    } catch (err) {
      setError(err.response?.data || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      await refreshUser();
      navigate(redirectTarget);
    } catch (err) {
      setError(err.response?.data || err.message || 'Google Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              C
            </div>
            <span className="font-bold text-xl text-zinc-900 dark:text-white tracking-tight">CodeZen</span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Sign in to your account to continue</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                Email Address
              </label>
              <input
                {...register("emailId")}
                type="email"
                placeholder="you@example.com"
                className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-300 dark:border-zinc-800 rounded-lg py-2.5 px-3.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 transition-colors text-sm"
              />
              {errors.emailId && (
                <span className="text-red-500 dark:text-red-400 text-xs mt-1 block">
                  {errors.emailId.message}
                </span>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-300 dark:border-zinc-800 rounded-lg py-2.5 pl-3.5 pr-10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-red-500 dark:text-red-400 text-xs mt-1 block">
                  {errors.password.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm mt-6 shadow-md"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="my-5 flex items-center justify-center gap-2">
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">OR</span>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
          </div>

          <div className="flex justify-center">
            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Sign-In failed')}
                useOneTap
                theme="outline"
                shape="rectangular"
              />
            ) : (
              <div className="w-full text-center p-3.5 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-550 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-950/20">
                <span className="font-medium block text-zinc-700 dark:text-zinc-300">Google Sign-In is not configured</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 block">Please set VITE_GOOGLE_CLIENT_ID in the environment</span>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-6">
            Don't have an account?{' '}
            <Link to={redirectTarget !== '/' ? `/signup?redirect=${encodeURIComponent(redirectTarget)}` : '/signup'} className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-medium hover:underline transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;