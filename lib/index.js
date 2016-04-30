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
    statusIndicator: {
      type: 'boolean',
      default: true,
      description: 'If enabled status indicator will be displayed indicating flow status.'
    }
  },

  activate(): void {
    require('atom-package-deps').install('linter-flow');

    this.lastConfigError = {};
    this.statusProvider = null;
    this.signalRegistry = null;
    this.isIdle = true;
    this.displayStatusIndicator = true;

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-flow.statusIndicator', (value) => {
      this.toggleStatusIndicator(value);
    }));
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
    this.signalRegistry = null;
    this.statusProvider = null;
    this.subscriptions.dispose();
  },

  consumeBusySignal(registry:BusySignalRegistry):void {
    this.signalRegistry = registry;
    this.toggleStatusIndicator(this.displayStatusIndicator);
  },


  toggleStatusIndicator(value:boolean) {
    this.displayStatusIndicator = value;
    if (value) {
      if (this.signalRegistry && !this.statusProvider) {
        const provider = this.signalRegistry.create();
        this.subscriptions.add(provider);
        this.statusProvider = provider;
      }
    }
    else {
      if (this.statusProvider) {
        this.statusProvider.dispose();
        this.statusProvider = null;
      }
    }
  },

  setBusy(message:string) {
    if (this.isIdle) {
      this.isIdle = false;
      if (this.statusProvider) {
        this.statusProvider.add(message);
      }
    }
  },

  setIdle() {
    this.isIdle = true
    if (this.statusProvider) {
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
