'use strict';
export function uidGen () {
   return Math.random().toString(36).substr(2, 9).toUpperCase();
};
