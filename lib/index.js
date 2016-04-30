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

type BusySignal = {
  add(title: string, priority?:number):void;
  remove(title:string):void;
  clear():void;
  dispose():void;
};

type BusySignalRegistry = {
  create(): BusySignal;
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

    this.lastConfigError = {};
    this.statusProvider = null;
    this.isIdle = true;

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-flow.executablePath', (pathToFlow) => {
      this.pathToFlow = pathToFlow;
    }));
  },

  deactivate(): void {
    const helpers = require('atom-linter');
    if (atom.inDevMode()) {
      console.log('deactivating... linter-flow');
    }
    helpers.exec(this.pathToFlow, ['stop'], {}).catch(() => null);
    this.setIdle();
    this.signalProvider = null;
    this.subscriptions.dispose();
  },

  consumeBusySignal(registry:BusySignalRegistry):void {
    const provider = registry.create();
    this.subscriptions.add(provider);
    this.statusProvider = provider;
  },

  setBusy(message:string) {
    if (this.statusProvider && this.isIdle) {
      this.isIdle = false;
      this.statusProvider.add(message);
    }
  },

  setIdle() {
    if (this.statusProvider) {
      this.isIdle = true;
      this.statusProvider.clear();
    }
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
        if (!fileText || fileText.indexOf('@flow') === -1) {
          return Promise.resolve([]);
        }

        // Check if .flowconfig file is present
        const flowConfig = helpers.find(filePath, '.flowconfig');
        if (!flowConfig) {
          if (!this.lastConfigError[filePath] ||
              this.lastConfigError[filePath] + 5 * 60 * 1000 < Date.now()) {
            atom.notifications.addWarning('[Linter-Flow] Missing .flowconfig file.', {
              detail: 'To get started with Flow, run `flow init`.',
              dismissable: true,
            });
            this.lastConfigError[filePath] = Date.now();
          }
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

        this.setBusy('Flow is type checking');

        return check(this.pathToFlow, args, options)
          .then(JSON.parse)
          .then(handleData)
          .then(data => (this.setIdle(), data));
      },
    };
  },
};
