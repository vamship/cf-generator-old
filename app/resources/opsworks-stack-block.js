/* jshint node:true */
'use strict';

var _nodeUtil = require('util');
var _utils = require('../utils/utils');
var ResourceBlock = require('./resource-block');
var Join = require('../utils/join');
var Ref = require('../utils/ref');

/**
 * Block that generates a basic opsworks stack, without any layers.
 *
 * @class OpsWorksStack
 * @constructor
 * @param {String} baseKey The base key for the generated resources
 * @param {String} baseName The base name, used to generate "name" tags
 * @param {Object} options An options object containing a set of key value
 *          pairs that can be used by the block.
 * @param {Object} tags A tags object used to apply global tags to specific
 *          resources
 */
function OpsWorksStack(baseKey, baseName, options, tags) {
    OpsWorksStack.super_.call(this, baseKey, baseName, options, tags);

    this._resourceKeys = {
        stack: this._baseKey
    };
}

_nodeUtil.inherits(OpsWorksStack, ResourceBlock);

/**
 * Generates a set of resource objects that can be used in the AWS cloud
 * formation block.
 *
 * @return {Array} An array of key value objects that can be added to the
 *          resource map of the cloudformation block.
 */
OpsWorksStack.prototype.generate = function() {
    var stack = {
        Type: 'AWS::OpsWorks::Stack',
        Properties: {
            Name: this._resName(''),
            VpcId: _utils.resolve(this._options.vpcId),
            DefaultSubnetId: _utils.resolve(this._options.defaultSubnetId),
            ConfigurationManager: {
                Name: 'Chef',
                Version: '11.10'
            },
            ServiceRoleArn: Join.resolve([
                'arn:aws:iam::',
                new Ref('AWS::AccountId'),
                ':role/',
                this._options.serviceRole
            ]),
            DefaultInstanceProfileArn: Join.resolve([
                'arn:aws:iam::',
                new Ref("AWS::AccountId"),
                ':instance-profile/',
                this._options.defaultInstanceRole
            ])
        }
    };

    if(typeof this._options.customCookbooksUrl === 'string') {
        stack.Properties.UseCustomCookbooks = true;
        stack.Properties.CustomCookbooksSource = {
            Type: 'git',
            Url: this._options.customCookbooksUrl
        };
    }

    var resources = {};
    resources[this.getResourceKey('stack')] = stack;

    return resources;
};

module.exports = OpsWorksStack;
