import React from "react";

type Section = {
  code: string;
  section: string;
  schedule: {
    day_index: number;
    start_min: number;
    end_min: number;
    time: string;
    where?: string; 
    type?: string;  
  }[];
};

type Props = {
  sections: Section[];
};
const COURSE_COLORS = [
  "bg-indigo-600 border-indigo-700 hover:bg-indigo-700",
  "bg-emerald-600 border-emerald-700 hover:bg-emerald-700",
  "bg-sky-600 border-sky-700 hover:bg-sky-700",
  "bg-rose-600 border-rose-700 hover:bg-rose-700",
  "bg-amber-600 border-amber-700 hover:bg-amber-700",
  "bg-violet-600 border-violet-700 hover:bg-violet-700",
  "bg-teal-600 border-teal-700 hover:bg-teal-700",
];



const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const GRID_START_MIN = 520; 
const SLOT_HEIGHT = 64; 

const HOURS = [
  "08:40", "09:40", "10:40", "11:40", "12:40", 
  "13:40", "14:40", "15:40", "16:40", "17:40", "18:40"
];

export default function Coursegrid({ sections }: Props) {

  const getGridRowStart = (min: number) => {
    return Math.floor((min - GRID_START_MIN) / 60) + 1;
  };

  const getGridRowSpan = (start: number, end: number) => {
    const durationMin = end - start;
    return Math.ceil(durationMin / 60);
  };
  const getColorByCourseCode = (code: string) => {
  let hash = 0;

  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 10) - hash);
  }

  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
};


  return (
    <div className="h-full overflow-auto bg-gray-50 p-4">
      
      {/* HEADER (DAYS) */}
      <div className="grid grid-cols-[80px_repeat(5,1fr)] mb-2 sticky top-0 z-20 bg-gray-50">
        <div className="text-center text-xs font-bold text-gray-400 pt-2">Time</div>
        {DAYS.map((day) => (
          <div key={day} className="text-center font-bold text-gray-700 p-2 bg-blue-100 rounded mx-1">
            {day}
          </div>
        ))}
      </div>

      {/* GRID CONTAINER */}
      <div className="relative grid grid-cols-[80px_repeat(5,1fr)]">
        
        {/*BACKGROUND GRID AND TIME */}
        {HOURS.map((hour, index) => (
          <React.Fragment key={hour}>
            {/* Time Column */}
            <div 
              className="text-right pr-4 text-xs font-medium text-gray-400 flex items-center justify-end "
              style={{ gridRow: index + 1, height: '64px' }} 
            >
              {hour}
            </div>

            {/* Day Columns */}
            {DAYS.map((_, dayIndex) => (
              <div
                key={`${hour}-${dayIndex}`}
                className={`border-b border-r border-gray-200 h-16 ${ 
                   index === 0 ? "border-t" : "" 
                } ${dayIndex === 0 ? "border-l" : ""}`}
                style={{ 
                    gridColumn: dayIndex + 2, 
                    gridRow: index + 1 
                }} 
              />
            ))}
          </React.Fragment>
        ))}

        {/* COURSES */}
        {sections.map((section) =>
          section.schedule.map((sch, i) => {
            
            const rowStart = getGridRowStart(sch.start_min);
            const rowSpan = getGridRowSpan(sch.start_min, sch.end_min);
            const colStart = sch.day_index + 2;
            const colorClass = getColorByCourseCode(section.code);

            return (
              <div
  key={`${section.code}-${sch.day_index}-${i}`}
  className={`
    ${colorClass}
    text-white
    p-1 text-xs
    border-2
    rounded shadow-md
    hover:brightness-110
    transition-colors
    z-10
    flex flex-col
    overflow-hidden
    h-full
  `}
  style={{
    gridColumn: colStart,
    gridRow: `${rowStart} / span ${rowSpan}`,
  }}
>
  {/* TOP ROW */}
  <div className="flex justify-between items-start">
    <div className="font-bold truncate">
      {section.code}
    </div>
    <div className="text-[9px] font-bold whitespace-nowrap">
      {sch.time}
    </div>
  </div>

  {/* SECTION */}
  <div className="text-[10px] opacity-70 truncate">
    {section.section}
  </div>

  {/* BOTTOM SPACE */}
  <div className="flex-1" />

  {/* COURSE LOCATION */}
  {sch.where && (
    <div className="text-[10px] font-bold truncate">
      {sch.where}
    </div>
  )}
</div>
            );
          })
        )}

      </div>
    </div>
  );
}