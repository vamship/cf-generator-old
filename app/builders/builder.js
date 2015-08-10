/* jshint node:true */
'use strict';

var TemplateGenerator = require('../template-generator');
var Tags = require('../utils/tags');
var OutputBlock = require('../outputs/output-block');

/**
 * Base class for template builder objects. Provides basic structure, allowing
 * inheriting classes to define the build pattern.
 *
 * @class TemplateBuilder
 * @constructor
 * @param {String} baseName The base name used for all resources in the template
 * @param {String} description The description of the template
 * @param {Object} tags A map of tags that will be available to all inheriting
 *          classes.
 */
function TemplateBuilder(baseName, description, tags) {
    if(typeof baseName !== 'string' || baseName.length <= 0) {
        throw new Error('Invalid base name specified (arg #1)');
    }
    if(typeof description !== 'string' || description.length <= 0) {
        throw new Error('Invalid description specified (arg #2)');
    }
    if(!tags || typeof tags !== 'object') {
        throw new Error('Invalid tags object specified (arg #3)');
    }

    this._baseName = baseName;
    this._template = new TemplateGenerator();
    this._tags = new Tags(tags);
    this._outputs = {};

    this._template.setDescription(description);
}

/**
 * Converts camel case strings to hyphenated strings
 *
 * @class TemplateBuilder
 * @method _hyphenate
 * @private
 */
TemplateBuilder.prototype._hyphenate = function(param) {
    return param.replace(/\W+/g,'-')
                .replace(/([a-z\d])([A-Z])/g, '$1-$2')
                .toLowerCase();
};

/**
 * Generates a prefixed name for a resource.
 *
 * @class TemplateBuilder
 * @method _resName
 * @private
 */
TemplateBuilder.prototype._resName = function(name) {
    return (!name)? this._baseName: this._baseName + '-' + this._hyphenate(name);
};

/**
 * Allows inheriting classes to add parameters to the template.
 *
 * @class TemplateBuilder
 * @method _addParameters
 * @protected
 * @param {Object} template A reference to the template generator object.
 */
TemplateBuilder.prototype._addParameters = function(template) {
    //Do nothing here - allow child classes to override.
};

/**
 * Allows inheriting classes to add resources to the template.
 *
 * @class TemplateBuilder
 * @method _addResources
 * @protected
 * @param {Object} template A reference to the template generator object.
 */
TemplateBuilder.prototype._addResources = function(template) {
    //Not overriding this method is an error condition.
    throw new Error('Builder has not implemented this method!');
};

/**
 * Allows inheriting classes to add outputs to the template.
 *
 * @class TemplateBuilder
 * @method _addOutputs
 * @protected
 * @param {Object} template A reference to the template generator object.
 */
TemplateBuilder.prototype._addOutputs = function(template) {
    for(var name in this._outputs) {
        var output = this._outputs[name];
        var block = new OutputBlock(name, output.description, output.value);
        template.addOutput(block);
    }
};

/**
 * Generates a template based on the added parameters, resources and outputs,
 * and returns the resulting template string.
 *
 * @class TemplateBuilder
 * @method build
 * @returns {String} The generated template string.
 */
TemplateBuilder.prototype.build = function() {
    this._addParameters(this._template);
    this._outputs = {};
    this._addResources(this._template, this._outputs);
    this._addOutputs(this._template, this._outputs);
    return this._template.generate();
};

module.exports = TemplateBuilder;
