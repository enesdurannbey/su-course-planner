import { useEffect, useState } from "react";
import Coursegrid from "./CourseGrid";

//types
type GroupedCourse = { [code: string]: any };
type Filters = {
  "no840": boolean,
  "day_offs":number[]
}
const DAYS_map = {"Monday":0, "Tuesday":1, "Wednesday":2, "Thursday":3, "Friday":4};
const API_URL = import.meta.env.VITE_API_URL;
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

  // Fetch data
  useEffect(() => {
    fetch(`${API_URL}/courses`)
      .then((res) => res.json())
      .then((data) => setCourses(data.courses))
      .catch((err) => console.error("API Error:", err));
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

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-90 bg-white border-r border-slate-200 flex flex-col shadow-xl z-20">
        
        {/* Header */}
        <div className="p-5 pb-0">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Course Planner</h1>
          <p className="text-xs text-slate-400 mt-1">Fall 2024 Term</p>
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
              />

              {filteredCourses.map(([code, group]) => {
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
              })}
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
      </div>


      {/* (SCHEDULE)  */}
      <div className="flex-1 flex flex-col p-6 h-full relative">
        
        {/* Navigation bar */}
        {schedules.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-700">Option {currentIndex + 1}</h2>
            
            <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(i => i - 1)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 disabled:opacity-30 font-bold text-slate-600"
              >
                &lt;
              </button>
              <span className="text-xs font-bold text-indigo-600 w-16 text-center">
                {currentIndex + 1} / {schedules.length}
              </span>
              <button
                disabled={currentIndex === schedules.length - 1}
                onClick={() => setCurrentIndex(i => i + 1)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 disabled:opacity-30 font-bold text-slate-600"
              >
                &gt;
              </button>
            </div>
          </div>
        )}

        {/* Main schedule  */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
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