'use strict'
var async = require('async')
var ethers = require('ethers')
var ethJSUtil = require('ethereumjs-util')
var EventManager = require('../eventManager')
var codeUtil = require('../util')

var executionContext = require('./execution-context')
var txFormat = require('./txFormat')
var txHelper = require('./txHelper')

/**
  * poll web3 each 2s if web3
  * listen on transaction executed event if VM
  * attention: blocks returned by the event `newBlock` have slightly different json properties whether web3 or the VM is used
  * trigger 'newBlock'
  *
  */
class TxListener {
  constructor(opt) {
    this.event = new EventManager()
    this._api = opt.api
    this._resolvedTransactions = {}
    this._resolvedContracts = {}
    this._isListening = false
    this._listenOnNetwork = false
    this._loopId = null
    this.init()
    executionContext.event.register('contextChanged', (context) => {
      if (this._isListening) {
        this.stopListening()
        this.startListening()
      }
    })

    opt.event.udapp.register('callExecuted', (error, from, to, data, lookupOnly, txResult, txId, contractName, methodName, funAbi) => {
      if (error) return
      // we go for that case if
      // in VM mode
      // in web3 mode && listen remix txs only
      if (!this._isListening) return // we don't listen
      if (this._loopId && executionContext.getProvider() !== 'vm') return // we seems to already listen on a "web3" network
      let call
      if (typeof txResult === 'string') {
        call = {
          from: from,
          to: to,
          input: data,
          output: txResult,
          hash: txResult.transactionHash ? txResult.transactionHash : 'call' + (from || '') + to + data,
          isCall: true,
          id: txId,
          // TODO eth
          envMode: executionContext.getProvider(),
          funAbi
        }
      } else {
        call = {
          ...txResult[0],
          isCall: false,
          contractName,
          methodName,
          funAbi
        }
      }


      // addExecutionCosts(txResult, call)
      this._resolveTx(call, call, (error, resolvedData) => {
        if (!error) {
          this.event.trigger('newCall', [call])
        }
      })
    })

    opt.event.udapp.register('transactionExecuted', (error, from, to, data, lookupOnly, txResult) => {
      if (error) return
      if (lookupOnly) return
      // we go for that case if
      // in VM mode
      // in web3 mode && listen remix txs only
      if (!this._isListening) return // we don't listen
      if (this._loopId && executionContext.getProvider() !== 'vm') return // we seems to already listen on a "web3" network

      // executionContext.echojslib().eth.getTransaction(txResult.transactionHash, (error, tx) => {
      //   if (error) return console.log(error)

      //   addExecutionCosts(txResult, tx)
      
      //   tx.envMode = executionContext.getProvider()
      //   tx.status = txResult.result.status // 0x0 or 0x1
      //   this._resolve([tx], () => {
      //   })
      // })

      this._resolve(txResult, () => {})
    })

    function addExecutionCosts(txResult, tx) {
      if (txResult && txResult.result) {
        if (txResult.result.vm) {
          tx.returnValue = txResult.result.vm.return
          if (txResult.result.vm.gasUsed) tx.executionCost = txResult.result.vm.gasUsed.toString(10)
        }
        if (txResult.result.gasUsed) tx.transactionCost = txResult.result.gasUsed.toString(10)
      }
    }
  }

  /**
    * define if txlistener should listen on the network or if only tx created from remix are managed
    *
    * @param {Bool} type - true if listen on the network
    */
  setListenOnNetwork(listenOnNetwork) {
    this._listenOnNetwork = listenOnNetwork
    if (this._loopId) {
      clearInterval(this._loopId)
    }
    if (this._listenOnNetwork) {
      this._startListenOnNetwork()
    }
  }

  /**
    * reset recorded transactions
    */
  init() {
    this.blocks = []
    this.lastBlock = null
  }

  /**
    * start listening for incoming transactions
    *
    * @param {String} type - type/name of the provider to add
    * @param {Object} obj  - provider
    */
  startListening() {
    this.init()
    this._isListening = true
    if (this._listenOnNetwork && executionContext.getProvider() !== 'vm') {
      this._startListenOnNetwork()
    }
  }

   /**
    * stop listening for incoming transactions. do not reset the recorded pool.
    *
    * @param {String} type - type/name of the provider to add
    * @param {Object} obj  - provider
    */
  stopListening() {
    if (this._loopId) {
      clearInterval(this._loopId)
    }
    this._loopId = null
    this._isListening = false
  }

