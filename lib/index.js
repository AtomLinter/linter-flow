'use babel';
/* @flow */

import { CompositeDisposable } from 'atom';
import path from 'path';

import handleData from './message.js';
import type { Linter } from './types.js';
import check from './helpers.js';

export default {
  config: {
    executablePath: {
      type: 'string',
      default: 'flow',
      description: 'Absolute path to the Flow executable on your system.',
    },
  },

  activate(): void {
    require('atom-package-deps').install('linter-flow');

    this.lastConfigError = {};
    this.flowInstances = new Set();

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-flow.executablePath', (pathToFlow) => {
      this.pathToFlow = pathToFlow;
    }));
  },

  deactivate(): void {
    const helpers = require('atom-linter');

    if (atom.inDevMode()) {
      console.log('linter-flow:: Stopping flow...');
    }
    this.flowInstances.forEach((cwd) =>
      helpers
        .exec(this.pathToFlow, ['stop'], { cwd })
        .catch(() => null)
    );
    this.subscriptions.dispose();
  },

  provideLinter(): Linter {
    const helpers = require('atom-linter');

    return {
      grammarScopes: [
        'source.js',
        'source.js.jsx',
        'source.babel',
        'source.js-semantic',
        'source.es6',
      ],
      scope: 'project',
      name: 'Flow',
      lintOnFly: true,
      lint: (TextEditor) => {
        const filePath = TextEditor.getPath();
        const fileText = TextEditor.getText();

        // Check if .flowconfig file is present
        const flowConfig = helpers.find(filePath, '.flowconfig');
        if (!flowConfig) {
          // Only warn every 5 min
          if (!this.lastConfigError[filePath] ||
              this.lastConfigError[filePath] + (5 * 60 * 1000) < Date.now()) {
            atom.notifications.addWarning('[Linter-Flow] Missing .flowconfig file.', {
              detail: 'To get started with Flow, run `flow init`.',
              dismissable: true,
            });
            this.lastConfigError[filePath] = Date.now();
          }
          return Promise.resolve([]);
        } else if (Object.hasOwnProperty.call(this.lastConfigError, filePath)) {
          delete this.lastConfigError[filePath];
        }

        let args;
        let options;

        const cwd = path.dirname(flowConfig);
        this.flowInstances.add(cwd);
        // Use `check-contents` for unsaved files, and `status` for saved files.
        if (TextEditor.isModified()) {
          args = ['check-contents', '--json', '--root', cwd, filePath];
          options = { cwd, stdin: fileText, ignoreExitCode: true };
        } else {
          args = ['status', '--json', filePath];
          options = { cwd, ignoreExitCode: true };
        }

        return check(this.pathToFlow, args, options)
          .then(JSON.parse)
          .then(handleData);
      },
    };
  },
};
