const fs = require('fs');
const parseBefore = require('csv-parse');
const generateBefore = require('csv-generate');
const transform = require('stream-transform');
const stringify = require('csv-stringify');

const promisify = require('./lib/promisify');
const store = require('./lib/store');
const utility = require('./lib/utility');
const metrics = require('./lib/metrics');

const INPUT_AUDIO_CSV = './sentences_with_audio.csv';
const INPUT_DELIMITER = '\t';
const OUTPUT_CSV = './tatoeba_corpus_v1.csv';
const OUTPUT_DELIMITER = ',';

const PRELIM_COLUMNS = {
  username: 'username',
  sentenceId: 'sentence_id',
  license: 'license',
  url: 'attribute_url',
  filepath: 'filepath',
};

const parse = promisify(parseBefore);
const generate = promisify(generateBefore);
const read = promisify(fs, fs.readFile);
const cp = promisify(fs, fs.copyFile);
const move = promisify(fs, fs.rename);

async function time(fn, ...args) {
  const start = Date.now();
  await fn.apply(null, args);
  const elapsedSeconds = (Date.now() - start) / 1000;
  console.log(`called ${fn.name} in ${elapsedSeconds}s`);
}

async function writeCSV(sentenceId, username, license, url, path) {
  const writable = fs.createWriteStream('file.txt')
}

async function getCSV(path) {
  const contents = await read(INPUT_AUDIO_CSV);
  return await parse(contents, { delimiter: INPUT_DELIMITER });
}

async function copyFile(sentenceId, username) {
  const outputPath = utility.getClipOutputPath(sentenceId, username);
  try {
    await move(utility.getClipInputPath(sentenceId), outputPath);
    return outputPath;
  } catch (err) {
    if (err.code === 'ENOENT') {
      // If file doesnt exist, we trap the error and move on.
      return null;
    }

    // All other errors, rethrow.
    throw err;
  }
}

async function runJob(sentenceId, username, license, url) {
  const exists = await utility.clipExists(sentenceId);
  if (!exists) {
    metrics.reject();
    return null;
  }

  const stored = await store(sentenceId, username, license, url);
  if (!stored) {
    metrics.reject();
    return null;
  }

  const path = await copyFile(sentenceId, username);
  if (!path) {
    metrics.reject();
    return null;
  }

  metrics.accept();
  return [username, sentenceId, license, url, path];
}

function doTransform(record, cb) {
  const [sentenceId, username, license, url] = record;
  runJob(sentenceId, username, license, url).then(record => {
    cb(null, record);
  }).catch(err => {
    console.error('transform error', err);
    cb(err);
  });
}

function streamAndSplitAudioCSV() {
  return new Promise((res, rej) => {
    const input = fs.createReadStream(INPUT_AUDIO_CSV);
    const output = fs.createWriteStream(OUTPUT_CSV);

    const parser = parseBefore({
      delimiter: INPUT_DELIMITER,
      // header: true,
      // columns: PRELIM_COLUMNS,
    });
    const transformer = transform(doTransform, {parallel: 10});
    const stringifier = stringify({delimiter: OUTPUT_DELIMITER});

    input.on('end', (one, two) => {
      console.log('ended');
      res();
    });
    output.on('finished', (one, two) => {
      console.log('finished');
      res();
    });
    input.on('error', err => {
      console.error('something bad happened', err);
      rej(err);
    });

    input.pipe(parser)
      .pipe(transformer)
      .pipe(stringifier)
      .pipe(output);
  });
}

async function go() {
  //const csv = await time(getCSV, INPUT_AUDIO_CSV);
  await streamAndSplitAudioCSV();
  store.print();
}

time(go).catch(console.log.bind(console));
