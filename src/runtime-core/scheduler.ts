const queueSet = new Set();
let isFlushPending = false;
export function queueJobs(job) {
  queueSet.add(job);
  queueFlush();
}

function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(flushJobs);
}

function flushJobs() {
  queueSet.forEach((job: any) => {
    job();
    queueSet.delete(job);
  });
  isFlushPending = false;
}

const p = Promise.resolve();
export function nextTick(fn?) {
  return fn ? p.then(fn) : p;
}
