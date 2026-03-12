import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44client.js';
import { Mountain, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export default function Settings() {
  const { user, logout, checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [siteId, setSiteId] = useState(user?.site_id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  const SITE_ID_REGEX = /^[a-zA-Z0-9_-]{3,}$/;

  const handleSaveSiteId = async (e) => {
    e.preventDefault();
    setSaveMessage('');
    setSaveError('');

    // Validation
    if (!siteId.trim()) {
      setSaveError('Site ID cannot be empty.');
      return;
    }

    if (!SITE_ID_REGEX.test(siteId)) {
      setSaveError('Site ID must be at least 3 characters and contain only letters, numbers, hyphens, and underscores.');
      return;
    }

    if (siteId === user?.site_id) {
      setSaveMessage('No changes to save.');
      return;
    }

    setIsSaving(true);
    try {
      await base44.auth.updateSiteId(siteId);
      setSaveMessage('Site ID updated successfully!');
      
      // Refresh user data
      await checkUserAuth();
      
      // Show success toast
      toast({
        title: 'Success',
        description: 'Site ID updated successfully.',
      });
    } catch (error) {
      console.error('Error updating site ID:', error);
      setSaveError(error?.message || 'Failed to update site ID. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to update site ID.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Site ID Section */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Site ID</h2>
          <form onSubmit={handleSaveSiteId} className="space-y-4">
            <div>
              <label htmlFor="siteId" className="block text-sm font-medium text-zinc-300 mb-2">
                Current Site ID
              </label>
              <input
                id="siteId"
                type="text"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                placeholder="e.g., my-gym-name"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Must be at least 3 characters. Letters, numbers, hyphens, and underscores only.
              </p>
            </div>

            {saveError && (
              <p className="text-red-500 text-sm">{saveError}</p>
            )}

            {saveMessage && (
              <p className="text-green-500 text-sm">{saveMessage}</p>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
            >
              {isSaving ? 'Saving...' : 'Save Site ID'}
            </button>
          </form>
        </div>

        {/* Account Section */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Username
              </label>
              <div className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400">
                {user?.username}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
