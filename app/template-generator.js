/* jshint node:true */
'use strict';

var ResourceBlock = require('./resources/resource-block');
var OutputBlock = require('./outputs/output-block');

/**
 * Builder object for a cloudformation stack template. Uses added parameters,
 * resources and outputs to generate the final cloudformation json.
 *
 * @class TemplateBuilder
 * @constructor
 */
function TemplateBuilder() {
    this._description = '';
    this._parameters = [];
    this._resources = [];
    this._outputs = [];
};

/**
 * Sets the description of the template
 *
 * @class TemplateBuilder
 * @method setDescription
 * @param {Object} description The template description
 */
TemplateBuilder.prototype.setDescription = function(description) {
    if(typeof description !== 'string') {
        throw new Error('Invalid description specified (arg #1)');
    }
    this._description = description;
};

/**
 * Adds a parameter generation block to the template
 *
 * @class TemplateBuilder
 * @method addParameter
 * @param {Object} parameter The parameter block that will ultimately generate
 *          one or more parameter references for the template.
 */
TemplateBuilder.prototype.addParameter = function(block) {
    if(!(block instanceof Parameter)) {
        throw new Error('Invalid parameter block specified (arg #1)');
    }
    this._parameters.push(block);
};

/**
 * Adds a resource generation block to the template.
 *
 * @class TemplateBuilder
 * @method addResource
 * @param {Object} block The resource block that will ultimately generate
 *          one or more resources for the template.
 */
TemplateBuilder.prototype.addResource = function(block) {
    if(!(block instanceof ResourceBlock)) {
        throw new Error('Invalid resource block specified (arg #1)');
    }
    this._resources.push(block);
};

/**
 * Adds an output parameter generation to the template.
 *
 * @class TemplateBuilder
 * @method addOutput
 * @param {Object} block The output parameter block that will ultimately
 *          generate one or more outputs for the template.
 */
TemplateBuilder.prototype.addOutput = function(block) {
    if(!(block instanceof OutputBlock)) {
        throw new Error('Invalid output block specified (arg #1)');
    }
    this._outputs.push(block);
};

/**
 * Generates the cloud formation template based on all the entities added to the
 * builder.
 *
 * @class TemplateBuilder
 * @method generate
 * @return {String} A fully formed cloudformation template json.
 */
TemplateBuilder.prototype.generate = function() {
    var stackTemplate = {
        Description: this._description,
        Parameters: {},
        Resources: {},
        Outputs: {}
    };

    this._outputs.forEach(function(block) {
        var outputs = block.generate();

        for(var prop in outputs) {
            stackTemplate.Outputs[prop] = outputs[prop];
        }
    });

    this._parameters.forEach(function(block) {
        var parameters = block.generate();

        for(var prop in parameters) {
            stackTemplate.Parameters[prop] = parameters[prop];
        }
    });

    this._resources.forEach(function(block) {
        var resources = block.generate();

        for(var prop in resources) {
            stackTemplate.Resources[prop] = resources[prop];
        }
    });

    if(Object.keys(stackTemplate.Parameters).length <= 0) {
        delete stackTemplate.Parameters;
    }

    if(Object.keys(stackTemplate.Resources).length <= 0) {
        delete stackTemplate.Resources;
    }

    if(Object.keys(stackTemplate.Outputs).length <= 0) {
        delete stackTemplate.Outputs;
    }

    return JSON.stringify(stackTemplate, null, '    ');
};

module.exports = TemplateBuilder;
