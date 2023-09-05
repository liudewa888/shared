const queueSet = new Set();
const activePreFlushCbSet = new Set();
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
  flushPreFlushCbs();
  queueSet.forEach((job: any) => {
    job();
    queueSet.delete(job);
  });
  isFlushPending = false;
}

function flushPreFlushCbs() {
  activePreFlushCbSet.forEach((job: any) => {
    job();
    activePreFlushCbSet.delete(job);
  });
}

export function queuePreFlushCb(job) {
  activePreFlushCbSet.add(job);
  queueFlush();
}

const p = Promise.resolve();
export function nextTick(fn?) {
  return fn ? p.then(fn) : p;
}
