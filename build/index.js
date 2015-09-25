/* global atom */
// import fs from 'fs'
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

// import {sync} from 'resolve'

var _child_process = require('child_process');

// import {CompositeDisposable} from 'atom'
// import {allowUnsafeNewFunction} from 'loophole'

var linterPackage = atom.packages.getLoadedPackage('linter');
if (!linterPackage) {
  atom.notifications.addError('Linter should be installed first, `apm install linter`', { dismissable: true }); // eslint-disable-line
}

// const linterPath = linterPackage.path
// const findFile = require(`${linterPath}/lib/util`)

var cmdString = 'flow';

function extractRange(message) {
  return [[message.line - 1, message.start - 1], [message.endline - 1, message.end]];
}

function flowMessageToTrace(message) {
  return { type: 'Trace',
    text: message.descr,
    filePath: message.path,
    range: extractRange(message)
  };
}

function flowMessageToLinterMessage(arr) {
  // h/t Nuclide-flow
  // It's unclear why the 1-based to 0-based indexing works the way that it
  // does, but this has the desired effect in the UI, in practice.
  var message = Array.isArray(arr) ? arr[0] : arr;

  var obj = { type: message.level,
    text: Array.isArray(arr) ? arr.map(function (o) {
      return o.descr;
    }).join(' ') : message.descr,
    filePath: message.path,
    range: extractRange(message)
  };

  if (Array.isArray(arr) && arr.length > 1) {
    obj.trace = arr.slice(1).map(flowMessageToTrace);
  }

  return obj;
}

module.exports = { config: { pathToFlowExecutable: { type: 'string',
      'default': 'flow'
    },
    testRuleTwo: { type: 'boolean',
      'default': false
    }
  },
  activate: function activate() {
    console.log('activating linter-flow');

    // getting custom value
    cmdString = atom.config.get('linter-flow.pathToFlowExecutable') || 'flow';
  },
  deactivate: function deactivate() {
    console.log('deactivating linter-flow');
  },
  provideLinter: function provideLinter() {
    var provider = { grammarScopes: ['source.js', 'source.js.jsx', 'source.babel', 'source.js-semantic', 'source.es6'],
      scope: 'file',
      lintOnFly: true,
      lint: function lint(TextEditor) {
        var filePath = TextEditor.getPath();
        var fileText = TextEditor.buffer && TextEditor.buffer.cachedText;

        if (fileText.indexOf('@flow') === -1) {
          return [];
        }

        return new Promise(function (resolve, reject) {
          var command = (0, _child_process.spawn)(cmdString, ['check-contents', filePath, '--json', '--timeout', '1'], { cwd: _path2['default'].dirname(filePath) });
          var data = '',
              errors = '';
          command.stdout.on('data', function (d) {
            data += d;
          });
          command.stderr.on('data', function (d) {
            errors += d;
          });
          command.on('close', function (err) {
            if (err) {
              reject(errors);
            } else if (!data || errors) {
              resolve([]);
            } else {
              data = JSON.parse(data.substr(data.indexOf('{')));
              if (!data.errors || data.passed) {
                resolve([]);
              } else {
                var errs = data.errors.map(function (obj) {
                  return obj.message;
                }).map(flowMessageToLinterMessage);
                console.log(errs);
                resolve(errs);
              }
            }
          });

          command.stdin.write(fileText);
          command.stdin.end();
        })['catch'](function (err) {
          console.error(err);
          return [{ type: 'warning',
            html: 'linter-flow : Error Linting, check the console for details',
            filePath: filePath,
            range: [[0, 0], [0, 1]]
          }];
        });
      }
    };

    return provider;
  }
};