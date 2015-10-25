'use babel';

import { CompositeDisposable } from 'atom';
import path from 'path';

import handleData from './lib/message.js';
import servers from './lib/servers.js';

class LinterFlow {
  config = {
    executablePath: {
      type: 'string',
      default: 'flow',
    },
  }

  activate() {
    require('atom-package-deps').install('linter-flow');

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-flow.executablePath', (pathToFlow) => {
      this.pathToFlow = pathToFlow;
    }));
  }

  deactivate() {
    servers.stop();
    this.subscriptions.dispose();
  }

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
        if (fileText.indexOf('@flow') === -1) {
          return [];
        }

        // Check if .flowconfig file is present
        const flowConfig = helpers.findFile(filePath, '.flowconfig');
        if (!flowConfig) {
          atom.notifications.addWarning('[Linter-Flow] Missing .flowconfig file.');
          return [];
        }

        return servers.start(this.pathToFlow, flowConfig).then(() => {
          return helpers
            .exec(this.pathToFlow, ['--json'], { cwd: path.dirname(filePath) })
            .then(JSON.parse)
            .then(handleData);
        });
      },
    };
  }
}

export default new LinterFlow();
