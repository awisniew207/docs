import util from 'node:util';

export const logIfVerbose = (value: any, VERBOSE_LOGGING: boolean) => {
  if (VERBOSE_LOGGING) {
    console.log(util.inspect(value, { depth: null, colors: true }));
  }
  return value;
};
