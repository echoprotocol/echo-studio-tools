'use strict'
var DynamicBytes = require('./DynamicByteArray')

class StringType extends DynamicBytes {
  constructor(location) {
    super(location)
    this.typeName = 'string'
  }

  async decodeFromStorage(location, storageResolver) {
    var decoded = '0x'
    try {
      decoded = await super.decodeFromStorage(location, storageResolver)
    } catch (e) {
      console.log(e)
      return '<decoding failed - ' + e.message + '>'
    }
    return format(decoded)
  }

  async decodeFromStack(stackDepth, stack, memory) {
    try {
      return await super.decodeFromStack(stackDepth, stack, memory)
    } catch (e) {
      console.log(e)
      return '<decoding failed - ' + e.message + '>'
    }
  }

  decodeFromMemoryInternal(offset, memory) {
    var decoded = super.decodeFromMemoryInternal(offset, memory)
    return format(decoded)
  }
}

function format(decoded) {
  if (decoded.error) {
    return decoded
  }
  var value = decoded.value
  value = value.replace('0x', '').replace(/(..)/g, '%$1')
  var ret = {
    length: decoded.length,
    raw: decoded.value,
    type: 'string'
  }
  try {
    ret.value = decodeURIComponent(value)
  } catch (e) {
    ret.error = 'Invalid UTF8 encoding'
    ret.raw = decoded.value
  }
  return ret
}

module.exports = StringType
