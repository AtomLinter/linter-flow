'use babel';

import * as path from 'path';
const constructorPath = path.join(__dirname, 'test', 'constructor', 'constructor.js');
const arrayPath = path.join(__dirname, 'test', 'arrays', 'Arrays.js');
const lint = require('../lib/index.js').provideLinter().lint;

describe('Flow provider for Linter', () => {
  beforeEach(() => {
    waitsForPromise(() =>
      atom.packages.activatePackage('linter-flow')
    );
  });

  it('constructor: incompatible type', () => {
    waitsForPromise(() =>
      atom.workspace.open(constructorPath).then(editor =>
        lint(editor).then(messages => {
          expect(messages.length).toBe(1);
          expect(messages[0].type).toBe('Warning');
          expect(messages[0].text)
            .toBe('number This type is incompatible with an implicitly-returned undefined.');
          expect(messages[0].filePath).toMatch(/.+constructor\.js$/);
          expect(messages[0].trace.length).toBe(0);
          expect(messages[0].range).toEqual({
            start: { row: 6, column: 18 },
            end: { row: 6, column: 24 },
          });
        })
      )
    );
  });

  it('arrays: incompatible type', () => {
    waitsForPromise(() =>
      atom.workspace.open(arrayPath).then(editor =>
        lint(editor).then(messages => {
          expect(messages.length).toBe(2);

          expect(messages[0].type).toBe('Warning');
          expect(messages[0].text).toBe('number This type is incompatible with string');
          expect(messages[0].filePath).toMatch(/.+Arrays\.js$/);
          expect(messages[0].trace.length).toBe(1);
          expect(messages[0].trace[0].range).toEqual({
            start: { row: 3, column: 16 },
            end: { row: 3, column: 22 },
          });
          expect(messages[0].range).toEqual({
            start: { row: 9, column: 4 },
            end: { row: 9, column: 8 },
          });

          expect(messages[1].type).toBe('Warning');
          expect(messages[0].text).toBe('number This type is incompatible with string');
          expect(messages[0].filePath).toMatch(/.+Arrays\.js$/);
          expect(messages[0].trace.length).toBe(1);
          expect(messages[1].trace[0].range).toEqual({
            start: { row: 9, column: 4 },
            end: { row: 9, column: 8 },
          });
          expect(messages[1].range).toEqual({
            start: { row: 3, column: 16 },
            end: { row: 3, column: 22 },
          });
        })
      )
    );
  });
});
