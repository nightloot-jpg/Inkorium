import { useCallback, useEffect, useState } from 'react';
import type { Signature } from '../types/profile.types';
import { createProfileSignature, getProfileSignatures } from '../services/profile-signatures.service';

export function useProfileSignatures(profileId: string, viewerId: string) {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setSignatures(await getProfileSignatures(profileId));
    } catch (error) {
      console.error('Error loading profile signatures:', error);
      setSignatures([]);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submit = useCallback(async (draft: string) => {
    const content = draft.trim().slice(0, 500);
    if (!content || saving) return null;

    setSaving(true);
    try {
      const signature = await createProfileSignature(profileId, viewerId, content);
      setSignatures(current => [signature, ...current]);
      return signature;
    } catch (error) {
      console.error('Error creating profile signature:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [profileId, saving, viewerId]);

  return { signatures, loading, saving, submit, reload };
}
