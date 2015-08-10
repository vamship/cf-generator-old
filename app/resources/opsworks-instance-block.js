/* jshint node:true */
'use strict';

var _nodeUtil = require('util');
var _utils = require('../utils/utils');
var Join = require('../utils/join');
var ResourceBlock = require('./resource-block');

/**
 * Block that generates a set of opsworks instances of a specific type
 * (24/7, load, time).
 *
 * @class OpsWorksInstance
 * @constructor
 * @param {String} baseKey The base key for the generated resources
 * @param {String} baseName The base name, used to generate "name" tags
 * @param {Object} options An options object containing a set of key value
 *          pairs that can be used by the block.
 * @param {Object} tags A tags object used to apply global tags to specific
 *          resources
 */
function OpsWorksInstance(baseKey, baseName, options, tags) {
    OpsWorksInstance.super_.call(this, baseKey, baseName, options, tags);

    if(typeof this._options.instanceCount !== 'number' ||
        this._options.instanceCount <= 0) {
        throw new Error('Invalid instance count specified (options.instanceCount)');
    }
    if(!(this._options.subnetIds instanceof Array) ||
       this._options.subnetIds.length <= 0) {
        throw new Error('At least one subnet must be specified (options.subnetIds)');
    }

    this._resourceKeys = { }

    for(var index=0; index<this._options.instanceCount; index++) {
        var key = 'instance' + index.toString();

        this._resourceKeys[key] = this._baseKey + index.toString();
    }
}

_nodeUtil.inherits(OpsWorksInstance, ResourceBlock);

/**
 * Generates a set of resource objects that can be used in the AWS cloud
 * formation block.
 *
 * @return {Array} An array of key value objects that can be added to the
 *          resource map of the cloudformation block.
 */
OpsWorksInstance.prototype.generate = function() {
    var subnetIds = _utils.resolve(this._options.subnetIds);
    var resources = {};
    for(var index=0; index<this._options.instanceCount; index++) {
        var subnetId = subnetIds[index%subnetIds.length];
        var instance = {
            Type: 'AWS::OpsWorks::Instance',
            Properties: {
                InstanceType: _utils.resolve(this._options.instanceType),
                StackId: _utils.resolve(this._options.stackId),
                LayerIds: _utils.resolve(this._options.layerIds),
                SubnetId: subnetId
            }
        };

        if(this._options.sshKeyName) {
            instance.Properties.SshKeyName =
                                    _utils.resolve(this._options.SshKeyName);
        }

        if(this._options.os) {
            instance.Properties.Os = _utils.resolve(this._options.os);
        }

        if(this._options.amiId) {
            instance.Properties.AmiId = _utils.resolve(this._options.amiId);
        }

        if(this._options.autoScale) {
            if(this._options.autoScalingSchedule) {
                instance.Properties.AutoScalingType = 'timer';
                instance.Properties.TimeBasedAutoScaling =
                            _utils.resolve(this._options.autoScalingSchedule);
            } else {
                instance.Properties.AutoScalingType = 'load';
            }
        }

        resources[this.getResourceKey('instance'+index.toString())] = instance;
    }

    return resources;
};

module.exports = OpsWorksInstance;
