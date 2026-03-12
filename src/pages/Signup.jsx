import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Mountain } from 'lucide-react';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [siteId, setSiteId] = useState('');
  const [error, setError] = useState('');
  const { signup, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password || !siteId) {
      setError('Please enter username, password, and site ID.');
      return;
    }

    const success = await signup(username, password, siteId);
    if (success) {
      navigate('/login');
    } else {
      setError('Signup failed. Please try again.'); // Generic error
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Mountain className="w-8 h-8 text-amber-500" />
          <span className="text-2xl font-bold tracking-tight">RouteSet</span>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
          <h1 className="text-xl font-bold mb-2">Sign Up</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Create your account to manage climbing routes
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourusername"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="site-id" className="block text-sm font-medium text-zinc-300 mb-2">
                Site ID
              </label>
              <input
                id="site-id"
                type="text"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                placeholder="e.g., my-climbing-gym"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs mt-2">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
              disabled={isLoadingAuth}
            >
              {isLoadingAuth ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-xs text-zinc-500 text-center mt-6">
            Already have an account? <a href="/login" className="text-amber-500 hover:underline">Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}