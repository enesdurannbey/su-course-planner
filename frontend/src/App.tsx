import { useEffect, useState,useRef } from "react";
import * as htmlToImage from 'html-to-image';
import Coursegrid from "./CourseGrid";

//types
type GroupedCourse = { [code: string]: any };
type Filters = {
  "no840": boolean,
  "day_offs":number[]
}
const DAYS_map = {"Monday":0, "Tuesday":1, "Wednesday":2, "Thursday":3, "Friday":4};
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  // States
  const [courses, setCourses] = useState<GroupedCourse>({});
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
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

  // Fetch data
  useEffect(() => {
    setLoadingCourses(true);
    fetch(`${API_URL}/courses`)
      .then((res) => res.json())
      .then((data) => {
        setCourses(data.courses);
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


  //search filtering
  const filteredCourses = Object.entries(courses).filter(([code]) =>
    code.toLowerCase().includes(filter.toLowerCase())
  );

  // functions
  const toggleCourse = (code: string) => {
    setSelected(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
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
  const generateSchedule = async () => {
    if (selected.length === 0) return alert("Please select a course.");
    
    setLoading(true);
    setSchedules([]);
    setCurrentIndex(0);

    try {
      const res = await fetch(`${API_URL}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selected,constraints }),
      });
      const data = await res.json();
      setSchedules(data.schedules);
      setHasSearched(true);
    } catch (error) {
      console.error(error);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAllCRNs = () => {
    if (schedules.length === 0  || !schedules[currentIndex]) return;

    const currentSchedule = schedules[currentIndex];
    const formattedText = currentSchedule.map((course:any) => {
      const crnVal = course.crn || "???";
      return `${course.code} - ${course.section}: ${crnVal}`;
    }).join("\n,");

    if(formattedText){
      navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(()=> setCopied(false),2000)
    }


  };

  const handleDownload = async () => {
  if (!gridRef.current) return;

  const node = gridRef.current;

  const originalOverflow = node.style.overflow;
  const originalHeight = node.style.height;

  try {
    node.classList.add(
      "overflow-visible",
      "[-ms-overflow-style:none]",
      "[scrollbar-width:none]",
      "[&::-webkit-scrollbar]:hidden"
    );

    node.style.height = `${node.scrollHeight}px`;

    const dataUrl = await htmlToImage.toPng(node, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      width: node.scrollWidth,
      height: node.scrollHeight,
    });

    const link = document.createElement("a");
    link.download = `schedule-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  } finally {
    node.classList.remove(
      "overflow-visible",
      "[-ms-overflow-style:none]",
      "[scrollbar-width:none]",
      "[&::-webkit-scrollbar]:hidden"
    );

    node.style.overflow = originalOverflow;
    node.style.height = originalHeight;
  }
};


  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-90 bg-white border-r border-slate-200 flex flex-col shadow-xl z-20">
        
        {/* Header */}
        <div className="p-5 pb-0">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Course Planner</h1>
          <p className="text-xs text-slate-400 mt-1">Termcode: 202502</p>
        </div>

        {/* Tabs */}
        <div className="flex px-5 mt-4 border-b border-slate-100 space-x-6">
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'search' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Search Courses
            {activeTab === 'search' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full"/>}
          </button>
          
          <button
            onClick={() => setActiveTab('cart')}
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'cart' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Selected 
            <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
              {selected.length}
            </span>
            {activeTab === 'cart' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full"/>}
          </button>

          <button
            onClick={() => setActiveTab('constraints')}
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'constraints' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Filters
            {activeTab === 'constraints' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full"/>}
          </button>
        </div>

        {/* List section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
          
          {/* search */}
          {activeTab === 'search' && (
            <>
              <input
                type="text"
                placeholder="e.g.: MATH 101"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2 transition-all"
                onChange={(e) => setFilter(e.target.value)}
                disabled={loadingCourses}
              />

              {loadingCourses ? (
                <>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center p-3 rounded-lg bg-white border border-slate-200">
                      <div className="w-4 h-4 rounded bg-slate-200 mr-3 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-24 mb-2 animate-pulse" />
                        <div className="h-3 bg-slate-100 rounded w-48 animate-pulse" />
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
                          ? "bg-indigo-50 border-indigo-200" 
                          : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                      }`}
                    >
                      {/* course checkbox */}
                      <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${
                        isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      
                      <div>
                        <div className={`text-sm font-bold ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>{code}</div>
                        <div className="text-xs text-slate-400 truncate w-48">{group.name}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* chosen tab */}
          {activeTab === 'cart' && (
            selected.length === 0 
              ? <div className="text-center text-slate-400 mt-10 text-sm">No courses selected yet.</div>
              : selected.map((code) => (
                  <div key={code} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm group">
                    <div>
                      <div className="font-bold text-slate-700 text-sm">{code}</div>
                      <div className="text-xs text-slate-400">{courses[code]?.name}</div>
                    </div>
                    <button 
                      onClick={() => toggleCourse(code)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))
          )}
          {/*Constraints */}
          {activeTab === 'constraints' && (
            <>
              <div>Filters</div>
              
              <div className="flex flex-col gap-6">

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Exclude 8:40 class</span>
                  <div onClick={() => toggleBoolean('no840')} className={`w-12 h-6 border flex items-center rounded-full cursor-pointer p-1 transition-colors ${constraints["no840"] ? 'bg-green-500 justify-end' : 'bg-gray-200 justify-start'}`}>                 <div className="w-4 h-4 rounded-full bg-white shadow-md"/></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Days Off</span>
                  <div onClick={() => setDayOffsOpen(prev=> !prev)} className={`w-12 h-6 border flex items-center rounded-full cursor-pointer p-1 transition-colors ${dayOffsOpen ? 'bg-green-500 justify-end' : 'bg-gray-200 justify-start'}`}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-md"/></div>
                </div>
                {
                  dayOffsOpen && (
                    <>
                      <div className="flex flex-wrap gap-2">
                      {Object.entries(DAYS_map).map(([day, val]) => {
                        const isChosen = constraints.day_offs.includes(val);
                        return(
                          <button onClick={() => toggleArray("day_offs",Number(val))} value={val} key={day} 
                          className={`flex items-center p-3 rounded-lg cursor-pointer border transition-all ${
                        isChosen ? "bg-indigo-200 border-indigo-200" : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"}`}
                          >
                              {day}</button>
                        )
                      }
                        
                      )}
                    </div>
                    
                    </>
                    
                  )
                }
              </div>
            </>
          )}
        </div>

        {/* action button */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={generateSchedule}
            disabled={loading || selected.length === 0}
            className={`w-full py-3 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 ${
              loading || selected.length === 0
                ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg"
            }`}
          >
            {loading ? "Calculating..." : "Generate Schedule"}
          </button>
        </div>
        <div className="p-3 bg-white border-t border-slate-100 flex justify-center">
          <a 
            href="https://github.com/enesdurannbey/su-course-planner" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 transition-colors group"
          >
            {/* GitHub */}
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


      {/* (SCHEDULE)  */}
      <div className="flex-1 flex flex-col p-3 h-full relative">
        
        {/* Navigation bar - Pagination */}
        {schedules.length > 0 && (
          <div className="flex flex-col space-y-3 mb-2">
            
            <div className="flex justify-between items-center">
               
               <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-slate-700">
                      Option <span className="text-indigo-600 text-xl">{currentIndex + 1}</span>
                      <span className="text-slate-400 font-normal text-sm ml-1">/ {schedules.length}</span>
                  </h2>

                  
                  <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 cursor-pointer text-indigo-700 rounded-md transition-all text-xs font-bold border border-indigo-100 group"
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
                          ? "bg-green-100 text-green-700 border-green-200 cursor-default"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100 cursor-pointer" 
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
                   className="py-0.5 px-3 transition-all bg-white border not-disabled:cursor-pointer rounded text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                 >
                   ←
                 </button>
                 <button 
                   disabled={currentIndex === schedules.length - 1}
                   onClick={() => setCurrentIndex(i => i + 1)}
                   className="py-0.5 px-3 transition-all bg-white border not-disabled:cursor-pointer rounded text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                 >
                   →
                 </button>
               </div>
            </div>

            
            <div className="w-full bg-white border border-slate-200 rounded-lg p-2 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent space-x-2">
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
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105" 
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600"
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

        {/* Main schedule  */}
        <div ref={gridRef} className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
          {schedules.length > 0 ? (
    <Coursegrid sections={schedules[currentIndex]} />
  ) : (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 p-6 text-center">
      {hasSearched ? (
        <>
          <div className="text-4xl mb-3">😕</div>
          <h3 className="font-bold text-slate-600 text-lg">No Schedule Found</h3>
          <p className="text-sm mt-1 max-w-xs">
            The selected courses or filters (e.g., 8:40 restriction) conflict with each other. Please relax constraints and try again.
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