'use strict'
var __importStar = (this && this.__importStar) || function(mod) {
    if (mod && mod.__esModule) return mod
    var result = {}
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k]
    result['default'] = mod
    return result
}
Object.defineProperty(exports, '__esModule', { value: true })
var contract_1 = require('./contract')
exports.Contract = contract_1.Contract
exports.ContractFactory = contract_1.ContractFactory
exports.VoidSigner = contract_1.VoidSigner
var abstract_signer_1 = require('./abstract-signer')
exports.Signer = abstract_signer_1.Signer
var wallet_1 = require('./wallet')
exports.Wallet = wallet_1.Wallet
var constants = __importStar(require('./constants'))
exports.constants = constants
var errors = __importStar(require('./errors'))
exports.errors = errors
var providers = __importStar(require('./providers'))
exports.providers = providers
var utils = __importStar(require('./utils'))
exports.utils = utils
var wordlists = __importStar(require('./wordlists'))
exports.wordlists = wordlists
// //////////////////////
// Compile-Time Constants
// This is empty in node, and used by browserify to inject extra goodies
var shims_1 = require('./utils/shims')
exports.platform = shims_1.platform
// This is generated by "npm run dist"
var _version_1 = require('./_version')
exports.version = _version_1.version
// //////////////////////
// Helper Functions
function getDefaultProvider(network) {
    if (network == null) {
        network = 'homestead'
    }
    var n = utils.getNetwork(network)
    if (!n || !n._defaultProvider) {
        errors.throwError('unsupported getDefaultProvider network', errors.UNSUPPORTED_OPERATION, {
            operation: 'getDefaultProvider',
            network: network
        })
    }
    return n._defaultProvider(providers)
}
exports.getDefaultProvider = getDefaultProvider
