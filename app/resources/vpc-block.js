/* jshint node:true */
'use strict';

var _nodeUtil = require('util');
var _utils = require('../utils/utils');
var ResourceBlock = require('./resource-block');

/**
 * Block that generates the required cloudformation specs for a VPC.
 * An internet gateway is also created and attached to the VPC.
 *
 * @class Vpc
 * @constructor
 * @param {String} baseKey The base key for the generated resources
 * @param {String} baseName The base name, used to generate "name" tags
 * @param {Object} options An options object containing a set of key value
 *          pairs that can be used by the block.
 * @param {Object} tags A tags object used to apply global tags to specific
 *          resources
 */
function Vpc(baseKey, baseName, options, tags) {
    Vpc.super_.call(this, baseKey, baseName, options, tags);

    this._options.enableDnsSupport = !!this._options.enableDnsSupport;
    this._options.enableDnsHostNames = !!this._options.enableDnsHostNames;

    this._resourceKeys = {
        vpc: this._baseKey,
        internetGateway: this._baseKey + 'InternetGateway',
        attachGateway: this._baseKey + 'AttachGateway'
    };
}

_nodeUtil.inherits(Vpc, ResourceBlock);

/**
 * Generates a set of resource objects that can be used in the AWS cloud
 * formation block.
 *
 * @return {Array} An array of key value objects that can be added to the
 *          resource map of the cloudformation block.
 */
Vpc.prototype.generate = function() {
    var vpc = {
        Type: 'AWS::EC2::VPC',
        Properties: {
            CidrBlock: _utils.resolve(this._options.cidr),
            EnableDnsHostnames: _utils.resolve(this._options.enableDnsHostNames),
            EnableDnsSupport: _utils.resolve(this._options.enableDnsSupport),
            Tags: [
                { Key: 'Name', Value: this._resName('') }
            ]
        }
    };
    this._tags.apply(vpc);

    var internetGateway = {
        Type: 'AWS::EC2::InternetGateway',
        Properties: {
            Tags: [
                { Key: 'Name', Value: this._resName('igw') }
            ]
        }
    };
    this._tags.apply(internetGateway);

    var attachGateway = {
        Type: 'AWS::EC2::VPCGatewayAttachment',
        Properties: {
            VpcId: this._localRef('vpc'),
            InternetGatewayId: this._localRef('internetGateway')
        }
    };

    var resources = {};
    resources[this.getResourceKey('vpc')] = vpc;
    resources[this.getResourceKey('internetGateway')] = internetGateway;
    resources[this.getResourceKey('attachGateway')] = attachGateway;

    return resources;
};


module.exports = Vpc;
