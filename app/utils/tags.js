/* jshint node:true */
'use strict';

var _clone = require('clone');

/**
 * Object that manages tags that can be applied to resources. Generates the
 * tag object structure required by AWS cloudformation.
 *
 * @class Tags
 * @constructor
 * @param {Object} tags A hash containing tags in the form of key-value pairs
 */
function Tags(tags) {
    tags = tags || {};
    this._tags = _clone(tags);
}

/**
 * Default transformation for tags.
 *
 * @class Tags
 * @method _defaultTransform
 * @private
 */
Tags.prototype._defaultTransform = function(key, value) {
    return {
        Key: key,
        Value: value
    };
};


/**
 * Generates cloudformation tag objects and applies them to the specified
 * resource. If the resource already contains a "Tags" array, additional
 * tags will be added to the array.
 *
 * Note that this could result in duplicate tags being added to the tags
 * array.
 *
 * @class Tags
 * @method apply
 * @param {Object} resource The resource to which the tags will be applied.
 * @param {Object} [transform] An optional transformation function that can
 *          modify the tag markup
 */
Tags.prototype.apply = function(resource, transform) {
    resource.Properties = resource.Properties || {};
    resource.Properties.Tags = resource.Properties.Tags || [];

    transform = (typeof transform === 'function')? transform:this._defaultTransform;
    for(var key in this._tags) {
        resource.Properties.Tags.push(transform(key, this._tags[key]));
    }
};

module.exports = Tags;
