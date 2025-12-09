import type {
  AllocationOptions,
  AllocationResult,
  Floor,
  FloorAllocationState,
  Studio,
  Room,
  RoomAssignment,
} from '../types';
import { createFloorCapacityTracker, getFloorIdFromRoom, type FloorTrackerMap } from './capacity';

const DEFAULT_SEED = 17;

export function allocateStudiosToRooms(
  rooms: Room[] = [],
  floors: Floor[] = [],
  studios: Studio[] = [],
  options: AllocationOptions = {}
): AllocationResult {
  const diagnostics: string[] = [];
  // Filter to only included rooms
  const includedRooms = rooms.filter((room) => room.included !== false);

  if (includedRooms.length === 0 || floors.length === 0) {
    return {
      assignments: [],
      floorStates: [],
      unassignedStudios: studios,
      studioToRoom: Object.fromEntries(studios.map((studio) => [studio.id, null])),
      diagnostics: ['No room or floor data available.'],
    };
  }

  const tracker = createFloorCapacityTracker(floors);
  const shuffledRooms = shuffleWithSeed(includedRooms, options.shuffleSeed ?? DEFAULT_SEED).map((room) =>
    createRoomState(room)
  );
  const orderedStudios = [...studios].sort((a, b) => b.size - a.size);
  const studioToRoom: Record<string, string | null> = {};
  const unassigned: Studio[] = [];

  orderedStudios.forEach((studio) => {
    const strictFit = findRoomByStrategy(shuffledRooms, studio, 'strict');

    if (strictFit && assignStudio(strictFit, studio, tracker, diagnostics)) {
      studioToRoom[studio.id] = strictFit.room.id;
      return;
    }

    const nextFit = findRoomByStrategy(shuffledRooms, studio, 'next');
    if (nextFit && assignStudio(nextFit, studio, tracker, diagnostics)) {
      studioToRoom[studio.id] = nextFit.room.id;
      return;
    }

    const dynamicFit = findRoomByStrategy(shuffledRooms, studio, 'dynamic');
    if (dynamicFit && assignStudio(dynamicFit, studio, tracker, diagnostics)) {
      studioToRoom[studio.id] = dynamicFit.room.id;
      return;
    }

    // Escalate failure to diagnostics and track unassigned studios.
    diagnostics.push(`Unable to place ${studio.id} (size ${studio.size}). Marked as unassignable.`);
    studioToRoom[studio.id] = null;
    unassigned.push(studio);
  });

  const assignments = shuffledRooms
    .filter((state) => state.studios.length > 0)
    .map<RoomAssignment>((state) => ({
      roomId: state.room.id,
      roomName: state.room.name,
      building: state.room.building,
      floor: state.room.floor,
      baseCapacity: state.room.baseCapacity,
      dynamicCapacity: state.room.baseCapacity + state.extraUsed,
      extraCapacityUsed: state.extraUsed,
      studios: state.studios,
      memberRooms: state.room.combinedMembers,
    }));

  const floorStates = buildFloorStateSummary(tracker);

  return {
    assignments,
    floorStates,
    unassignedStudios: unassigned,
    studioToRoom,
    diagnostics,
  };
}

type RoomState = {
  room: Room;
  usedCapacity: number;
  dynamicCapacity: number;
  extraUsed: number;
  studios: Studio[];
};

type Strategy = 'strict' | 'next' | 'dynamic';

function createRoomState(room: Room): RoomState {
  return {
    room,
    usedCapacity: 0,
    dynamicCapacity: room.baseCapacity,
    extraUsed: 0,
    studios: [],
  };
}

function findRoomByStrategy(rooms: RoomState[], studio: Studio, strategy: Strategy): RoomState | undefined {
  const predicateMap: Record<Strategy, (room: RoomState) => boolean> = {
    strict: (room) => room.room.baseCapacity - room.usedCapacity >= studio.size,
    next: (room) => room.dynamicCapacity - room.usedCapacity >= studio.size,
    dynamic: () => true,
  };

  const predicate = predicateMap[strategy];

  const ranked = rooms
    .filter(predicate)
    .sort((a, b) => {
      const remainingA = a.room.baseCapacity - a.usedCapacity;
      const remainingB = b.room.baseCapacity - b.usedCapacity;
      return remainingA - remainingB;
    });

  return ranked[0];
}

function assignStudio(
  roomState: RoomState,
  studio: Studio,
  tracker: FloorTrackerMap,
  diagnostics: string[]
): boolean {
  const floorId = getFloorIdFromRoom(roomState.room.building, roomState.room.floor);
  const floorTracker = tracker.get(floorId);

  if (!floorTracker) {
    diagnostics.push(`Floor context missing for ${roomState.room.name}.`);
    return false;
  }

  const projectedUsage = roomState.usedCapacity + studio.size;
  const extraNeeded = Math.max(projectedUsage - roomState.room.baseCapacity, 0);
  const incrementalExtra = Math.max(extraNeeded - roomState.extraUsed, 0);

  if (floorTracker.extraCapacityAllowed - floorTracker.extraCapacityUsed < incrementalExtra) {
    diagnostics.push(`No floor buffer left for ${roomState.room.name}.`);
    return false;
  }

  floorTracker.extraCapacityUsed += incrementalExtra;
  roomState.extraUsed += incrementalExtra;
  roomState.dynamicCapacity = roomState.room.baseCapacity + roomState.extraUsed;
  roomState.usedCapacity = projectedUsage;
  roomState.studios.push(studio);

  return true;
}

function buildFloorStateSummary(tracker: FloorTrackerMap): FloorAllocationState[] {
  return Array.from(tracker.values()).map((entry) => {
    const extraCapacityAllowed = entry.extraCapacityAllowed;
    const remainingBuffer = Math.max(extraCapacityAllowed - entry.extraCapacityUsed, 0);

    return {
      floorId: entry.floor.id,
      building: entry.floor.building,
      floorLabel: entry.floor.floor,
      totalCapacity: entry.floor.totalCapacity,
      baseCapacity: entry.floor.baseCapacity,
      extraCapacityAllowed,
      extraCapacityUsed: entry.extraCapacityUsed,
      remainingBuffer,
    };
  });
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const list = [...items];
  let currentSeed = seed;

  for (let i = list.length - 1; i > 0; i -= 1) {
    currentSeed = randomSeed(currentSeed);
    const j = Math.floor((currentSeed / 0xffffffff) * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }

  return list;
}

function randomSeed(seed: number): number {
  // Simple LCG constants
  const a = 1664525;
  const c = 1013904223;
  return (a * seed + c) % 0xffffffff;
}
