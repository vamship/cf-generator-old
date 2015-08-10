/* jshint node:true */
'use strict';

var _utils = require('./utils');

/**
 * Template for a cloudformation "Fn::Base64" object. Generates a cloudformation
 * Base64 function. If any of the items passed to the function are resolvable, 
 * they will be resolved when this object is resolved.
 * 
 * @class Base64
 * @constructor
 * @param {String} resource The name of the resource to be base 64 encoded.
 */
function Base64(resource) {
    if(!resource ||
       (typeof resource === 'string' && resource.length <= 0) ||
       (typeof resource !== 'object')) {
        throw new Error('Invalid resource specified (arg #1)');
    }

    this._resource = resource;
}

/**
 * Creates and resolves a new Fn::Base64 object for the specified resource.
 *
 * @class Base64
 * @static
 * @param {String} resource The resource to be encoded.
 * @return {Object} The javascript object representing the Base64 function.
 */
Base64.resolve = function(resource) {
    return _utils.resolve(new Base64(resource));
};

/**
 * Generates the Fn::Base64 function call markup.
 *
 * @class Base64
 * @method generate
 * @return {Object} The javascript object representing the Base64 function.
 */
Base64.prototype.generate = function() {
    return {
        'Fn::Base64': _utils.resolve(this._resource)
    };
};

module.exports = Base64;
