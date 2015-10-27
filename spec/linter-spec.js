'use babel';

describe('Flow provider for Linter', () => {
  const lint = require('../index.js').provideLinter().lint;

  beforeEach(() => {
    waitsForPromise(() => {
      return atom.packages.activatePackage('linter-flow').then(() => {
        atom.config.set('linter-flow.enableAll', true);
      });
    });
  });

  it('constructor: incompatible type', () => {
    waitsForPromise(() => {
      return atom.workspace.open(__dirname + '/test/constructor/constructor.js').then(editor => {
        return lint(editor).then(messages => {
          expect(messages.length).toEqual(1);
          expect(messages[0].type).toEqual('Error');
          expect(messages[0].text).toEqual('return undefined This type is incompatible with number');
          expect(messages[0].filePath).toMatch(/.+constructor\.js$/);
          expect(messages[0].trace.length).toEqual(2);
          expect(messages[0].range).toEqual({
            start: { row: 6, column: 18 },
            end: { row: 6, column: 24 },
          });
        });
      });
    });
  });

  it('arrays: incompatible type', () => {
    waitsForPromise(() => {
      return atom.workspace.open(__dirname + '/test/arrays/Arrays.js').then(editor => {
        return lint(editor).then(messages => {
          expect(messages.length).toEqual(1);
          expect(messages[0].type).toEqual('Error');
          expect(messages[0].text).toEqual('function call Error: number This type is incompatible with string');
          expect(messages[0].filePath).toMatch(/.+Arrays\.js$/);
          expect(messages[0].trace.length).toEqual(4);
          expect(messages[0].range).toEqual({
            start: { row: 9, column: 0 },
            end: { row: 9, column: 9 },
          });
        });
      });
    });
  });
});
