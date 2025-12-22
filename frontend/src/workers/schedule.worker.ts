import { runScheduler } from "../logic/scheduler";

self.onmessage = (e: MessageEvent) => {
  const { selected, courses, constraints, pinnedSections } = e.data;

  try {
    const result = runScheduler(selected, courses, constraints, pinnedSections);
    
    self.postMessage({ status: "success", schedules: result });
  } catch (error) {
    console.error("Worker Logic Error:", error);
    self.postMessage({ status: "error", error: error });
  }
};