  _startListenOnNetwork() {
    this._loopId = setInterval(() => {
      var currentLoopId = this._loopId
      executionContext.echojslib().eth.getBlockNumber((error, blockNumber) => {
        if (this._loopId === null) return
        if (error) return console.log(error)
        if (currentLoopId === this._loopId && (!this.lastBlock || blockNumber > this.lastBlock)) {
          if (!this.lastBlock) this.lastBlock = blockNumber - 1
          var current = this.lastBlock + 1
          this.lastBlock = blockNumber
          while (blockNumber >= current) {
            try {
              this._manageBlock(current)
            } catch (e) {
              console.log(e)
            }
            current++
          }
        }
      })
    }, 2000)
  }

  _manageBlock(blockNumber) {
    executionContext.echojslib().eth.getBlock(blockNumber, true, (error, result) => {
      if (!error) {
        this._newBlock(Object.assign({type: 'web3'}, result))
      }
    })
  }

  /**
    * try to resolve the contract name from the given @arg address
    *
    * @param {String} address - contract address to resolve
    * @return {String} - contract name
    */
  resolvedContract(address) {
    return this._resolvedContracts[address]
  }

  /**
    * try to resolve the transaction from the given @arg txHash
    *
    * @param {String} txHash - contract address to resolve
    * @return {String} - contract name
    */
  resolvedTransaction(txHash) {
    return this._resolvedTransactions[txHash]
  }

  _newBlock(block) {
    this.blocks.push(block)
    this._resolve(block.transactions, () => {
      this.event.trigger('newBlock', [block])
    })
  }

  _resolve(transactions, callback) {
    async.each(transactions, (tx, cb) => {
      // this._api.resolveReceipt(tx, (error, receipt) => {
      //   console.log('=======')
      //   console.log(error)
      //   console.log('=======')

      //   if (error) return cb(error)

      // })

      this._resolveTx(tx, null, (error, resolvedData) => {
        if (error) cb(error)

        if (resolvedData) {
          this.event.trigger('txResolved', [tx, null, resolvedData])
        }

        this.event.trigger('newTransaction', [tx, null])
        cb()
      })
    }, () => {
      callback()
    })
  }

  async _resolveTx(tx, receipt, cb) {
    var contracts = this._api.contracts()
    if (!contracts) return cb()
    var contractName
    var fun
    if (tx.trx && tx.trx.operations) {
      var code = tx.trx.operations[0][1].code
      contractName = this._tryResolveContract(code, contracts, true)
      if (contractName) {
        const contractResult = tx.contractResult
        const address = contractResult[1].exec_res.new_address
        const status = contractResult[1].exec_res.excepted === 'None' ? 'Success' : 'Fail'
        const gasUsed = contractResult[1].tr_receipt.gas_used
        const logs = contractResult[1].tr_receipt.log.length

        fun = this._resolveFunction(contractName, contracts, tx, true)
        if (this._resolvedTransactions[tx.id]) {
          this._resolvedTransactions[tx.id].contractAddress = address
          this._resolvedTransactions[tx.id].status = status
          this._resolvedTransactions[tx.id].gasUsed = gasUsed
          this._resolvedTransactions[tx.id].logs = logs
          this._resolvedTransactions[tx.id].contractResult = contractResult
        }

        cb(null, {to: null, contractName: contractName, function: fun, creationAddress: address, status, gasUsed, logs })
      } else {
        // executionContext.getEchoApi().getContract(tx.trx.operations[0][1].callee).then(res => {
        //   contractName = this._tryResolveContract(res[1].code, contracts, false)
        //     if (contractName) {
        //       const address = contractResult[1].exec_res.new_address
        //       const status = contractResult[1].exec_res.excepted === "None" ? "Success" : "Fail"
        //       const gasUsed = contractResult[1].tr_receipt.gas_used
        //       const logs = contractResult[1].tr_receipt.log.length
        //       cb(null, { ...tx, contractName, creationAddress: address, status, gasUsed, logs })
        //     } else {
        //       cb()
        //     }
        // })
        fun = this._resolveFunction(tx.contractName, contracts, tx, false)
        const contractResult = tx.contractResult
        const address = tx.trx.operations[0][1].callee
        const status = contractResult[1].exec_res.excepted === 'None' ? 'Success' : 'Fail'
        const gasUsed = contractResult[1].tr_receipt.gas_used
        const logs = contractResult[1].tr_receipt.log.length
        const output = tx.contractResult[1].exec_res.output
        this._resolvedTransactions[tx.id].logs = logs
        this._resolvedTransactions[tx.id].gasUsed = gasUsed
        this._resolvedTransactions[tx.id].status = status
        this._resolvedTransactions[tx.id].contractAddress = address
        this._resolvedTransactions[tx.id].contractResult = contractResult
        this._resolvedTransactions[tx.id].output = tx.contractResult[1].exec_res.output
        this._resolvedTransactions[tx.id].decodedOutput = txFormat.decodeResponse(output, tx.funAbi)
        return cb(null, {...tx, creationAddress: address, status, gasUsed, logs })
      }
    } else {
      tx.decodedOutput = txFormat.decodeResponse(tx.output, tx.funAbi)
      tx.params = this._decodeInputParams(tx.input.substring(8), tx.funAbi)
      cb(null, tx)
    }

        // if (!tx.to || tx.to === '0x0') { // testrpc returns 0x0 in that case
    //   // contract creation / resolve using the creation bytes code
    //   // if web3: we have to call getTransactionReceipt to get the created address
    //   // if VM: created address already included
    //   var code = tx.input
    //   contractName = this._tryResolveContract(code, contracts, true)
    //   if (contractName) {
    //     var address = receipt.contractAddress
    //     this._resolvedContracts[address] = contractName
    //     fun = this._resolveFunction(contractName, contracts, tx, true)
    //     if (this._resolvedTransactions[tx.hash]) {
    //       this._resolvedTransactions[tx.hash].contractAddress = address
    //     }
    //     return cb(null, {to: null, contractName: contractName, function: fun, creationAddress: address})
    //   }
    //   return cb()
    // } else {
    //   // first check known contract, resolve against the `runtimeBytecode` if not known
    //   contractName = this._resolvedContracts[tx.to]
    //   if (!contractName) {
    //     executionContext.echojslib().eth.getCode(tx.to, (error, code) => {
    //       if (error) return cb(error)
    //       if (code) {
    //         var contractName = this._tryResolveContract(code, contracts, false)
    //         if (contractName) {
    //           this._resolvedContracts[tx.to] = contractName
    //           var fun = this._resolveFunction(contractName, contracts, tx, false)
    //           return cb(null, {to: tx.to, contractName: contractName, function: fun})
    //         }
    //       }
    //       return cb()
    //     })
    //     return
    //   }
    //   if (contractName) {
    //     fun = this._resolveFunction(contractName, contracts, tx, false)
    //     return cb(null, {to: tx.to, contractName: contractName, function: fun})
    //   }
    //   return cb()
    // }
  }

