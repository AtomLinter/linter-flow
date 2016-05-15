'use babel';

import * as path from 'path';
const constructorPath = path.join(__dirname, 'test', 'constructor', 'constructor.js');
const arrayPath = path.join(__dirname, 'test', 'arrays', 'Arrays.js');

describe('Flow provider for Linter', () => {
  const lint = require('../lib/index.js').provideLinter().lint;

  beforeEach(() => {
    waitsForPromise(() =>
      atom.packages.activatePackage('linter-flow')
    );
  });

  it('constructor: incompatible type', () => {
    waitsForPromise(() =>
      atom.workspace.open(constructorPath).then(editor =>
        lint(editor).then(messages => {
          expect(messages.length).toEqual(1);
          expect(messages[0].type).toEqual('Warning');
          expect(messages[0].text)
            .toEqual('number This type is incompatible with an implicitly-returned undefined.');
          expect(messages[0].filePath).toMatch(/.+constructor\.js$/);
          expect(messages[0].trace.length).toEqual(1);
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
          expect(messages.length).toEqual(1);
          expect(messages[0].type).toEqual('Warning');
          expect(messages[0].text).toEqual('number This type is incompatible with string');
          expect(messages[0].filePath).toMatch(/.+Arrays\.js$/);
          expect(messages[0].trace.length).toEqual(2);
          expect(messages[0].range).toEqual({
            start: { row: 9, column: 4 },
            end: { row: 9, column: 8 },
          });
        })
      )
    );
  });
});
