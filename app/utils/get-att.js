/* jshint node:true */
'use strict';

var _clone = require('clone');
var _utils = require('./utils');

/**
 * Template for a cloudformation "Fn::GetAtt" object. Generates a cloudformation
 * GetAtt function. If any of the items passed to the function are resolvable, 
 * they will be resolved when this object is resolved.
 * 
 * @class GetAtt
 * @constructor
 * @param {String} objectKey A key that identifies the object whose attribute
 *          needs to be looked up
 * @param {String} attribute The name of the attribute to lookup
 */
function GetAtt(items, joinChar) {
    if(!objectKey || typeof objectKey !== 'object' ||
       (typeof objectKey === 'string' && objectKey.length <=0)) {
        throw new Error('Invalid object key specified (arg #1)');
    }
    if(!attribute || typeof attribute !== 'object' ||
       (typeof attribute === 'string' && attribute.length <=0)) {
        throw new Error('Invalid attribute specified (arg #2)');
    }

    this._objectKey = objectKey;
    this._attribute = attribute;
}

/**
 * Creates and resolves a new Fn::GetAtt object for the specified resource.
 *
 * @class GetAtt
 * @static
 * @param {String} objectKey A key that identifies the object whose attribute
 *          needs to be looked up
 * @param {String} attribute The name of the attribute to lookup
 * @return {Object} The javascript object representing the GetAtt function.
 */
GetAtt.resolve = function(objectKey, attribute) {
    return _utils.resolve(new GetAtt(objectKey, attribute));
};

/**
 * Generates the Fn::GetAtt function call markup.
 *
 * @class GetAtt
 * @method generate
 * @return {Object} The javascript object representing the GetAtt function.
 */
GetAtt.prototype.generate = function() {
    var resolvedItems = _utils.resolve(this._items);
    return {
        'Fn::GetAtt': [
            _utils.resolve(this._objectKey),
            _utils.resolve(this._attribute)
        ]
    };
};

module.exports = GetAtt;
