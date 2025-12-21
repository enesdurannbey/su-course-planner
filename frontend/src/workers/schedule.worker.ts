import { runScheduler } from "../logic/scheduler";

self.onmessage = (e: MessageEvent) => {
  const { selected, courses, constraints } = e.data;

  try {
    const result = runScheduler(selected, courses, constraints);
    
    self.postMessage({ status: "success", schedules: result });
  } catch (error) {
    self.postMessage({ status: "error", error: error });
  }
};