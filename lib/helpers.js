'use babel';
/* @flow */

const helpers = require('atom-linter');

export function check(pathToFlow: string, args: Array<string>, options: Object): Promise<string> {
  return helpers
    .exec(pathToFlow, args, options)
    .catch((error: string | Object) => {
      const errorM: string = String(error).toLowerCase();
      if (errorM.indexOf('rechecking') !== -1 ||
        errorM.indexOf('launching') !== -1 ||
        errorM.indexOf('processing') !== -1 ||
        errorM.indexOf('starting') !== -1 ||
        errorM.indexOf('spawned') !== -1 ||
        errorM.indexOf('logs') !== -1
      ) {
        return check(pathToFlow, args, options);
      }
      throw error;
    });
}
