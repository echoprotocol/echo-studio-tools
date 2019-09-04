'use strict';

// We use this for base 36 maths
import BN from 'bn.js';

import { stripZeros, hexlify } from './bytes';
import { BigNumber } from './bignumber';
import { keccak256 } from './keccak256';
import { encode } from './rlp';

import errors = require('../errors');

///////////////////////////////
// Imported Types

import { Arrayish } from './bytes';

///////////////////////////////


// function getChecksumAddress(address: string): string {
//     if (typeof(address) !== 'string' || !address.match(/^0x[0-9A-Fa-f]{40}$/)) {
//         errors.throwError('invalid address', errors.INVALID_ARGUMENT, { arg: 'address', value: address });
//     }

//     address = address.toLowerCase();

//     let chars = address.substring(2).split('');

//     let hashed = new Uint8Array(40);
//     for (let i = 0; i < 40; i++) {
//         hashed[i] = chars[i].charCodeAt(0);
//     }
//     hashed = arrayify(keccak256(hashed));

//     for (var i = 0; i < 40; i += 2) {
//         if ((hashed[i >> 1] >> 4) >= 8) {
//             chars[i] = chars[i].toUpperCase();
//         }
//         if ((hashed[i >> 1] & 0x0f) >= 8) {
//             chars[i + 1] = chars[i + 1].toUpperCase();
//         }
//     }

//     return '0x' + chars.join('');
// }

// Shims for environments that are missing some required constants and functions
var MAX_SAFE_INTEGER: number = 0x1fffffffffffff;

function log10(x: number): number {
    if (Math.log10) { return Math.log10(x); }
    return Math.log(x) / Math.LN10;
}


// See: https://en.wikipedia.org/wiki/International_Bank_Account_Number

// Create lookup table
var ibanLookup: { [character: string]: string } = {};
for (var i = 0; i < 10; i++) { ibanLookup[String(i)] = String(i); }
for (var i = 0; i < 26; i++) { ibanLookup[String.fromCharCode(65 + i)] = String(10 + i); }

// How many decimal digits can we process? (for 64-bit float, this is 15)
var safeDigits = Math.floor(log10(MAX_SAFE_INTEGER));

function ibanChecksum(address: string): string {
    address = address.toUpperCase();
    address = address.substring(4) + address.substring(0, 2) + '00';

    var expanded = '';
    address.split('').forEach(function(c) {
        expanded += ibanLookup[c];
    });

    // Javascript can handle integers safely up to 15 (decimal) digits
    while (expanded.length >= safeDigits){
        var block = expanded.substring(0, safeDigits);
        expanded = parseInt(block, 10) % 97 + expanded.substring(block.length);
    }

    var checksum = String(98 - (parseInt(expanded, 10) % 97));
    while (checksum.length < 2) { checksum = '0' + checksum; }

    return checksum;
};

export function getAddress(address: string): string {
	console.log('address', address)
    // var result = null;

    if (typeof(address) !== 'string') {
        errors.throwError('invalid address', errors.INVALID_ARGUMENT, { arg: 'address', value: address });
	}

	if (address.match(/^(0x)?[0-9a-fA-F]{64}$/)) {
		if (address.substring(0, 2) !== '0x') {
			address = '0x' + address;
		}

		return address;
	}

	if (!/^1\.(2|9)\.(([1-9]\d*)|0)$/.test(address)) {
		errors.throwError('invalid address', errors.INVALID_ARGUMENT, { arg: 'address', value: address });
	}
	
	var [, instanceTypeId, objectId] = address.split('.')

	var preRes = parseInt(objectId, 10).toString(16);

	if (preRes.length > 38) {
		errors.throwError('invalid address', errors.INVALID_ARGUMENT, { arg: 'address', value: address });
	}

	var isContract = parseInt(instanceTypeId) === 14;

	var address = [
		Array(25).fill(0, 0, 25).join(''),
		isContract ? '1' : '0',
		Array(38 - preRes.length).fill(0, 0, 38 - preRes.length).join(''),
		preRes
	].join('');

    return '0x' + address;
}

export function getIcapAddress(address: string): string {
    var base36 = (new BN.BN(getAddress(address).substring(2), 16)).toString(36).toUpperCase();
    while (base36.length < 30) { base36 = '0' + base36; }
    return 'XE' + ibanChecksum('XE00' + base36) + base36;
}

// http://ethereum.stackexchange.com/questions/760/how-is-the-address-of-an-ethereum-contract-computed
export function getContractAddress(transaction: { from: string, nonce: Arrayish | BigNumber | number }) {
    if (!transaction.from) { throw new Error('missing from address'); }
    var nonce = transaction.nonce;

    return getAddress('0x' + keccak256(encode([
        getAddress(transaction.from),
        stripZeros(hexlify(nonce))
    ])).substring(26));
}

