'use babel';
/* @flow */


export function check(pathToFlow: string, args: Array<string>, options: Object): Promise<string> {
  const helpers = require('atom-linter');

  return helpers
    .exec(pathToFlow, args, options)
    .catch((error: String) => {
      const errorM: string = String(error);
      if (errorM.indexOf('Launching') !== -1 ||
        errorM.indexOf('launching') !== -1 ||
        errorM.indexOf('Starting') !== -1 ||
        errorM.indexOf('starting') !== -1 ||
        errorM.indexOf('Spawned') !== -1 ||
        errorM.indexOf('Logs') !== -1
      ) {
        return check(pathToFlow, args, options);
      }
      throw error;
    });
}
