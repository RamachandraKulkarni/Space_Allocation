import { useCallback, useRef, useState } from 'react';
import type {
  AllocationResult,
  ProgramInput,
  FinanceSummary,
  Floor,
  StudioSummary,
  Room,
  StaffCounts,
} from '../types';
import { generateStudios } from '../utils/grouping';
import { allocateStudiosToRooms } from '../utils/allocation';
import { exportAllocationCsv } from '../utils/export';
import { buildFinanceSummary } from '../utils/finance';

export type AllocationPayload = {
  programs: ProgramInput[];
  studioCap: number;
  allowMixing: boolean;
  totalStudentsOverride?: number | null;
  semestersPerYear: number;
  taCompensation: number;
  staffCounts: StaffCounts;
};

export function useAllocationEngine(rooms: Room[], floors: Floor[]) {
  const [studioSummary, setStudioSummary] = useState<StudioSummary | null>(null);
  const [result, setResult] = useState<AllocationResult | null>(null);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [seed, setSeed] = useState(17);
  const lastPayload = useRef<AllocationPayload | null>(null);

  const runAllocation = useCallback(
    (payload: AllocationPayload, overrideSeed?: number) => {
      lastPayload.current = payload;
      const summary = generateStudios(payload.programs, {
        allowMixing: payload.allowMixing,
        studioCap: payload.studioCap,
      });

      setStudioSummary(summary);
      setFinance(
        buildFinanceSummary(summary, {
          totalStudentsOverride: payload.totalStudentsOverride,
          studioCap: payload.studioCap,
          semestersPerYear: payload.semestersPerYear,
          taCompensation: payload.taCompensation,
          staffCounts: payload.staffCounts,
        })
      );

      if (summary.studios.length === 0) {
        setResult(null);
        return;
      }

      const allocation = allocateStudiosToRooms(rooms, floors, summary.studios, {
        shuffleSeed: overrideSeed ?? seed,
      });

      setResult(allocation);
    },
    [floors, rooms, seed]
  );

  const rotateAllocation = useCallback(() => {
    const payload = lastPayload.current;
    if (!payload) {
      return;
    }
    setSeed((current) => {
      const nextSeed = current + 1;
      runAllocation(payload, nextSeed);
      return nextSeed;
    });
  }, [runAllocation]);

  const exportCsv = useCallback(() => {
    if (result) {
      exportAllocationCsv(result);
    }
  }, [result]);

  return {
    studioSummary,
    result,
    finance,
    runAllocation,
    rotateAllocation,
    exportCsv,
  };
}
