import { useCallback, useEffect, useState } from 'react';
import { parseCsv } from '../utils/csv';
import { buildSpaceDataset, type CombinedSpaceRow, type SpaceDivisionRow } from '../utils/spaceTransform';
import type { Floor, Room } from '../types';

export function useSpaceData() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [spaceDivisionText, combinedSpacesText] = await Promise.all([
          fetch('/data/space_division.csv').then((response) => response.text()),
          fetch('/data/combined_spaces.csv').then((response) => response.text()),
        ]);

        if (!isMounted) {
          return;
        }

        const spaceRows = parseCsv<SpaceDivisionRow>(spaceDivisionText);
        const combinedRows = parseCsv<CombinedSpaceRow>(combinedSpacesText);
        const dataset = buildSpaceDataset(spaceRows, combinedRows);

        // Default all rooms to included
        setRooms(dataset.rooms.map((room) => ({ ...room, included: true })));
        setFloors(dataset.floors);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load CSV data');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleRoom = useCallback((roomId: string, included: boolean) => {
    setRooms((current) =>
      current.map((room) => (room.id === roomId ? { ...room, included } : room))
    );
  }, []);

  const toggleMemberRoom = useCallback((zoneId: string, memberRoomId: string, included: boolean) => {
    setRooms((current) =>
      current.map((room) => {
        if (room.id !== zoneId || !room.memberRooms) {
          return room;
        }

        const updatedMembers = room.memberRooms.map((member) =>
          member.id === memberRoomId ? { ...member, included } : member
        );

        // Recalculate zone capacity based on included member rooms
        const includedCapacity = updatedMembers
          .filter((m) => m.included)
          .reduce((sum, m) => sum + m.capacity, 0);

        // If no members included, mark zone as excluded
        const anyIncluded = updatedMembers.some((m) => m.included);

        return {
          ...room,
          memberRooms: updatedMembers,
          baseCapacity: includedCapacity,
          included: anyIncluded,
        };
      })
    );
  }, []);

  return { rooms, floors, loading, error, toggleRoom, toggleMemberRoom };
}
