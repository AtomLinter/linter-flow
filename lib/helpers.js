'use babel';
/* @flow */
const helpers = require('atom-linter');

export function check(
  pathToFlow: string,
  args: Array<string>,
  options: Object,
  startTime: number = Date.now()
): Promise<string> {
  return helpers
    .exec(pathToFlow, args, options)
    .catch((error: string | Object) => {
      const errorM: string = String(error).toLowerCase();

      // If we'be been waiting for more than 10 seconds, just give up
      if (Date.now() - startTime > 10000) {
        return '[]';
      }
      // Check for the common flow status messages and ignore them
      if (errorM.indexOf('rechecking') !== -1 ||
        errorM.indexOf('launching') !== -1 ||
        errorM.indexOf('processing') !== -1 ||
        errorM.indexOf('starting') !== -1 ||
        errorM.indexOf('spawned') !== -1 ||
        errorM.indexOf('logs') !== -1 ||
        errorM.indexOf('initializing') !== -1
      ) {
        return check(pathToFlow, args, options);
      }
      throw error;
    });
}
