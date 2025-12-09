import { buildFloorId } from './spaceTransform';
import type { Floor } from '../types';

export type FloorCapacityTracker = {
  floor: Floor;
  extraCapacityAllowed: number;
  extraCapacityUsed: number;
};

export type FloorTrackerMap = Map<string, FloorCapacityTracker>;

export function createFloorCapacityTracker(floors: Floor[]): FloorTrackerMap {
  const tracker: FloorTrackerMap = new Map();

  floors.forEach((floor) => {
    const extraCapacityAllowed = Math.max(floor.totalCapacity - floor.baseCapacity, 0);
    tracker.set(floor.id, {
      floor,
      extraCapacityAllowed,
      extraCapacityUsed: 0,
    });
  });

  return tracker;
}

export function getFloorIdFromRoom(building: string, floorLabel: string): string {
  return buildFloorId(building, floorLabel);
}
