'use babel';

import * as path from 'path';
// eslint-disable-next-line no-unused-vars
import { it, fit, wait, beforeEach, afterEach } from 'jasmine-fix';

const { lint } = require('../lib/index.js').provideLinter();

const constructorPath = path.join(__dirname, 'test', 'constructor', 'constructor.js');
const arrayPath = path.join(__dirname, 'test', 'arrays', 'Arrays.js');

describe('Flow provider for Linter', () => {
  beforeEach(async () => {
    waitsForPromise(() =>
      atom.packages.activatePackage('linter-flow'));
    /**
     *  Note: Windows seems unable to use a globally installed version, if
     *  testing locally, fix the path below and uncomment the line to get the
     *  specs to work for you. Make sure you restore any changes before
     *  committing.
     */
    // atom.config.set('linter-flow.executablePath', 'C:\\path\\to\\flow.cmd');
  });

  it('constructor: incompatible type', async () => {
    const editor = await atom.workspace.open(constructorPath);
    const messages = await lint(editor);
    const msgText = 'number This type is incompatible with an implicitly-returned undefined.';

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe('Error');
    expect(messages[0].text).toBe(msgText);
    expect(messages[0].filePath).toBe(constructorPath);
    expect(messages[0].trace.length).toBe(0);
    expect(messages[0].range).toEqual([[6, 18], [6, 24]]);
  });

  it('arrays: incompatible type', async () => {
    const editor = await atom.workspace.open(arrayPath);
    const messages = await lint(editor);
    const msgText = 'number This type is incompatible with the expected param type of string';

    expect(messages.length).toBe(2);

    expect(messages[0].type).toBe('Error');
    expect(messages[0].text).toBe(msgText);
    expect(messages[0].filePath).toBe(arrayPath);
    expect(messages[0].trace.length).toBe(1);
    expect(messages[0].trace[0].range).toEqual([[3, 16], [3, 22]]);
    expect(messages[0].range).toEqual([[9, 4], [9, 8]]);

    expect(messages[1].type).toBe('Error');
    expect(messages[1].text).toBe(msgText);
    expect(messages[1].filePath).toBe(arrayPath);
    expect(messages[1].trace.length).toBe(1);
    expect(messages[1].trace[0].range).toEqual([[9, 4], [9, 8]]);
    expect(messages[1].range).toEqual([[3, 16], [3, 22]]);
  });
});
