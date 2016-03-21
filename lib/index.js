'use babel';
/* @flow */

import { CompositeDisposable } from 'atom';
import path from 'path';

import handleData from './message.js';
import { check } from './helpers';

import type { LinterMessage } from './message';


type BufferType = {
  cachedText: string;
  getText(): string;
}

type TextEditorType = {
  getPath(): string;
  buffer: BufferType;
  isModified(): boolean;
}

type Linter = {
  grammarScopes: Array<string>;
  scope: 'file' | 'project';
  name?: string;
  lintOnFly: boolean;
  lint(TextEditor: TextEditorType): Array<LinterMessage> | Promise<Array<LinterMessage>>;
};

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

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-flow.executablePath', (pathToFlow) => {
      this.pathToFlow = pathToFlow;
    }));
  },

  deactivate(): void {
    const helpers = require('atom-linter');
    console.log('deactivating... lintet-flow');
    helpers.exec(this.pathToFlow, ['stop'], {}).catch(() => null);
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

        // Is flow enabled for current file ?
        // Check in first multi-line comment.
        const firstMComStart = fileText.indexOf('\/*');
        const firstMComEnd = fileText.indexOf('*\/');
        if (firstMComStart === -1 ||
          firstMComEnd === -1 ||
          fileText.slice(firstMComStart + 2, firstMComEnd).indexOf('@flow') === -1) {

          // Check in first single-line comment.
          const firstSComStart = fileText.indexOf('\/\/');
          const firstSComEnd = firstSComStart + fileText.slice(firstSComStart).indexOf('\n');
          if (firstSComStart === -1 ||
            fileText.slice(firstSComStart + 2, firstSComEnd).indexOf('@flow') === -1
            ) {
            // Failed to find @flow in the first single-line or multi-line comment.
            // Don't treat this as a flow file.
            return Promise.resolve([]);
          }
        }

        // Check if .flowconfig file is present
        const flowConfig = helpers.find(filePath, '.flowconfig');
        if (!flowConfig) {
          atom.notifications.addWarning('[Linter-Flow] Missing .flowconfig file.', {
            detail: 'To get started with Flow, run `flow init`.',
            dismissable: true,
          });
          return Promise.resolve([]);
        }

        let args;
        let options;

        // Use `check-contents` for unsaved files. and `status` for saved files.
        if (TextEditor.isModified()) {
          args = ['check-contents', '--json', filePath];
          options = { cwd: path.dirname(filePath), stdin: fileText };
        } else {
          args = ['status', '--json', filePath];
          options = { cwd: path.dirname(filePath) };
        }

        return check(this.pathToFlow, args, options)
          .then(JSON.parse)
          .then(handleData);
      },
    };
  },
};
