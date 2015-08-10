/* jshint node:true */
'use strict';

var _utils = require('./utils');

/**
 * Template for a cloudformation "Ref" object. Generates a cloudformation
 * reference lookup.
 * 
 * @class Ref
 * @constructor
 * @param {String} resource The name of the resource to be referenced.
 */
function Ref(resource) {
    if(typeof resource !== 'string' || resource.length <= 0) {
        throw new Error('Invalid resource specified (arg #1)');
    }

    this._resource = resource;
}

/**
 * Creates and resolves a new reference object for the specified resource.
 *
 * @class Ref
 * @static
 * @param {String} resource The name of the resource to be referenced.
 * @return {Object} The javascript object representing the lookup.
 */
Ref.resolve = function(resource) {
    return _utils.resolve(new Ref(resource));
};

/**
 * Generates the reference lookup object.
 *
 * @class Ref
 * @method generate
 * @return {Object} The javascript object representing the lookup.
 */
Ref.prototype.generate = function() {
    return {
        Ref: this._resource
    };
};

module.exports = Ref;
