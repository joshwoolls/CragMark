import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ChangeSiteId() {
  const { user, checkUserAuth } = useAuth();
  const [newSiteId, setNewSiteId] = useState(user?.site_id || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateSiteId = (value) => /^[a-zA-Z0-9_-]{3,}$/.test(value);

  const handleSave = async () => {
    setError('');

    if (!newSiteId.trim()) {
      setError('Site ID is required');
      return;
    }

    if (!validateSiteId(newSiteId)) {
      setError('Site ID must be at least 3 characters and contain only letters, numbers, underscores, and hyphens');
      return;
    }

    if (newSiteId === user?.site_id) {
      setError('New site ID must be different from current');
      return;
    }

    setIsLoading(true);
    try {
      await base44.auth.updateSiteId(newSiteId);
      await checkUserAuth();
      toast.success('Site ID updated successfully');
      setError('');
    } catch (err) {
      console.error('Failed to update site ID:', err);
      setError(err.message || 'Failed to update site ID');
      toast.error('Failed to update site ID: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSave();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        placeholder="New site ID"
        value={newSiteId}
        onChange={(e) => setNewSiteId(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isLoading}
        className="w-32 text-xs h-8"
      />
      <Button
        onClick={handleSave}
        disabled={isLoading}
        size="sm"
        className="h-8 text-xs"
      >
        {isLoading ? 'Saving...' : 'Save'}
      </Button>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}
