module.exports = function promisify(ctx, func) {
  if (!func) {
    func = ctx;
    ctx = null;
  }
  return function(...args) {
    return new Promise((res, rej) => {
      args.push((err, result) => {
        if (err) {
          rej(err);
          return;
        }
        res(result);
      });
      func.apply(ctx, args);
    });
  };
}
