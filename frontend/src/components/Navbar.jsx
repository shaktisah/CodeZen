import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function Navbar({ isAdminPanel = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Theme states
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-900 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900 dark:text-white hover:opacity-90 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-cyan-600 dark:text-cyan-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
            <span>{isAdminPanel ? 'CodeZen Admin' : 'CodeZen'}</span>
          </Link>
          {!isAdminPanel && (
            <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <Link to="/" className="text-zinc-800 dark:text-zinc-100 hover:text-zinc-900 dark:hover:text-white transition-colors">Problems</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-cyan-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                  Admin Panel
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-850 transition-all cursor-pointer flex items-center justify-center"
            title="Toggle theme mode"
          >
            {theme === 'dark' ? (
              // Moon Icon
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-cyan-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            ) : (
              // Sun Icon
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-amber-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            )}
          </button>

          {isAdminPanel ? (
            <Link to="/" className="text-xs font-semibold text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-900">
              Back to Dashboard
            </Link>
          ) : user ? (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="flex items-center gap-2 text-xs text-zinc-800 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-900 rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors">
                <div className="w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white text-[10px] uppercase">
                  {user.firstName ? user.firstName[0] : 'U'}
                </div>
                <span className="font-semibold">{user.firstName}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-zinc-400 dark:text-zinc-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </label>
              <ul tabIndex={0} className="dropdown-content menu p-1.5 shadow-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg w-48 mt-1.5 space-y-0.5">
                <li className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Role: {user.role}
                </li>
                <div className="border-t border-zinc-200 dark:border-zinc-900 my-1"></div>
                <li>
                  <Link to="/profile" className="text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white text-xs py-1.5 px-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md">
                    My Profile
                  </Link>
                </li>
                {user.role === 'admin' && (
                  <li>
                    <Link to="/admin" className="text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white text-xs py-1.5 px-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md">
                      Admin Console
                    </Link>
                  </li>
                )}
                <li>
                  <button onClick={handleLogout} className="text-red-650 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20 text-xs py-1.5 px-3 rounded-md text-left w-full cursor-pointer">
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-semibold text-xs px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 rounded-lg transition-all">
                Sign In
              </Link>
              <Link to="/signup" className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
