'use strict'

var traceHelper = require('../helpers/traceHelper')
var util = require('../util')

function TraceStepManager(_traceAnalyser) {
  this.traceAnalyser = _traceAnalyser
}

TraceStepManager.prototype.isCallInstruction = function(index) {
  var state = this.traceAnalyser.trace[index]
  return traceHelper.isCallInstruction(state) && !traceHelper.isCallToPrecompiledContract(index, this.traceAnalyser.trace)
}

TraceStepManager.prototype.isReturnInstruction = function(index) {
  var state = this.traceAnalyser.trace[index]
  return traceHelper.isReturnInstruction(state)
}

TraceStepManager.prototype.findStepOverBack = function(currentStep) {
  if (this.isReturnInstruction(currentStep)) {
    var call = util.findCall(currentStep, this.traceAnalyser.traceCache.callsTree.call)
    return call.start > 0 ? call.start - 1 : 0
  } else {
    return currentStep > 0 ? currentStep - 1 : 0
  }
}

TraceStepManager.prototype.findStepOverForward = function(currentStep) {
  if (this.isCallInstruction(currentStep)) {
    var call = util.findCall(currentStep + 1, this.traceAnalyser.traceCache.callsTree.call)
    return call.return + 1 < this.traceAnalyser.trace.length ? call.return + 1 : this.traceAnalyser.trace.length - 1
  } else {
    return this.traceAnalyser.trace.length >= currentStep + 1 ? currentStep + 1 : currentStep
  }
}

TraceStepManager.prototype.findNextCall = function(currentStep) {
  var call = util.findCall(currentStep, this.traceAnalyser.traceCache.callsTree.call)
  var subCalls = Object.keys(call.calls)
  if (subCalls.length) {
    var callStart = util.findLowerBound(currentStep, subCalls) + 1
    if (subCalls.length > callStart) {
      return subCalls[callStart] - 1
    } else {
      return currentStep
    }
  } else {
    return currentStep
  }
}

TraceStepManager.prototype.findStepOut = function(currentStep) {
  var call = util.findCall(currentStep, this.traceAnalyser.traceCache.callsTree.call)
  return call.return
}

module.exports = TraceStepManager
