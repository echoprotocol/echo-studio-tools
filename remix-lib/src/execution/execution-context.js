/* global ethereum */
'use strict'
const EchoJsLib = require('echojs-lib')

const EventManager = require('../eventManager')
const constants = require('../constants')

function isEchojsLibInjected() {
  return typeof window !== 'undefined' && typeof window.echojslib !== 'undefined'
}

function isBridgeInjected() {
  return isEchojsLibInjected() && window.echojslib.isEchoBridge
}

const echojslib = window.echojslib || EchoJsLib

/*
  trigger contextChanged, web3EndpointChanged
*/
function ExecutionContext() {
  // TODO remove after bug with twice call of `subscribeSwitchNetwork`
  this.bridgeConnectionUrlAndName = null
  this.isFirstConnection = true
  this.subscribedAccountId = null

  let self = this
  this.event = new EventManager()

  this.executionContext = constants.EXECUTION_CONTEXTS.INJECTED

  this.customNetWorks = {}
  this.echoconnection = null

  this.init = function() {
    if (isBridgeInjected()) {
      this._askPermission().then((res) => {
        echojslib.extension.subscribeSwitchNetwork(async (data) => {
        if (this.executionContext !== constants.EXECUTION_CONTEXTS.INJECTED) {
          return
        }
        /* TODO remove after bug with twice call of `subscribeSwitchNetwork` */
        const {url, name} = data || {}
        const tempBridgeConnectionUrlAndName = (url && name) ? `${url}${name}` : null
        if (self.isFirstConnection || (self.bridgeConnectionUrlAndName && tempBridgeConnectionUrlAndName !== self.bridgeConnectionUrlAndName && !self.isFirstConnection)) {
          self.bridgeConnectionUrlAndName = tempBridgeConnectionUrlAndName
          self.isFirstConnection = false
          try {
            process.nextTick(() => {
              self.initBridgeConnection()
            })
          } catch (e) {
            console.log(e)
          }
        }
        /* to */
        // await self.initBridgeConnection()
        })

        echojslib.extension.subscribeSwitchAccount(async (data) => {
          self.event.trigger('switchAccount', [data])
        })
       })
    } else {
      // TODO
    }
  }

  this.initBridgeConnection = async function() {
    if (echojslib.echo.isConnected) {
      await echojslib.echo.disconnect()
    }

    await echojslib.echo.connect()

    await Promise.all([echojslib.extension.getCurrentNetwork(), echojslib.echo.api.getChainId()])
    .then(([network, id]) => {
      const {name} = network
      self.event.trigger('connectToNetwork', [name, id])
    })
    .catch((err) => {
      console.log(err)
      self.event.trigger('connectToNetwork', ['Unknown'])
    })
  }

  this.initExternalConnection = async function(endpoint, cb) {
    this.echoconnection = new echojslib.Echo()
    await this.echoconnection.connect(endpoint)

    return this.echoconnection.api.getChainId()
    .then((id) => {
      self.event.trigger('connectToNetwork', ['Custom', id])
      return cb()
    })
    .catch((err) => {
      console.log(err)
      self.event.trigger('connectToNetwork', ['Unknown', null])
      return cb()
    })
  }

  this.notifyAboutAccoutUpdating = function(result) {
    self.event.trigger('updateAccount', [result])
  }

  this.subscribeToAccountUpdating = async function(accountId) {
    this.unsubscribeToAccountUpdating()

    return await this.getEchoSubscriber().setAccountSubscribe(this.notifyAboutAccoutUpdating, [accountId])
  }

  this.unsubscribeToAccountUpdating = function() {
    if (this.subscribedAccountId) {
      this.getEchoSubscriber().removeAccountSubscribe(this.notifyAboutAccoutUpdating)
    }
  }

  this._askPermission = function() {
    if (isBridgeInjected()) {
      return echojslib.extension.getAccess()
    }
  }

  this.getProvider = function() {
    return this.executionContext
  }

  this.echojslib = function() {
    return echojslib
  }

  this.echoConnection = function() {
    return this.echoconnection
  }

  this.getEchoApi = function() {
    switch (this.executionContext) {
      case constants.EXECUTION_CONTEXTS.INJECTED:
        return this.echojslib().echo.api
      case constants.EXECUTION_CONTEXTS.EXTERNAL:
        return this.echoConnection().api
    }
  }

  this.getEchoSubscriber = function() {
    switch (this.executionContext) {
      case constants.EXECUTION_CONTEXTS.INJECTED:
        return this.echojslib().echo.subscriber
      case constants.EXECUTION_CONTEXTS.EXTERNAL:
        return this.echoConnection().subscriber
    }
  }

  this.detectNetwork = function(callback) {
    const networkNamePromise = this.executionContext === constants.EXECUTION_CONTEXTS.INJECTED ?
      echojslib.extension.getCurrentNetwork() : Promise.resolve({name: 'Custom'})
    const networkIdPromise = this.executionContext === constants.EXECUTION_CONTEXTS.INJECTED ?
      echojslib.echo.api.getChainId() : this.echoConnection().api.getChainId()
    Promise.all([networkIdPromise, networkNamePromise])
    .then(([id, network]) => {
      const {name} = network
      callback(null, {id, name})
    })
    .catch((err) => {
      callback(err, {name: 'Unknown'})
    })
  }

  this.removeProvider = function(name) {
    if (name && this.customNetWorks[name]) {
      delete this.customNetWorks[name]
      self.event.trigger('removeProvider', [name])
    }
  }

  this.addProvider = function(network) {
    if (network && network.name && network.url) {
      this.customNetWorks[network.name] = network
      self.event.trigger('addProvider', [network])
    }
  }

  this.isExternalEchoConnected = function() {
    return this.echoconnection && this.echoconnection.isConnected
  }

  this.setContext = function(context, endPointUrl, confirmCb, infoCb) {
    this.executionContext = context
    this.executionContextChange(context, endPointUrl, confirmCb, infoCb)
  }

  this.executionContextChange = function(context, endPointUrl, confirmCb, infoCb, cb) {
    if (!cb) cb = () => {}

    this.unsubscribeToAccountUpdating()

    if (context === constants.EXECUTION_CONTEXTS.INJECTED) {
      if (this.isExternalEchoConnected()) {
        this.echoconnection.disconnect()
      }

      if (isBridgeInjected()) {
        this.executionContext = context
        this.initBridgeConnection()
        this.event.trigger('contextChanged', [constants.EXECUTION_CONTEXTS.INJECTED])
        return cb()
      } else {
        let alertMsg = 'No injected echojs-lib provider found. '
        alertMsg += 'Make sure your provider (e.g. Bridge) is active and running '
        alertMsg += '(when recently activated you may have to reload the page).'
        infoCb(alertMsg)
        return cb()
      }
    }

    if (context === constants.EXECUTION_CONTEXTS.EXTERNAL) {
      confirmCb(cb)
    }

    if (this.customNetWorks[context]) {
      const provider = this.customNetWorks[context]
      this.setProviderFromEndpoint(provider.url, provider.name, () => { cb() })
    }
  }

  // TODO: not used here anymore and needs to be moved
  this.setProviderFromEndpoint = async function(endpoint, context, infoCb, cb) {
    if (!this.echoconnection || !this.echoconnection.isConnected) {
      this.executionContext = context
      await this.initExternalConnection(endpoint, cb)
    } else {
      let alertMsg = 'Not possible to connect to the Echo provider. '
      alertMsg += 'Make sure echojslib is injected to your project'
      infoCb(alertMsg)
    }
  }
}

module.exports = new ExecutionContext()
