'use strict';

const lookup = {
   0: '0000',
   1: '0001',
   2: '0010',
   3: '0011',
   4: '0100',
   5: '0101',
   6: '0110',
   7: '0111',
   8: '1000',
   9: '1001',
   a: '1010',
   b: '1011',
   c: '1100',
   d: '1101',
   e: '1110',
   f: '1111',
   A: '1010',
   B: '1011',
   C: '1100',
   D: '1101',
   E: '1110',
   F: '1111'
};

/**
 * Converts hexadecimal string to binary string
 *
 * @param {string} hex Hexadecimal string
 * @returns {string} Binary string
 */
export default function hexToBinary (hex) {
   let binary = '';
   for (let i = 0; i < hex.length; i++)
      binary += lookup[hex[i]];

   return binary;
}
