import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { EyeIcon, EyeOffIcon } from '../components/icons/EyeIcons';

const signupSchema = z.object({
  firstName: z.string().min(3, "First name should contain at least 3 letters."),
  lastName: z.string().min(2, "Last name should contain at least 2 letters."),
  emailId: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);

    try {
      await axiosClient.post('/user/register', data);
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 font-sans py-12 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-8 shadow-xl mx-4">
        <div>
          <h2 className="text-3xl font-bold text-center tracking-tight text-zinc-900 dark:text-white mb-2">
            CodeZen
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center mb-6">
            Create your account to get started.
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs py-2.5 px-3.5 rounded-lg mb-5 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                First Name
              </label>
              <input
                {...register('firstName')}
                placeholder="First Name" 
                className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-300 dark:border-zinc-800 rounded-lg py-2.5 px-3.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
              />
              {errors.firstName && (
                <span className="text-red-500 dark:text-red-400 text-xs mt-1 block">
                  {errors.firstName.message}
                </span>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                Last Name
              </label>
              <input
                {...register('lastName')}
                placeholder="Last Name" 
                className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-300 dark:border-zinc-800 rounded-lg py-2.5 px-3.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
              />
              {errors.lastName && (
                <span className="text-red-500 dark:text-red-400 text-xs mt-1 block">
                  {errors.lastName.message}
                </span>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                Email Address
              </label>
              <input
                {...register('emailId')}
                placeholder="shakti@example.com"
                className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-300 dark:border-zinc-800 rounded-lg py-2.5 px-3.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
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
                  {...register('password')}
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-300 dark:border-zinc-800 rounded-lg py-2.5 pl-3.5 pr-10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
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
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm mt-6 shadow-md"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Signing up...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium hover:underline transition-colors">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;