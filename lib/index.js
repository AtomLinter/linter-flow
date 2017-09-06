/* @flow */

// eslint-disable-next-line import/extensions
import { CompositeDisposable } from 'atom';
import path from 'path';

import handleData from './message';
import type { Linter } from './types';
import { check, findFlowPath } from './helpers';

export default {
  config: {
    executablePath: {
      type: 'string',
      default: 'flow',
      description: 'Absolute path to the Flow executable on your system.',
    },
    useGlobalFlow: {
      title: 'Use global flow installation',
      type: 'boolean',
      default: false,
      description: 'Make sure you have it in your $PATH',
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
    this.subscriptions.add(atom.config.observe('linter-flow.useGlobalFlow', (useGlobalFlow) => {
      this.useGlobalFlow = useGlobalFlow;
    }));
  },

  deactivate(): void {
    const helpers = require('atom-linter');

    if (atom.inDevMode()) {
      console.log('linter-flow:: Stopping flow...');
    }
    this.flowInstances.forEach(cwd =>
      helpers
        .exec(this.pathToFlow, ['stop'], { cwd })
        .catch(() => null),
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

        // Is flow enabled for current file?
        if (!fileText || fileText.indexOf('@flow') === -1) {
          return Promise.resolve([]);
        }

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

        const flowPath =
          this.useGlobalFlow ?
            this.pathToFlow :
            findFlowPath(filePath);

        return check(flowPath, args, options)
          .then(JSON.parse)
          .then(handleData);
      },
    };
  },
};
