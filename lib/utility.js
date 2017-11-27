const fs = require('fs');
const path = require('path');

const CLIP_PATH = './clips/';
const OUTPUT_CLIP_PATH = './creators/';

exports.getClipInputPath = function(sentenceId) {
  return CLIP_PATH + sentenceId + '.mp3';
}

exports.getClipOutputDir = function(username) {
  return OUTPUT_CLIP_PATH + username;
}

exports.getClipOutputPath = function(sentenceId, username) {
  return path.join(exports.getClipOutputDir(username), sentenceId + '.mp3');
}

exports.clipExists = function(sentenceId) {
  return new Promise((res, rej) => {
    fs.exists(exports.getClipInputPath(sentenceId), exists => {
      res(exists);
    });
  });
}
