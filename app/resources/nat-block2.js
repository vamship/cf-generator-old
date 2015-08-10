/* jshint node:true */
'use strict';

var _nodeUtil = require('util');
var _utils = require('../utils/utils');
var ResourceBlock = require('./resource-block');
var Ref = require('../utils/ref');
var Join = require('../utils/join');
var Base64 = require('../utils/base64');

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
        securityGroup: this._baseKey + 'SecurityGroup',
        iamInstanceRole: this._baseKey + 'IamInstanceRole',
        iamInstanceProfile: this._baseKey + 'IamInstanceProfile',
        instance: this._baseKey + 'Instance',
        autoScalingGroup: this._baseKey + 'AutoScalingGroup',
    };
}

_nodeUtil.inherits(Nat, ResourceBlock);

/**
 * Generates user data for NAT instances
 *
 * @class Nat
 * @method _generateUserData
 * @private
 */
Nat.prototype._generateUserData = function() {
    return Base64.resolve(new Join([
        'echo "hello world"'
    ]));
};

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


    var iamInstanceRole = { 
        Type: 'AWS::IAM::Role',
        Properties: {
            AssumeRolePolicyDocument: {
                Version : '2012-10-17',
                Statement: [ {
                    Effect: 'Allow',
                    Principal: [
                        { Service: 'ec2.amazonaws.com' }
                    ],
                    Action: [
                        'ec2:DescribeInstances',
                        'ec2:ModifyInstanceAttribute',
                        'ec2:DescribeSubnets',
                        'ec2:DescribeRouteTables',
                        'ec2:CreateRoute',
                        'ec2:ReplaceRoute'
                    ]
                    Resource: '*',
                } ]
            },
            Path: '/role/nat-instance/'
        }
    };

    var iamInstanceProfile = {
        Type: 'AWS::IAM::InstanceProfile',
        Properties: {
            Path: '/policy/nat-instance/',
            Roles: [ this._localRef('iamInstanceRole') ]
        }
    };

    var instance = {
        Type: 'AWS::EC2::Instance',
        Properties: {
            ImageId: _utils.resolve(this._options.imageId),
            InstanceType: _utils.resolve(this._options.instanceType),
            IamInstanceProfile: this._localRef('iamInstanceProfile'),
            SourceDestCheck: false,
            NetworkInterfaces: [ {
                DeviceIndex: 0,
                SubnetId: _utils.resolve(this._options.publicSubnetId),
                GroupSet: [ this._localRef('securityGroup') ],
                AssociatePublicIpAddress: true
            } ],
            UserData: this._generateUserData(),
            Tags: [
                { Key: 'Name', Value: this._resName('instance') }
            ]
        }
    };
    this._tags.apply(instance);

    var autoScalingGroup = {
        Type : 'AWS::AutoScaling::AutoScalingGroup',
        DependsOn: [ this.getResourceKey('instance') ],
        Properties : {
            AvailabilityZones : [ _utils.resolve(this._options.az) ],
            VPCZoneIdentifier : [ _utils.resolve(this._options.publicSubnetId) ],
            InstanceId: this._localRef('instance'),
            MinSize: 1,
            MaxSize: 1,
            DesiredCapacity: 1,
            Tags: [
                { Key: 'Name', Value: this._resName('auto-scaling-group'), PropagateAtLaunch: false }
            ]
        }
    };
    this._tags.apply(autoScalingGroup, function(key, value) {
        return {
            Key: key,
            Value: value,
            PropagateAtLaunch: true
        };
    });

    var resources = {};
    resources[this.getResourceKey('securityGroup')] = securityGroup;
    resources[this.getResourceKey('iamInstanceRole')] = iamInstanceRole;
    resources[this.getResourceKey('iamInstanceProfile')] = iamInstanceProfile;
    resources[this.getResourceKey('instance')] = instance;
    resources[this.getResourceKey('autoScalingGroup')] = autoScalingGroup;

    return resources;
};

module.exports = Nat;
