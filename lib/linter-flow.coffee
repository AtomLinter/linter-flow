linterPath = atom.packages.getLoadedPackage('linter').path
Linter = require "#{linterPath}/lib/linter"
findFile = require "#{linterPath}/lib/util"

path = require "path"
fs = require 'fs'
{spawn} = require 'child_process'

_ = require 'underscore-plus'

class LinterFlow extends Linter
  # The syntax that the linter handles. May be a string or
  # list/tuple of strings. Names should be all lowercase.
  @syntax: ['source.js']

  linterName: 'flow'

  lintFile: (filePath, callback) ->
    filename = path.basename filePath
    origPath = path.join @cwd, filename
    options = {}

    unless @flowEnabled
      callback([])
      return

    str = ''
    file = (atom.workspace.getActiveEditor()).getPath()
    file_path = path.dirname(file)
    child = spawn @flowPath, ['status', '--json', file_path]
    child.stdout.on 'data', (x) -> str += x
    child.stderr.on 'data', (x) -> str += x

    child.stdout.on 'close', (code) =>
      console.log str
      info = JSON.parse(str)
      if info.passed
        callback([])
        return

      realMessages = []
      _.each info.errors, (msg) ->

        # NB: messages are often of the form "X is bad", "because", "some other type"
        # Therefore, we want to categorize the first message as the actual error, and
        # subsequent errors as warnings (so people can find the related type quickly),
        # but also have a good error message in the real message
        first = true
        _.each msg.message, (item) ->
          if first
            toPush = _.extend item,
              error: true
              warning: false
              descr: _.map(msg.message, (x) -> x.descr.replace("\n", " ")).join(' ')

            last = _.last(msg.message)
            unless msg.message.length < 2
              toPush.descr += "(#{last.path.replace(atom.project.path, '.')}:#{last.line})"

            console.log "Message: #{toPush.message}"
            realMessages.push(toPush)
            first = false
            return

          realMessages.push(_.extend(item, error: false, warning: true))
          first = false

      # NB: Sometimes, the type definition for the 'some other type' can be in
      # a separate file
      realMessages = _.filter realMessages, (x) ->
        return true if x.path is null
        return (path.basename(x.path) is path.basename(filePath))

      ## NB: This parsing code pretty much sucks, but at least does what
      ## we want it to for now
      messages = _.map realMessages, (x) ->
        _.extend {},
          message: x.descr.replace("\n", " ")
          line: x.line
          lineStart: x.line
          lineEnd: x.endline
          colStart: x.start
          colEnd: x.end
          warning: x.warning
          error: x.error

      console.log(messages)

      callback(_.map(messages, (x) => @createMessage(x)))
      return

  findFlowInPath: ->
    pathItems = process.env.PATH.split /[;:]/

    _.find pathItems, (x) ->
      return false unless x and x.length > 1
      fs.existsSync(path.join(x, 'flow'))

  constructor: (editor) ->
    super(editor)

    @flowPath = @findFlowInPath()

    @flowEnabled = true
    @flowEnabled &= atom.project.path and fs.existsSync(atom.project.path)
    @flowEnabled &= fs.existsSync(path.join(atom.project.path, '.flowconfig'))
    @flowEnabled &= @flowPath?

    unless @flowEnabled
      console.log 'Flow is disabled, exiting!'
      return

    @flowPath = path.join(@flowPath, 'flow')

    flowServer = spawn(@flowPath, ['start', '--all', '--module', 'node', path.resolve(atom.project.path)])
    flowServer.on 'close', (code) => @flowEnabled &= (code is 0)

  destroy: ->
    spawn(@flowPath, ['--stop', path.resolve(atom.project.path)])
    console.log "die"

module.exports = LinterFlow
