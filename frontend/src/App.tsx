import { useEffect, useState,useRef } from "react";
import SchedulerWorker from "./workers/schedule.worker.ts?worker&inline";
import * as htmlToImage from 'html-to-image';
import Coursegrid from "./CourseGrid";

type GroupedCourse = { [code: string]: any };
type Filters = {
  "no840": boolean,
  "day_offs":number[]
}
const DAYS_map = {"Monday":0, "Tuesday":1, "Wednesday":2, "Thursday":3, "Friday":4};
function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    }
    return false;
  });
  const [courses, setCourses] = useState<GroupedCourse>({});
  const [autoCoreqs, setAutoCoreqs] = useState(true);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [pinnedSections, setPinnedSections] = useState<Record<string, string>>({});
  const [schedules, setSchedules] = useState<any[][]>([]); 
  const [currentIndex, setCurrentIndex] = useState(0);     
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'cart' |'constraints'>('search'); 
  const [constraints,setConstraints] = useState<Filters>({
    "no840" : false,
    "day_offs" : [],
  })
  const [dayOffsOpen, setDayOffsOpen] = useState<boolean>(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [copied, setCopied] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    setLoadingCourses(true);
    fetch('/data.json')
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        setLoadingCourses(false);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setLoadingCourses(false);
      });
  }, []);


  useEffect(() => {
  if (!dayOffsOpen) {
    setConstraints(prev => ({
      ...prev,
      day_offs: [],
    }));
  }
}, [dayOffsOpen]);


  const filteredCourses = Object.entries(courses).filter(([code]) =>
    code.toLowerCase().includes(filter.toLowerCase())
  );

  const handleClearAll = () => {
    setSelected([]);
    setPinnedSections({});
};

  const toggleCourse = (code: string) => {
    const isRemoving = selected.includes(code);
    const newSelected = new Set(selected);
    const course = courses[code];

    if (isRemoving) {
      newSelected.delete(code);

      if (autoCoreqs && course?.corequisites) {
        course.corequisites.forEach((req: string) => newSelected.delete(req));
      }

    } else {
      newSelected.add(code);

      if (autoCoreqs && course?.corequisites) {
        course.corequisites.forEach((req: string) => newSelected.add(req));
      }
    }

    setSelected(Array.from(newSelected));
  };
  const toggleBoolean = (key:"no840") => {
    setConstraints(prev => ({
      ...prev,
      [key]:!prev[key],
    }))
  }
  const toggleArray = (key:"day_offs",value:number) => {
    setConstraints(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key],value],
    }))
  }
  const togglePin = (courseName: string, crn: string) => {
  setPinnedSections(prev => {
    if (prev[courseName] === crn) {
      const newState = { ...prev };
      delete newState[courseName];
      return newState;
    }
    return { ...prev, [courseName]: crn };
  });
};
  const generateSchedule = () => { 
    if (selected.length === 0) return alert("Please select a course.");
    
    setLoading(true);
    setSchedules([]);
    setCurrentIndex(0);

    const worker = new SchedulerWorker();

    worker.postMessage({
      selected,
      courses,
      constraints,
      pinnedSections
    });

    worker.onmessage = (e) => {
      const { status, schedules: resultSchedules } = e.data;
      
      if (status === "success") {
        setSchedules(resultSchedules);
        setHasSearched(true);
      } else {
        console.error("Worker Error");
        alert("An error occurred during calculation.");
      }
      
      setLoading(false);
      worker.terminate(); 
    };

    worker.onerror = (err) => {
      console.error("Worker System Error:", err);
      setLoading(false);
      alert("Calculation failed.");
      worker.terminate();
    };
  };

  const handleCopyAllCRNs = () => {
    if (schedules.length === 0  || !schedules[currentIndex]) return;

    const currentSchedule = schedules[currentIndex];
    const formattedText = currentSchedule.map((course:any) => {
      const crnVal = course.crn || "???";
      return `${course.code} - ${course.section}: ${crnVal}`;
    }).join(",\n");

    if(formattedText){
      navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(()=> setCopied(false),2000)
    }


  };

  const handleDownload = async () => {
    if (!gridRef.current) return;

    const node = gridRef.current;
    const contentNode = node.firstElementChild as HTMLElement;

    const originalOverflow = node.style.overflow;
    const originalHeight = node.style.height;
    const originalWidth = node.style.width;

    const originalContentHeight = contentNode ? contentNode.style.height : "";

    try {
      node.classList.add(
        "overflow-visible",
        "[-ms-overflow-style:none]",
        "[scrollbar-width:none]",
        "[&::-webkit-scrollbar]:hidden"
      );

      const isDark = document.documentElement.classList.contains('dark');
      const exportWidth = 1280;
      node.style.width = `${exportWidth}px`;

      if (contentNode) {
        contentNode.style.height = "auto";
      }

      const exportHeight = contentNode ? contentNode.scrollHeight : node.scrollHeight;

      node.style.height = `${exportHeight}px`;

      const dataUrl = await htmlToImage.toPng(node, {
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        pixelRatio: 2,
        width: exportWidth,
        height: exportHeight,
        style: {
          width: `${exportWidth}px`,
          height: `${exportHeight}px`,
        }
      });

      const link = document.createElement("a");
      link.download = `schedule-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

    } catch (error) {
      console.error(error);
      alert("Error when downloading the image.");
    } finally {
      node.classList.remove(
        "overflow-visible",
        "[-ms-overflow-style:none]",
        "[scrollbar-width:none]",
        "[&::-webkit-scrollbar]:hidden"
      );

      node.style.overflow = originalOverflow;
      node.style.height = originalHeight;
      node.style.width = originalWidth;

      if (contentNode) {
        contentNode.style.height = originalContentHeight;
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans overflow-hidden">
      
      <div className="w-90 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl z-20 ">
        
        <div className="p-5 pb-0 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Course Planner</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Termcode: 202502</p>
          </div>

          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="group p-2 rounded-lg transition-all duration-200 
              text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 
              dark:hover:text-yellow-400 dark:hover:bg-slate-700/50"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? (
              <svg className="w-5 h-5 transition-transform group-hover:rotate-90 duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 transform transition-transform group-hover:-rotate-12 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex px-5 mt-4 border-b border-slate-100 dark:border-slate-800 space-x-6">
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'search' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            Search Courses
            {activeTab === 'search' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"/>}
          </button>
          
          <button
            onClick={() => setActiveTab('cart')}
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'cart' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            Selected 
            <span className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full text-xs">
              {selected.length}
            </span>
            {activeTab === 'cart' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"/>}
          </button>

          <button
            onClick={() => setActiveTab('constraints')}
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'constraints' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            Filters
            {activeTab === 'constraints' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"/>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          
          {activeTab === 'search' && (
            <>
              
              <input
                type="text"
                placeholder="e.g.: MATH 101"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:text-white mb-2 transition-all placeholder:text-slate-400"
                onChange={(e) => setFilter(e.target.value)}
                disabled={loadingCourses}
              />
              <div className="flex justify-start mb-2">
                <button
                  onClick={() => setAutoCoreqs(!autoCoreqs)}
                  title="Automatically toggle main courses with Recits/Labs (IF 100 <=> IF 100R) "
                  className={`
                    flex items-center cursor-pointer gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border
                    ${autoCoreqs 
                      ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800" 
                      : "bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }
                  `}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${autoCoreqs ? "bg-indigo-500 animate-pulse" : "bg-slate-300"}`} />
                  {autoCoreqs ? "Auto-Coreqs ON" : "Auto-Coreqs OFF"}
                </button>
              </div>

              {loadingCourses ? (
                <>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 mr-3 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2 animate-pulse" />
                        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-48 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                filteredCourses.map(([code, group]) => {
                  const isSelected = selected.includes(code);
                  return (
                    <div
                      key={code}
                      onClick={() => toggleCourse(code)}
                      className={`flex items-center p-3 rounded-lg cursor-pointer border transition-all ${
                        isSelected 
                          ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800" 
                          : "bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-200 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${
                        isSelected ? "bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500" : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      
                      <div>
                        <div className={`text-sm font-bold ${isSelected ? "text-indigo-900 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"}`}>{code}</div>
                        <div className="text-xs text-slate-400 truncate w-48">{group.name}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'cart' && (
            <>
              {selected.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-500 mt-10 text-sm">No courses selected yet.</div>
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <button 
                      onClick={handleClearAll}
                      className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded border border-transparent hover:border-red-100 dark:hover:border-red-900 transition-all flex items-center gap-1"
                    >
                      <span>🗑️</span> Remove All
                    </button>
                  </div>

                  {selected.map((code) => (
                    <div key={code} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-3 mb-2 group transition-all hover:shadow-md">
                      
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                            {code}
                            {pinnedSections[code] && (
                              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 flex items-center gap-1" title="Section Locked">
                                🔒 <span className="font-bold">{courses[code]?.sections.find((s:any) => s.crn === pinnedSections[code])?.section}</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate w-48">{courses[code]?.name}</div>
                        </div>
                        <button 
                          onClick={() => toggleCourse(code)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          title="Remove Course"
                        >
                          ✕
                        </button>
                      </div>

                      {courses[code]?.sections && (
                        <details className="group/accordion mt-1">
                          <summary className="list-none cursor-pointer text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center justify-between select-none p-2 bg-indigo-50/50 dark:bg-indigo-900/20 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800">
                            <span>
                              {pinnedSections[code] 
                                ? "✨ Change Section" 
                                : "⚙️ Pin Section (Optional)"}
                            </span>
                            <span className="transform group-open/accordion:rotate-180 transition-transform text-[10px]">▼</span>
                          </summary>
                          
                          <div className="mt-2 grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1 pt-1 custom-scrollbar">
                            {courses[code].sections.map((section: any) => {
                              const isPinned = pinnedSections[code] === section.crn;
                              const instructorName = section.schedule?.[0]?.instructor || "Staff";
                              
                              return (
                                <button
                                  key={section.crn}
                                  onClick={() => togglePin(code, section.crn)}
                                  className={`
                                    relative flex flex-col items-start p-2 rounded-md border transition-all text-left group/btn
                                    ${isPinned 
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-1 ring-indigo-400' 
                                      : 'bg-white dark:bg-slate-700/50 text-gray-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-sm'
                                    }
                                  `}
                                >
                                  <div className="flex justify-between items-center w-full mb-1">
                                    <span className={`font-bold text-sm ${isPinned ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                                      Sec {section.section}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${isPinned ? 'bg-indigo-500 text-indigo-100' : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300'}`}>
                                      {section.crn}
                                    </span>
                                  </div>

                                  <div className={`text-xs flex items-center gap-1 w-full truncate ${isPinned ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                    <span className="opacity-70">👨‍🏫</span> 
                                    <span className="truncate" title={instructorName}>
                                      {instructorName}
                                    </span>
                                  </div>

                                  {isPinned && (
                                    <div className="absolute -top-1 -right-1 bg-white text-indigo-600 rounded-full p-0.5 shadow-sm border border-indigo-200">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </>
              )}
            </>
          )}
          {activeTab === 'constraints' && (
            <>
              <div className="text-slate-700 dark:text-slate-300 font-medium mb-4">Filters</div>
              
              <div className="flex flex-col gap-6">

                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Exclude 8:40 class</span>
                  <div onClick={() => toggleBoolean('no840')} className={`w-12 h-6 border flex items-center rounded-full cursor-pointer p-1 transition-colors ${constraints["no840"] ? 'bg-green-500 border-green-600 justify-end' : 'bg-gray-200 dark:bg-slate-600 dark:border-slate-500 justify-start'}`}>                 <div className="w-4 h-4 rounded-full bg-white shadow-md"/></div>
                </div>
                <div className="flex flex-col gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Days Off</span>
                    <div onClick={() => setDayOffsOpen(prev=> !prev)} className={`w-12 h-6 border flex items-center rounded-full cursor-pointer p-1 transition-colors ${dayOffsOpen ? 'bg-green-500 border-green-600 justify-end' : 'bg-gray-200 dark:bg-slate-600 dark:border-slate-500 justify-start'}`}>
                      <div className="w-4 h-4 rounded-full bg-white shadow-md"/></div>
                  </div>
                  {
                    dayOffsOpen && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                      {Object.entries(DAYS_map).map(([day, val]) => {
                        const isChosen = constraints.day_offs.includes(val);
                        return(
                          <button onClick={() => toggleArray("day_offs",Number(val))} value={val} key={day} 
                          className={`flex items-center px-3 py-2 text-xs font-medium rounded-lg cursor-pointer border transition-all ${
                        isChosen ? "bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300" : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"}`}
                          >
                              {day}</button>
                        )
                      }
                      )}
                    </div>
                    )
                  }
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <button
            onClick={generateSchedule}
            disabled={loading || selected.length === 0}
            className={`w-full py-3 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 ${
              loading || selected.length === 0
                ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed" 
                : "bg-indigo-600 dark:bg-indigo-500 cursor-pointer text-white hover:bg-indigo-700 dark:hover:bg-indigo-400 hover:shadow-lg"
            }`}
          >
            {loading ? "Calculating..." : "Generate Schedule"}
          </button>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          <a 
            href="https://github.com/enesdurannbey/su-course-planner" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current transition-transform group-hover:scale-110">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Developed by</span>
              <span className="text-xs font-bold leading-none">Hüseyin Enes Duran</span>
            </div>
          </a>
        </div>
      </div>


      <div className="flex-1 flex flex-col p-3 h-full relative">
        
        {schedules.length > 0 && (
          <div className="flex flex-col space-y-3 mb-2">
            
            <div className="flex justify-between items-center">
               
               <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                      Option <span className="text-indigo-600 dark:text-indigo-400 text-xl">{currentIndex + 1}</span>
                      <span className="text-slate-400 dark:text-slate-500 font-normal text-sm ml-1">/ {schedules.length}</span>
                  </h2>

                  
                  <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer text-indigo-700 dark:text-indigo-300 rounded-md transition-all text-xs font-bold border border-indigo-100 dark:border-indigo-800 group"
                    title="Download Schedule"
                  >
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    <span>Download Schedule As Image</span>
                  </button>
                  <button 
                    disabled={copied}
                    onClick={handleCopyAllCRNs}
                    className={`
                        flex items-center gap-1 px-3 py-1.5 rounded-md transition-all text-xs font-bold border group
                        ${copied 
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 cursor-default"
                          : "bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800 cursor-pointer" 
                        }
                      `}
                      title="Copy Course List with CRNs"
                  >
                    {copied ? (
                    <>
                      <svg className="w-4 h-4 transition-transform scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                      </svg>
                      <span>Copy All CRNs</span>
                    </>
                  )}
                  </button>
               </div>
               
               <div className="flex space-x-1">
                 <button 
                   disabled={currentIndex === 0}
                   onClick={() => setCurrentIndex(i => i - 1)}
                   className="py-0.5 px-3 transition-all bg-white dark:bg-slate-800 border dark:border-slate-700 not-disabled:cursor-pointer rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30"
                 >
                   ←
                 </button>
                 <button 
                   disabled={currentIndex === schedules.length - 1}
                   onClick={() => setCurrentIndex(i => i + 1)}
                   className="py-0.5 px-3 transition-all bg-white dark:bg-slate-800 border dark:border-slate-700 not-disabled:cursor-pointer rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30"
                 >
                   →
                 </button>
               </div>
            </div>

            
            <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent space-x-2">
              {(() => {
                const jumps = [];
                if (schedules.length > 0) jumps.push(1);
                
                for (let i = 5; i < schedules.length; i += 5) {
                  jumps.push(i);
                }
                
                if (schedules.length > 1 && !jumps.includes(schedules.length)) {
                  jumps.push(schedules.length);
                }
                
        
                jumps.sort((a, b) => a - b);

                return jumps.map((num) => {

                  const isExact = (currentIndex + 1) === num;

                  return (
                    <button
                      key={num}
                      onClick={() => setCurrentIndex(num - 1)}
                      className={`
                        shrink-0 px-3 py-1.5 text-xs font-bold rounded-md border transition-all
                        ${isExact 
                          ? "bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-md scale-105" 
                          : "bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400"
                        }
                      `}
                    >
                      {num}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}

        <div ref={gridRef} className="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          {schedules.length > 0 ? (
    <Coursegrid sections={schedules[currentIndex]} />
  ) : (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-6 text-center">
      {hasSearched ? (
        <>
          <div className="text-4xl mb-3">😕</div>
          <h3 className="font-bold text-slate-600 dark:text-slate-300 text-lg">No Schedule Found</h3>
          <p className="text-sm mt-1 max-w-xs">
            The selected courses, pinned sections or filters (e.g., 8:40 restriction) conflict with each other. Please relax constraints and try again.
          </p>
        </>
      ) : (
        <>
          <div className="text-4xl mb-3">📅</div>
          <p className="font-medium">Select your courses and press the Generate Schedule button.</p>
        </>
      )}
      
    </div>
  )}
        </div>

      </div>
    </div>
    
  );
  
}

export default App;