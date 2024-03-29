'use strict'

var solc = require('solc/wrapper')

var compileJSON = function() { return '' }
var missingInputs = []

module.exports = function(self) {
  self.addEventListener('message', function(e) {
    var data = e.data
    switch (data.cmd) {
      case 'loadVersion':
        delete self.Module
        // NOTE: workaround some browsers?
        self.Module = undefined

        compileJSON = null

        self.importScripts(data.data)

        var compiler = solc(self.Module)

        compileJSON = function(input) {
          try {
            return compiler.compile(input, function(path) {
              missingInputs.push(path)
              return { 'error': 'Deferred import' }
            })
          } catch (exception) {
            return JSON.stringify({ error: 'Uncaught JavaScript exception:\n' + exception })
          }
        }

        self.postMessage({
          cmd: 'versionLoaded',
          data: compiler.version()
        })
        break
      case 'compile':
        missingInputs.length = 0
        self.postMessage({cmd: 'compiled', job: data.job, data: compileJSON(data.input), missingInputs: missingInputs})
        break
    }
  }, false)
}
