
// constants
const BIT_RESOLUTION = 10;
const SLOTS_PER_DAY = Math.floor((24 * 60) / BIT_RESOLUTION);

// Types
export interface TimeSlot {
  day_index: number;
  start_min: number;
  end_min: number;
}

export interface Section {
  section: string;
  schedule: TimeSlot[];
  [key: string]: any; 
}

export interface CourseData {
  name: string;
  sections: Section[];
}

export interface GroupedCourses {
  [code: string]: CourseData;
}

function calculateSectionBitmask(schedule: TimeSlot[]): bigint {
  let mask = 0n;
  for (const slot of schedule) {
    if (slot.day_index === -1 || slot.start_min === undefined) continue;

    const startMin = Number(slot.start_min);
    const endMin = Number(slot.end_min);
    const dayIndex = Number(slot.day_index);

    const dayOffset = dayIndex * SLOTS_PER_DAY;
    const startSlot = Math.floor(startMin / BIT_RESOLUTION);
    const endSlot = Math.floor(endMin / BIT_RESOLUTION);

    for (let i = startSlot; i < endSlot; i++) {
      const globalPosition = BigInt(dayOffset + i);
      mask |= (1n << globalPosition);
    }
  }
  return mask;
}

// Constraint Mask
function calculateConstraintMask(constraints: { no840: boolean; day_offs: number[] }): bigint {
  let constraintMask = 0n;

  if (constraints.no840) {
    const startMin = 8 * 60 + 40;
    const endMin = 9 * 60 + 30;
    const startSlot = Math.floor(startMin / BIT_RESOLUTION);
    const endSlot = Math.floor(endMin / BIT_RESOLUTION);

    for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
      const dayOffset = dayIndex * SLOTS_PER_DAY;
      for (let i = startSlot; i < endSlot; i++) {
        constraintMask |= (1n << BigInt(dayOffset + i));
      }
    }
  }

  if (constraints.day_offs && constraints.day_offs.length > 0) {
    for (const dayIndex of constraints.day_offs) {
        if (dayIndex < 0 || dayIndex > 6) continue;
        
        const dayOffset = dayIndex * SLOTS_PER_DAY;
        for (let i = 0; i < SLOTS_PER_DAY; i++) {
            constraintMask |= (1n << BigInt(dayOffset + i));
        }
    }
  }

  return constraintMask;
}

// Main algorihm
function solveScheduleRecursive(
  selectedCodes: string[],
  allCourses: GroupedCourses,
  constraints: { no840: boolean; day_offs: number[] },
  maxResults = 5000
): any[][] {
  const initialMask = calculateConstraintMask(constraints);
  const targetCourses: { code: string; sections: { data: Section; mask: bigint }[] }[] = [];

  // Data manipulation
  for (const code of selectedCodes) {
    if (!allCourses[code]) continue;
    
    const preparedSections = [];
    for (const section of allCourses[code].sections) {
      if (section.section === "X") continue;
      
      const mask = calculateSectionBitmask(section.schedule);
      if ((mask & initialMask) !== 0n) continue; //? eliminate early

      preparedSections.push({ data: section, mask });
    }

    if (preparedSections.length === 0) return []; 
    
    targetCourses.push({ code, sections: preparedSections });
  }

  // Fail fast
  targetCourses.sort((a, b) => a.sections.length - b.sections.length);

  const validSchedules: any[][] = [];

  function backtrack(courseIdx: number, currentPath: Section[], combinedMask: bigint): boolean {
    if (courseIdx === targetCourses.length) {
      validSchedules.push([...currentPath]);
      return validSchedules.length >= maxResults;
    }

    const currentCourse = targetCourses[courseIdx];
    for (const sectionObj of currentCourse.sections) {
      if ((combinedMask & sectionObj.mask) !== 0n) continue;

      currentPath.push(sectionObj.data);
      const newMask = combinedMask | sectionObj.mask;

      if (backtrack(courseIdx + 1, currentPath, newMask)) return true;
      
      currentPath.pop();
    }
    return false;
  }

  if (targetCourses.length > 0) {
    backtrack(0, [], initialMask);
  }

  return validSchedules;
}

// Visual signature
function groupSchedulesByVisuals(schedules: any[][]): any[][] {
  const groupedBySig: { [key: string]: any[][] } = {};

  for (const sched of schedules) {
    const times: string[] = [];
    for (const section of sched) {
      for (const slot of section.schedule) {
        if (slot.day_index !== -1) {
          times.push(`${slot.day_index}-${slot.start_min}-${slot.end_min}`);
        }
      }
    }
    times.sort();
    const signature = times.join("|");

    if (!groupedBySig[signature]) groupedBySig[signature] = [];
    groupedBySig[signature].push(sched);
  }

  const finalResult: any[][] = [];
  const groups = Object.values(groupedBySig);
  
  if (groups.length > 0) {
    const maxLen = Math.max(...groups.map(g => g.length));
    for (let i = 0; i < maxLen; i++) {
      for (const group of groups) {
        if (i < group.length) finalResult.push(group[i]);
      }
    }
  }
  
  return finalResult.slice(0, 100);
}

// Worker Wrapper
export function runScheduler(
  selectedCodes: string[],
  allCourses: GroupedCourses,
  constraints: { no840: boolean; day_offs: number[] }
) {
    const rawSchedules = solveScheduleRecursive(selectedCodes, allCourses, constraints);
    return groupSchedulesByVisuals(rawSchedules);
}