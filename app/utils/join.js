/* jshint node:true */
'use strict';

var _clone = require('clone');
var _utils = require('./utils');

/**
 * Template for a cloudformation "Fn::Join" object. Generates a cloudformation
 * Join function. If any of the items passed to the function are resolvable, 
 * they will be resolved when this object is resolved.
 * 
 * @class Join
 * @constructor
 * @param {Array} items A list of items to be joined
 * @param {String} [joinChar=''] An optional join character. The default value
 *          for this parameter is an empty string.
 */
function Join(items, joinChar) {
    if(!(items instanceof Array)) {
        throw new Error('Invalid item list specified (arg #1)');
    }

    this._joinChar = (typeof joinChar !== 'string')? '' : joinChar;
    this._items = _clone(items);
}

/**
 * Creates and resolves a new Fn::Join object for the specified resource.
 *
 * @class Join
 * @static
 * @param {Array} items A list of items to be joined
 * @param {String} [joinChar=''] An optional join character. The default value
 *          for this parameter is an empty string.
 * @return {Object} The javascript object representing the Join function.
 */
Join.resolve = function(items, joinChar) {
    return _utils.resolve(new Join(items, joinChar));
};

/**
 * Generates the Fn::Join function call markup.
 *
 * @class Join
 * @method generate
 * @return {Object} The javascript object representing the join function.
 */
Join.prototype.generate = function() {
    var resolvedItems = _utils.resolve(this._items);
    return {
        'Fn::Join': [ this._joinChar, resolvedItems ]
    };
};

module.exports = Join;
