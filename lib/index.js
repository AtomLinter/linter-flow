'use babel';

import { CompositeDisposable } from 'atom';
import path from 'path';

import handleData from './message.js';
import servers from './servers.js';

export default {
  config: {
    executablePath: {
      type: 'string',
      default: 'flow',
      description: 'Absolute path to the Flow executable on your system.',
    },
    enableAll: {
      type: 'boolean',
      default: false,
      description: 'Typecheck all files, not just @flow',
    },
  },

  activate() {
    require('atom-package-deps').install('linter-flow');

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-flow.executablePath', (pathToFlow) => {
      this.pathToFlow = pathToFlow;
    }));
    this.subscriptions.add(atom.config.observe('linter-flow.enableAll', (enableAll) => {
      this.enableAll = enableAll;
    }));
  },

  deactivate() {
    servers.stop();
    this.subscriptions.dispose();
  },

  provideLinter() {
    const helpers = require('atom-linter');

    return {
      grammarScopes: [
        'source.js',
        'source.js.jsx',
        'source.babel',
        'source.js-semantic',
        'source.es6',
      ],
      scope: 'file',
      name: 'Flow',
      lintOnFly: true,
      lint: (TextEditor) => {
        const filePath = TextEditor.getPath();
        const fileText = TextEditor.buffer.cachedText;

        // Is flow enabled for current file ?
        if (fileText.indexOf('@flow') === -1 && !this.enableAll) {
          return [];
        }

        // Check if .flowconfig file is present
        const flowConfig = helpers.findFile(filePath, '.flowconfig');
        if (!flowConfig) {
          atom.notifications.addWarning('[Linter-Flow] Missing .flowconfig file.');
          return [];
        }

        const args = ['check', '--json', filePath];
        if (this.enableAll) {
          args.push('--all');
        }

        return servers.start(this.pathToFlow, flowConfig).then(() => {
          return helpers
            .exec(this.pathToFlow, args, { cwd: path.dirname(filePath) })
            .then(JSON.parse)
            .then(handleData);
        });
      },
    };
  },
};
