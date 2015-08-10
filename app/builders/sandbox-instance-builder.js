'use strict';

var _nodeUtil = require('util');
var _clone = require('clone');
var Ref = require('../utils/ref');

var Builder= require('./builder');
var SandboxInstanceBlock = require('../resources/sandbox-instance-block');
var OutputBlock = require('../outputs/output-block');

/**
 * Builder for template that creates sandbox instances in public and private
 * subnets. This template can be used to quickly stand up and tear down
 * instances within a VPC when testing functionality.
 *
 * @class SandboxInstanceBuilder
 * @constructor
 * @param {Options} options An options hash that define different
 *          parameters of the VPC
 */
function SandboxInstanceBuilder(options) {
    if(!options || typeof options !== 'object') {
        throw new Error('Invalid options object specified (arg #1)');
    }

    SandboxInstanceBuilder.super_.call(this, options.name, options.description, options.tags);
    if(!(options.instances instanceof Array) || options.instances.length <= 0) {
        throw new Error('At least one instance must be specified for sandbox instance creation (options.instances)');
    }

    this._instances = _clone(options.instances);
}

_nodeUtil.inherits(SandboxInstanceBuilder, Builder);

/**
 * @class SandboxInstanceBuilder
 * @method _addResources
 * @protected
 */
SandboxInstanceBuilder.prototype._addResources = function(template, outputs) {
    var blocks = [];

    this._instances.forEach(function(instInfo) {
        var instance = new SandboxInstanceBlock(instInfo.name, this._resName(instInfo.name), {
            vpcId: instInfo.vpcId,
            subnetId: instInfo.subnetId,
            imageId: instInfo.imageId || 'ami-d05e75b8',
            instanceType: instInfo.instanceType || 't2.micro',
            isPublic: instInfo.isPublic,
            sshKeyName: instInfo.sshKeyName
        }, this._tags);

        blocks.push(instance);

        outputs[instInfo.name] = {
            description: 'Instance id for instance ' + instInfo.name,
            value: new Ref(instance.getResourceKey('instance'))
        };
    }.bind(this));

    blocks.forEach(function(block) {
        template.addResource(block);
    });
};

module.exports = SandboxInstanceBuilder;
