/* eslint-disable no-useless-escape */
// eslint-disable-next-line no-control-regex
const pattern = /[\0\x08\x09\x1a\n\r"'\\\%]/gm;
const regex = new RegExp(pattern);

/**
 * Escapes a string
 *
 * @param {String} string
 * @returns {String}
 */
function sqlEscaper (string) {
   return string.replace(regex, char => {
      const m = ['\\0', '\\x08', '\\x09', '\\x1a', '\\n', '\\r', '\'', '\"', '\\', '\\\\', '%'];
      const r = ['\\\\0', '\\\\b', '\\\\t', '\\\\z', '\\\\n', '\\\\r', '\\\'', '\\\"', '\\\\', '\\\\\\\\', '\%'];
      return r[m.indexOf(char)] || char;
   });
}

export { sqlEscaper };
