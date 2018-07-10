/*

https://github.com/txgruppi/parseargs.js

The MIT License (MIT)

Copyright (c) 2015 Tarcísio Gruppi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

"use strict";

module.exports = function(input) {
  if (typeof input !== 'string') {
    throw new Error('Invalid input type');
  }

  var reading = false;
  var startChar = null;
  var startIndex = null;

  var read = function(s, e) {
    reading = false;
    startChar = null;
    startIndex = null;
    return input.substring(s, e);
  }

  var result = Array.prototype.reduce.call(
    input.trim(),
    function(result, value, index, arr) {
      if (reading && startChar === ' ' && special(value) && !isWhitespace(value)) {
        throw new Error("Invalid argument(s)");
      }

      if (! (reading || special(value))) {
        reading = true;
        startChar = ' ';
        startIndex = index;

        if (index === arr.length - 1 && startChar === ' ') {
          return result.concat([
            read(startIndex)
          ]);
        }

        return result;
      }

      if (!reading && special(value) && !isWhitespace(value)) {
        reading = true;
        startChar = value;
        startIndex = index;
        return result;
      }

      if (!reading) {
        return result;
      }

      if (startChar === ' ' && isWhitespace(value)) {
        if (!isValid(index, arr)) {
          throw new Error("Invalid syntax");
        }

        return result.concat([read(startIndex, index)]);
      }

      if (startChar === value && special(startChar) && isValid(index, arr)) {
        return result.concat([
          read(startIndex + 1, index)
        ]);
      }

      if (index === arr.length - 1 && startChar === ' ') {
        return result.concat([
          read(startIndex)
        ]);
      }

      return result;
    },
    []
  );

  if (startIndex || startChar) {
    throw new Error('Unexpected end of input');
  }

  return result.map(function(str) {
    return str.replace(/\\([\s"'\\])/g, '$1');
  });
}

function isWhitespace(c) {
  return /\s|,/.test(c);
};

function special(c) {
  return /\s|"|'|,/.test(c);
};

function isValid(index, arr) {
  var counter = 0;

  while (true) {
    if (index - 1 - counter < 0) {
      break;
    }

    if (arr[index - 1 - counter] === '\\') {
      counter++;
      continue;
    }

    break;
  }

  return counter % 2 === 0;
}
