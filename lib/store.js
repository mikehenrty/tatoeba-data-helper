const fs = require('fs');
const promisify = require('./promisify');
const utility = require('./utility');

const mkdir = promisify(fs, fs.mkdir);
const write = promisify(fs, fs.writeFile);

const users = {};
const licenses = {};
const sentences = {};
const urls = {};

async function mk(dir) {
  try {
    await mkdir(dir);
  } catch (err) {
    // Don't worry if directory already exists.
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

module.exports = async function (sentenceId, username, license, url) {
  if (sentences[sentenceId]) {
    console.error('repeat sentence id', sentenceId);
    return false;
  }

  if (!users[username]) {
    const out = utility.getClipOutputDir(username);
    await mk(out);
    await write(out + '/LICENCE.txt',
      `${license}\n${url}`);

    users[username] = {
      username,
      count: 0
    };
  }
  users[username].count++;

  if (!licenses[license]) {
    licenses[license] = {
      license,
      count: 0
    };
  }
  licenses[license].count++;

  if (!sentences[sentenceId]) {
    sentences[sentenceId] = {
      sentenceId,
      count: 0
    };
  }
  sentences[sentenceId].count++;

  if (!urls[url]) {
    urls[url] = {
      url,
      count: 0
    };
  }
  urls[url].count++;

  return true;
}

module.exports.print = function() {
  console.log('users', Object.keys(users).length);
  console.log('url', Object.keys(urls).length);
  console.log('licenses', Object.keys(licenses).length);
  console.log('sentences', Object.keys(sentences).length);

  const rank = Object.values(users).sort((a, b) => {
    if (a.count < b.count) {
      return -1;
    } else if (a.count > b.count) {
      return 1;
    }
    return 0;
  });

  const first = rank[rank.length - 1];
  console.log(urls);
  console.log(Object.keys(licenses));
  console.log(rank);
}
