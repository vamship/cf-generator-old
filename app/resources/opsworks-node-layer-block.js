/* jshint node:true */
'use strict';

var _nodeUtil = require('util');
var _utils = require('../utils/utils');
var ResourceBlock = require('./resource-block');

/**
 * Block that generates an opsworks layer and app that is specifically
 * configured for nodejs applications.
 *
 * @class OpsWorksNodeLayer
 * @constructor
 * @param {String} baseKey The base key for the generated resources
 * @param {String} baseName The base name, used to generate "name" tags
 * @param {Object} options An options object containing a set of key value
 *          pairs that can be used by the block.
 * @param {Object} tags A tags object used to apply global tags to specific
 *          resources
 */
function OpsWorksNodeLayer(baseKey, baseName, options, tags) {
    OpsWorksNodeLayer.super_.call(this, baseKey, baseName, options, tags);

    this._resourceKeys = {
        layer: this._baseKey,
        app: this._baseKey + 'App',
        attachElb: this._baseKey + 'AttachElb'
    };
}

_nodeUtil.inherits(OpsWorksNodeLayer, ResourceBlock);

/**
 * Generates a set of resource objects that can be used in the AWS cloud
 * formation block.
 *
 * @return {Array} An array of key value objects that can be added to the
 *          resource map of the cloudformation block.
 */
OpsWorksNodeLayer.prototype.generate = function() {
    var layer = {
        Type: 'AWS::OpsWorks::Layer',
        Properties: {
            Name: this._resName(''),
            Shortname: _utils.resolve(this._options.layerShortName),
            StackId: _utils.resolve(this._options.stackId),
            Type: 'custom',
            EnableAutoHealing: true,
            AutoAssignElasticIps: false,
            AutoAssignPublicIps: false,
            CustomRecipes : {
                Setup: [ 'opsworks_nodejs' ],
                Configure : [ 'opsworks_nodejs::configure' ],
                Deploy: [ 'opsworks_nodejs', 'deploy::nodejs' ],
                Undeploy: [ 'deploy::nodejs-undeploy' ],
                Shutdown: [ 'deploy::nodejs-stop' ]
            }
        }
    };
    
    var attachElb = {
        Type: 'AWS::OpsWorks::ElasticLoadBalancerAttachment',
        Properties: {
            ElasticLoadBalancerName : _utils.resolve(this._options.elbName),
            LayerId : this._localRef('layer')
        }
    };

    var app = {
        Type : 'AWS::OpsWorks::App',
        Properties : {
            Name : _utils.resolve(this._options.appName),
            StackId: _utils.resolve(this._options.stackId),
            Type : 'nodejs',
            AppSource : {
                Type : 's3',
                Url : _utils.resolve(this._options.appUrl),
                Revision : _utils.resolve(this._options.appVersion)
            },
            Attributes: {
                DataSourceType: 'None',
            }
        }
    };

    if(this._options.appUserName) {
        app.Properties.AppSource.Username = _utils.resolve(this._options.appUserName);
    }

    if(this._options.appPassword) {
        app.Properties.AppSource.Password = _utils.resolve(this._options.appPassword);
    }

    var resources = {};
    resources[this.getResourceKey('layer')] = layer;
    resources[this.getResourceKey('attachElb')] = attachElb;
    resources[this.getResourceKey('app')] = app;

    return resources;
};

module.exports = OpsWorksNodeLayer;
