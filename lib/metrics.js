const CLIP_COUNT = 280782;
const AUDIO_CSV_LINE_COUNT = 330776;
const SENTENCES_CSV_LINE_COUNT = 6109252;

const SPLIT = 5; // %5 progress indicator.
const AUDIO_CSV_SPLIT = Math.round(AUDIO_CSV_LINE_COUNT * SPLIT / 100);

let sofar = 0;
let rejected = 0;
let progressCount = 0;
let start = null;

let lastUpdate = null;
let lastSofar = 0;
let lastRejected = 0;

function timeSoFar() {
  return Date.now() - start;
}

function updateProgress() {
  ++progressCount;
  if (progressCount > AUDIO_CSV_SPLIT) {
    lastUpdate = lastUpdate || start;
    progressCount -= AUDIO_CSV_SPLIT;
    const progress = Math.round(100 * sofar / AUDIO_CSV_LINE_COUNT);
    const now = Date.now();
    const elapsed = (now - lastUpdate) / 1000;
    lastUpdate = now;

    const s = sofar - lastSofar;
    lastSofar = sofar;
    const r = rejected - lastRejected;
    lastRejected = rejected;

    console.log(
      `progress ${progress}% (${s} processed, ${r} rejected, in ${elapsed}s`
    );
  }
}

function process(accepted) {
  start = start || Date.now();
  ++sofar;
  if (!accepted) {
    ++rejected;
  }
  updateProgress();
}

module.exports = {
  accept: () => { process(true); },
  reject: () => { process(false); },
  print: () => {
    console.log(`processed ${sofar}, rejected ${rejected}`);
  },
};
