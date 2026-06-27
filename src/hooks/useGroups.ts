import { useState, useEffect } from 'react';
import type { Group } from '../types';

const STORAGE_KEY = 'stellarsyndicate_groups';

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setGroups(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse groups from local storage");
      }
    }
  }, []);

  const saveGroups = (newGroups: Group[]) => {
    setGroups(newGroups);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGroups));
  };

  const addGroup = (group: Group) => {
    saveGroups([group, ...groups]);
  };

  const updateGroup = (updatedGroup: Group) => {
    saveGroups(groups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  };

  const getGroup = (id: string) => {
    return groups.find(g => g.id === id);
  };

  return { groups, addGroup, updateGroup, getGroup };
};
