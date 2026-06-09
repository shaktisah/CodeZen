import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';

// schema validation for signup..using zod
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const text = await response.text();

      if (response.ok) {
        navigate('/login');
      } else {
        setError(text || 'Registration failed');
      }
    } catch (err) {
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-3xl justify-center mb-4">
              CodeZen
            </h2>

            {error && (
              <div className="alert alert-error text-sm py-2 px-3 rounded mb-4">
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="flex gap-4">
                <div className="w-1/2">
                  <input
                    {...register('firstName')}
                    placeholder="First Name" 
                    className="input input-bordered w-full"
                  />
                  {errors.firstName && (
                    <span className="text-error text-sm mt-1 block">
                      {errors.firstName.message}
                    </span>
                  )}
                </div>
                <div className="w-1/2">
                  <input
                    {...register('lastName')}
                    placeholder="Last Name" 
                    className="input input-bordered w-full"
                  />
                  {errors.lastName && (
                    <span className="text-error text-sm mt-1 block">
                      {errors.lastName.message}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <input
                  {...register('emailId')}
                  placeholder="rahul@example.com"
                  className="input input-bordered w-full"
                />
                {errors.emailId && (
                  <span className="text-error text-sm mt-1 block">
                    {errors.emailId.message}
                  </span>
                )}
              </div>

              <div>
                <input
                  {...register('password')}
                  placeholder="Enter Password"
                  type="password"
                  className="input input-bordered w-full"
                />
                {errors.password && (
                  <span className="text-error text-sm mt-1 block">
                    {errors.password.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-full text-base"
              >
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>
            </form>

            <p className="text-center text-sm mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Signup;