  _resolveFunction(contractName, compiledContracts, tx, isCtor) {
    var contract = txHelper.getContract(contractName, compiledContracts)
    if (!contract) {
      return
    }
    var abi = contract.object.abi
    var inputData = tx.trx.operations[0][1].code
    if (!isCtor) {
      var methodIdentifiers = contract.object.evm.methodIdentifiers
      for (var fn in methodIdentifiers) {
        if (methodIdentifiers[fn] === inputData.substring(0, 8)) {
          var fnabi = txHelper.getFunction(abi, fn)
          this._resolvedTransactions[tx.id] = {
            contractName: contractName,
            fn: fn,
            params: this._decodeInputParams(inputData.substring(8), fnabi)
          }
          // if (tx.returnValue) {
          //   this._resolvedTransactions[tx.hash].decodedReturnValue = txFormat.decodeResponse(tx.returnValue, fnabi)
          // }
          return this._resolvedTransactions[tx.id]
        }
      }
      // fallback function
      this._resolvedTransactions[tx.hash] = {
        contractName: contractName,
        to: tx.to,
        fn: '(fallback)',
        params: null
      }
    } else {
      var bytecode = contract.object.evm.bytecode.object
      var params = null
      if (bytecode && bytecode.length) {
        params = this._decodeInputParams(inputData.substring(bytecode.length), txHelper.getConstructorInterface(abi))
      }

      this._resolvedTransactions[tx.id] = {
        contractName: contractName,
        to: null,
        fn: '(constructor)',
        params: params
      }
    }

    return this._resolvedTransactions[tx.id]
  }

  _tryResolveContract(codeToResolve, compiledContracts, isCreation) {
    var found = null
    txHelper.visitContracts(compiledContracts, (contract) => {
      var bytes = isCreation ? contract.object.evm.bytecode.object : contract.object.evm.deployedBytecode.object
      if (codeUtil.compareByteCode(codeToResolve, bytes)) {
        found = contract.name
        return true
      }
    })
    return found
  }

  _decodeInputParams(data, abi) {
    data = ethJSUtil.toBuffer('0x' + data)
    if (!data.length) data = new Uint8Array(32 * abi.inputs.length) // ensuring the data is at least filled by 0 cause `AbiCoder` throws if there's not engouh data

    var inputTypes = []
    for (var i = 0; i < abi.inputs.length; i++) {
      var type = abi.inputs[i].type
      inputTypes.push(type.indexOf('tuple') === 0 ? txHelper.makeFullTypeDefinition(abi.inputs[i]) : type)
    }
    var abiCoder = new ethers.utils.AbiCoder()
    var decoded = abiCoder.decode(inputTypes, data)
    var ret = {}
    for (var k in abi.inputs) {
      ret[abi.inputs[k].type + ' ' + abi.inputs[k].name] = decoded[k]
    }
    return ret
  }
}

module.exports = TxListener
