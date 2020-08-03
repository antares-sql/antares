/* eslint-disable no-useless-escape */
// eslint-disable-next-line no-control-regex
const regex = new RegExp(/[\0\x08\x09\x1a\n\r"'\\\%]/g);

/**
 * Escapes a string
 *
 * @param {String} string
 * @returns {String}
 */
function sqlEscaper (string) {
   return string.replace(regex, (char) => {
      const m = ['\\0', '\\x08', '\\x09', '\\x1a', '\\n', '\\r', '\'', '"', '\\', '\\\\', '%'];
      const r = ['\\\\0', '\\\\b', '\\\\t', '\\\\z', '\\\\n', '\\\\r', '\'\'', '""', '\\\\', '\\\\\\\\', '\\%'];
      return r[m.indexOf(char)];
   });
}

export { sqlEscaper };
