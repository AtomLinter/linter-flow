'use babel';

import { CompositeDisposable } from 'atom';
import { spawn } from 'child_process';
import path from 'path';

import toLinterMsg from './lib/message.js';

class LinterFlow {
  config = {
    pathToFlow: {
      type: 'string',
      default: 'flow',
    },
  }

  activate() {
    require('atom-package-deps').install('linter-flow').then(() => {
      console.log('activate linter-flow');
    });

    this.startedServers = new Map();
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-flow.pathToFlow', (pathToFlow) => {
      this.pathToFlow = pathToFlow;
    }));
  }

  deactivate() {
    console.log('deactivate linter-flow');

    this.startedServers.forEach((server, flowConfigPath) => {
      atom.notifications.addInfo(`[Linter-Flow] Killing Flow server in ${flowConfigPath}`);
      server.kill('SIGKILL');
    });
    this.startedServers.clear();
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
        const fileText = TextEditor.buffer && TextEditor.buffer.cachedText;

        // Is flow enabled for current file ?
        if (fileText.indexOf('@flow') === -1) {
          return [];
        }

        // Check if .flowconfig file is present
        const flowConfig = helpers.findFile(filePath, '.flowconfig');
        if (!flowConfig) {
          atom.notifications.addWarning('[Linter-Flow] Missing .flowconfig file.');
          console.warn('Missing .flowconfig file.');
          return [];
        }

        return new Promise((resolve) => {
          // Start flow server for project if necessary
          const flowConfigPath = path.dirname(flowConfig);
          if (!this.startedServers.has(flowConfigPath)) {
            atom.notifications.addInfo(`[Linter-Flow] Starting Flow server in ${flowConfigPath}`);

            const serverProcess = spawn(this.pathToFlow, ['server', flowConfig]);
            const logIt = data => {
              const message = data.toString();
              console.log('Flow server:\n' + message);
              if (message.indexOf('READY') > -1) {
                atom.notifications.addInfo(`[Linter-Flow] Flow server ready`);
                resolve();
              }
            };
            serverProcess.stdout.on('data', logIt);
            serverProcess.stderr.on('data', logIt);
            serverProcess.on('exit', (code, signal) => {
              if (code === 2 && signal === null) {
                atom.notifications.addError('[Linter-Flow] Flow server unexpectedly exited.');
                console.error('Flow server unexpectedly exited', flowConfig);
              }
            });
            this.startedServers.set(flowConfigPath, serverProcess);
          } else {
            resolve();
          }
        }).then(() => {
          return helpers
            .exec(this.pathToFlow, ['--json'], { cwd: path.dirname(filePath) })
            .then(JSON.parse)
            .then((contents) => {
              if (contents.passed || !contents.errors) {
                return [];
              }
              return contents.errors
                .map(item => item.message)
                .map(toLinterMsg);
            });
        });
      },
    };
  }
}

export default new LinterFlow();
