'use strict'
var util = require('./util')

class ValueType {
  constructor(storageSlots, storageBytes, typeName) {
    this.storageSlots = storageSlots
    this.storageBytes = storageBytes
    this.typeName = typeName
    this.basicType = 'ValueType'
  }

  /**
    * decode the type with the @arg location from the storage
    *
    * @param {Object} location - containing offset and slot
    * @param {Object} storageResolver  - resolve storage queries
    * @return {Object} - decoded value
    */
  async decodeFromStorage(location, storageResolver) {
    try {
      var value = await util.extractHexValue(location, storageResolver, this.storageBytes)
      return {
        value: this.decodeValue(value),
        type: this.typeName
      }
    } catch (e) {
      console.log(e)
      return {
        value: '<decoding failed - ' + e.message + '>',
        type: this.typeName
      }
    }
  }

  /**
    * decode the type from the stack
    *
    * @param {Int} stackDepth - position of the type in the stack
    * @param {Array} stack - stack
    * @param {String} - memory
    * @return {Object} - decoded value
    */
  async decodeFromStack(stackDepth, stack, memory) {
    var value
    if (stackDepth >= stack.length) {
      value = this.decodeValue('')
    } else {
      value = this.decodeValue(stack[stack.length - 1 - stackDepth].replace('0x', ''))
    }
    return {
      value: value,
      type: this.typeName
    }
  }

  /**
    * decode the type with the @arg offset location from the memory
    *
    * @param {Int} stackDepth - position of the type in the stack
    * @return {String} - memory
    * @return {Object} - decoded value
    */
  decodeFromMemory(offset, memory) {
    var value = memory.substr(2 * offset, 64)
    return {
      value: this.decodeValue(value),
      type: this.typeName
    }
  }
}

module.exports = ValueType
