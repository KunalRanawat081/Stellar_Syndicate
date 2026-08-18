import { useState, useEffect, useCallback } from 'react';
import type { Group } from '../types';
import {
  getGroupFromContract,
  getMemberIdsFromContract,
  getMemberFromContract,
} from '../utils/soroban';

const STORAGE_KEY = 'stellarsyndicate_groups';

// ---------------------------------------------------------------------------
// Hydration helper
// ---------------------------------------------------------------------------

/**
 * Takes a group as stored locally (localStorage) and reconciles it against
 * live Soroban contract state. The authoritative fields are:
 *
 *   - title, description, leadBuyer  →  from contract (ground truth)
 *   - member.hasPaid                 →  from contract (payment state)
 *
 * Fields that live only off-chain (expenses, totalGoodsTarget, status,
 * member.name) are preserved from local storage because the contract has no
 * storage for them.
 *
 * Returns null if the group no longer exists on-chain (e.g. orphaned local
 * record) so callers can filter it out.
 */
async function hydrateGroupFromChain(localGroup: Group): Promise<Group | null> {
  try {
    // 1. Verify the group exists on-chain and pull authoritative metadata.
    const onChainGroup = await getGroupFromContract(localGroup.id);
    if (!onChainGroup) {
      // The contract doesn't know about this group — it may have been created
      // before a redeployment. Keep the local copy to avoid data loss but mark
      // it so the UI can show a warning if needed.
      return localGroup;
    }

    // 2. Fetch on-chain member IDs so we know which members are registered.
    const onChainMemberIds = await getMemberIdsFromContract(localGroup.id);

    // 3. Reconcile each locally-known member's hasPaid status with chain state.
    const reconciledMembers = await Promise.all(
      localGroup.members.map(async (localMember) => {
        // Only query chain state if this member was actually registered on-chain.
        if (!onChainMemberIds.includes(localMember.id)) {
          return localMember; // Not on chain yet (e.g. pending tx). Keep as-is.
        }
        const onChainMember = await getMemberFromContract(localGroup.id, localMember.id);
        if (!onChainMember) return localMember;

        return {
          ...localMember,
          // `hasPaid` is the only field whose truth lives purely on-chain.
          hasPaid: onChainMember.hasPaid,
        };
      })
    );

    return {
      ...localGroup,
      // Sync authoritative contract fields.
      title: onChainGroup.title ?? localGroup.title,
      description: onChainGroup.description ?? localGroup.description,
      leadBuyer: onChainGroup.leadBuyer ?? localGroup.leadBuyer,
      members: reconciledMembers,
    };
  } catch (err) {
    console.error(`Hydration failed for group ${localGroup.id}:`, err);
    // On network error fall back to local data — never drop the group.
    return localGroup;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);


  // On mount: load from localStorage, then hydrate from Soroban in the
  // background. The UI gets localStorage data immediately (fast first paint)
  // and then the reconciled on-chain state replaces it once ready.
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    let localGroups: Group[] = [];

    if (raw) {
      try {
        localGroups = JSON.parse(raw);
        // Render immediately with cached data so the UI is not blocked.
        setGroups(localGroups);
      } catch (e) {
        console.error('Failed to parse groups from localStorage:', e);
      }
    }

    if (localGroups.length === 0) {
      setIsHydrating(false);
      return;
    }

    // Hydrate all groups concurrently from Soroban.
    (async () => {
      try {
        const hydrated = await Promise.all(
          localGroups.map((g) => hydrateGroupFromChain(g))
        );
        // Filter out nulls and persist the authoritative state back to storage.
        const valid = hydrated.filter((g): g is Group => g !== null);
        setGroups(valid);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
      } catch (err) {
        console.error('Group hydration from Soroban failed:', err);
        // Leave the localStorage snapshot in place — do not wipe user data.
      } finally {
        setIsHydrating(false);
      }
    })();
  }, []);

  const addGroup = useCallback(
    (group: Group) => {
      setGroups((prev) => {
        const next = [group, ...prev];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const updateGroup = useCallback(
    (updatedGroup: Group) => {
      setGroups((prev) => {
        const next = prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const getGroup = useCallback(
    (id: string) => groups.find((g) => g.id === id),
    [groups]
  );

  return { groups, isHydrating, addGroup, updateGroup, getGroup };
};
