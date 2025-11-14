import { useState, useEffect } from 'react';
import { usersAPI } from '@/lib/api';

export function useUserPhoto(email?: string) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPhoto() {
      if (!email) {
        setLoading(false);
        return;
      }

      try {
        const url = await usersAPI.getUserPhoto(email);
        setPhotoUrl(url);
      } catch (error) {
        console.error('Error fetching photo:', error);
        setPhotoUrl(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPhoto();
  }, [email]);

  return { photoUrl, loading };
}