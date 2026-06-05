import { useState, useEffect } from 'react';
import { UserService, UserMetadata } from '@/services/user.service';

export function useTeam(ownerId: string) {
  const [members, setMembers] = useState<UserMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;
    const unsub = UserService.subscribeToTeam(ownerId, (data) => {
      setMembers(data);
      setIsLoading(false);
    });
    return unsub;
  }, [ownerId]);

  return { members, isLoading };
}
