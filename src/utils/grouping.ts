import type { ProgramInput, Studio, StudioSummary } from '../types';

export type StudioOptions = {
  allowMixing: boolean;
  studioCap: number;
};

export function generateStudios(programs: ProgramInput[], options: StudioOptions): StudioSummary {
  const sanitizedPrograms = programs
    .filter((program) => program.size > 0)
    .map((program) => ({ ...program }));
  const totalStudents = sanitizedPrograms.reduce((sum, program) => sum + program.size, 0);

  if (totalStudents === 0 || options.studioCap <= 0) {
    return { studios: [], totalStudents: 0, totalStudios: 0, remainder: 0 };
  }

  const studios: Studio[] = [];
  let studioCounter = 1;

  if (options.allowMixing) {
    const programCount = sanitizedPrograms.length;
    if (programCount === 0) {
      return { studios: [], totalStudents: 0, totalStudios: 0, remainder: 0 };
    }

    let share = Math.floor(options.studioCap / programCount);
    share = Math.max(1, Math.min(share, options.studioCap));

    while (share > 0) {
      const possibleStudios = Math.min(
        ...sanitizedPrograms.map((program) => Math.floor(program.size / share))
      );

      if (possibleStudios === 0) {
        share -= 1;
        continue;
      }

      for (let i = 0; i < possibleStudios; i += 1) {
        const distribution: Record<string, number> = {};
        sanitizedPrograms.forEach((program) => {
          program.size -= share;
          distribution[program.label] = share;
        });

        studios.push({
          id: `S-${studioCounter.toString().padStart(3, '0')}`,
          size: share * programCount,
          programs: distribution,
        });
        studioCounter += 1;
      }
    }
  } else {
    sanitizedPrograms.forEach((program) => {
      let studentsLeft = program.size;
      while (studentsLeft > 0) {
        const size = Math.min(options.studioCap, studentsLeft);
        studios.push({
          id: `S-${studioCounter.toString().padStart(3, '0')}`,
          size,
          programs: { [program.label]: size },
        });
        studentsLeft -= size;
        program.size = studentsLeft;
        studioCounter += 1;
      }
    });
  }

  const remainder = sanitizedPrograms.reduce((sum, program) => sum + program.size, 0);

  return {
    studios,
    totalStudents,
    totalStudios: studios.length,
    remainder,
  };
}
