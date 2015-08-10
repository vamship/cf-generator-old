/* jshint node:true */
'use strict';

var _clone = require('clone');
var _utils = require('../utils/utils');
var Tags = require('../utils/tags');
var Ref = require('../utils/ref');

/**
 * Base class for resource blocks - provides core method definitions and utility
 * methods that can be used by all inheriting blocks.
 *
 * @class ResourceBlock
 * @constructor
 * @param {String} baseKey The base key for the generated resources
 * @param {String} baseName The base name, used to generate "name" tags
 * @param {Object} options An options object containing a set of key value
 *          pairs that can be used by the block.
 * @param {Object} tags A tags object used to apply global tags to specific
 *          resources
 */
function ResourceBlock(baseKey, baseName, options, tags) {
    if(typeof baseKey !== 'string' || baseKey.length <= 0) {
        throw new Error('Invalid base key specified (arg #1)');
    }
    if(typeof baseName !== 'string' || baseName.length <= 0) {
        throw new Error('Invalid base name specified (arg #2)');
    }
    if(!options || typeof options !== 'object') {
        throw new Error('Invalid options specified (arg #3)');
    }
    if(!(tags instanceof Tags)) {
        throw new Error('Invalid tags object specified (arg #4)');
    }
    this._baseKey = baseKey;
    this._baseName = baseName;
    this._options = _clone(options);
    this._tags = tags;
    this._resourceKeys = {};
}

/**
 * Helper method that generates a cloudformation reference object for an
 * object defined within the current block.
 *
 * @class ResourceBlock
 * @method _localRef
 * @private
 */
ResourceBlock.prototype._localRef = function(key) {
    if(typeof key !== 'string' || key.length <= 0) {
        throw new Error('Invalid resource key specified (arg #1)');
    }
    return Ref.resolve(this.getResourceKey(key));
};

/**
 * Helper method that generates a resource name based on the specified suffix.
 *
 * @class ResourceBlock
 * @method _resName
 * @private
 */
ResourceBlock.prototype._resName = function(suffix) {
    suffix = suffix || '';
    if(typeof suffix !== 'string') {
        throw new Error('Invalid name suffix specified (arg #1)');
    }
    return (suffix)? this._baseName + '-' + suffix: this._baseName;
}

/**
 * Returns a the value of a specific resource key, looked up by key name. This
 * method will be useful when other blocks would like to reference resources
 * defined by this block.
 *
 * @class ResourceBlock
 * @method getResourceKey
 * @param {String} keyName The name of the key to lookup
 * @return {String} The key value of the resource
 */
ResourceBlock.prototype.getResourceKey = function(keyName) {
    if(!this._resourceKeys || typeof this._resourceKeys !== 'object') {
        throw new Error('Resource keys have not been defined for the block');
    }
    var key = this._resourceKeys[keyName];
    if(typeof key !== 'string' || key.length <= 0) {
        throw new Error('Specified resource key was not defined by the block: ' + keyName);
    }

    return key;
}

/**
 * Placeholder method that has to be overridden by all inheriting classes.
 *
 * @class ResourceBlock
 * @method generate
 * @return {Array} An array of key value objects that can be added to the
 *          resource map of the cloudformation template.
 */
ResourceBlock.prototype.generate = function() {
    throw new Error('The generate() method has not been implemented');
};

module.exports = ResourceBlock;
