LinterFlowView = require './linter-flow-view'

module.exports =
  linterFlowView: null

  activate: (state) ->
    @linterFlowView = new LinterFlowView(state.linterFlowViewState)

  deactivate: ->
    @linterFlowView.destroy()

  serialize: ->
    linterFlowViewState: @linterFlowView.serialize()
