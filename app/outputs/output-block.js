/* jshint node:true */
'use strict';

var _utils = require('../utils/utils');

/**
 * Class that generates json markup for outputs.
 *
 * @class OutputBlock
 * @constructor
 * @param {String} name The name of the output
 * @param {String} description The description of the output
 * @param {Object} value The value of the output
 */
function OutputBlock(name, description, value) {
    if(typeof name !== 'string' || name.length <= 0) {
        throw new Error('Invalid name specified (arg #1)');
    }
    if(typeof description !== 'string' || description.length <= 0) {
        throw new Error('Invalid description specified (arg #2)');
    }
    if(!value || (typeof options === 'string' && options.length <=0)) {
        throw new Error('Invalid value specified (arg #3)');
    }
    this._name = name;
    this._description = description;
    this._value = value;
}

/**
 * Generates the template markup required by the output
 *
 * @class OutputBlock
 * @method generate
 * @return {Array} An array of key value objects that can be added to the
 *          output map of the cloudformation template.
 */
OutputBlock.prototype.generate = function() {
   var outputs = { };
   outputs[this._name] = {
       Description: this._description,
       Value: _utils.resolve(this._value)
   };

   return outputs;
};


module.exports = OutputBlock;
