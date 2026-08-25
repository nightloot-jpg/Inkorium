import { useCallback, useEffect, useState } from 'react';
import { getProfileSignatures, createProfileSignature } from '../services/profile-signatures.service';
import type { Signature } from '../types/profile.types';

type CurrentAuthor = NonNullable<Signature['author']>;

export function useProfileSignatures(profileId: string, currentAuthor: CurrentAuthor | null) {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getProfileSignatures(profileId);
      setSignatures(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getProfileSignatures(profileId)
      .then(next => {
        if (!cancelled) setSignatures(next);
      })
      .catch(error => {
        if (!cancelled) {
          console.error('Error loading profile signatures:', error);
          setSignatures([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [profileId]);

  const submit = useCallback(async (content: string) => {
    const value = content.trim().slice(0, 500);
    if (!value || saving) return false;

    setSaving(true);
    try {
      const created = await createProfileSignature(profileId, value);
      const signature = currentAuthor ? { ...created, author: currentAuthor } : created;
      setSignatures(current => [signature, ...current]);
      return true;
    } finally {
      setSaving(false);
    }
  }, [currentAuthor, profileId, saving]);

  return { signatures, loading, saving, reload, submit };
}
