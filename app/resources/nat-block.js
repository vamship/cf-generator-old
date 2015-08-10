/* jshint node:true */
'use strict';

var _nodeUtil = require('util');
var _utils = require('../utils/utils');
var ResourceBlock = require('./resource-block');
var Ref = require('../utils/ref');

/**
 * Block that generates the required cloudformation specs for a NAT instance
 * within a VPC. This block also creates a unique security group for the
 * NAT instance.
 *
 * @class Nat
 * @constructor
 * @param {String} baseKey The base key for the generated resources
 * @param {String} baseName The base name, used to generate "name" tags
 * @param {Object} options An options object containing a set of key value
 *          pairs that can be used by the block.
 * @param {Object} tags A tags object used to apply global tags to specific
 *          resources
 */
function Nat(baseKey, baseName, options, tags) {
    Nat.super_.call(this, baseKey, baseName, options, tags);

    this._resourceKeys = {
        instance: this._baseKey + 'Instance',
        securityGroup: this._baseKey + 'SecurityGroup',
        addNatTrafficRoute: this._baseKey + 'AddNatTrafficRoute'
    };
}

_nodeUtil.inherits(Nat, ResourceBlock);

/**
 * Generates a set of resource objects that can be used in the AWS cloud
 * formation block.
 *
 * @return {Array} An array of key value objects that can be added to the
 *          resource map of the cloudformation block.
 */
Nat.prototype.generate = function() {
    var securityGroup = {
        Type: 'AWS::EC2::SecurityGroup',
        Properties: {
            GroupDescription: 'Security rules for NAT instances',
            VpcId: _utils.resolve(this._options.vpcId),
            SecurityGroupIngress: [
                { IpProtocol: 'tcp', FromPort: '80', ToPort: '80', CidrIp : '0.0.0.0/0' },
                { IpProtocol: 'tcp', FromPort: '443', ToPort: '443', CidrIp : '0.0.0.0/0' }
            ],
            SecurityGroupEgress : [ ],
            Tags: [
                { Key: 'Name', Value: this._resName('security-group') }
            ]
        }
    };
    this._tags.apply(securityGroup);

    var instance = {
        Type: 'AWS::EC2::Instance',
        Properties: {
            ImageId: _utils.resolve(this._options.imageId),
            InstanceType: _utils.resolve(this._options.instanceType),
            SourceDestCheck: false,
            NetworkInterfaces: [ {
                DeviceIndex: 0,
                SubnetId: _utils.resolve(this._options.publicSubnetId),
                GroupSet: [ this._localRef('securityGroup') ],
                AssociatePublicIpAddress: true
            } ],
            Tags: [
                { Key: 'Name', Value: this._resName('instance') }
            ]
        }
    };
    this._tags.apply(instance);

    var addNatTrafficRoute = {
        Type: 'AWS::EC2::Route',
        DependsOn: this.getResourceKey('instance'),
        Properties: {
            RouteTableId: _utils.resolve(this._options.privateSubnetRouteTableId),
            DestinationCidrBlock: '0.0.0.0/0',
            InstanceId:  this._localRef('instance')
        }
    };

    var resources = {};
    resources[this.getResourceKey('securityGroup')] = securityGroup;
    resources[this.getResourceKey('instance')] = instance;
    resources[this.getResourceKey('addNatTrafficRoute')] = addNatTrafficRoute;

    return resources;
};

module.exports = Nat;
