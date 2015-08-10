/* jshint node:true */
'use strict';

var _nodeUtil = require('util');
var _utils = require('../utils/utils');
var ResourceBlock = require('./resource-block');

/**
 * Block that generates the required cloudformation specs for an elastic load
 * balancer instance inside a VPC. This block also generates a unique security
 * group for the load balancer.
 *
 * @class WebElb
 * @constructor
 * @param {String} baseKey The base key for the generated resources
 * @param {String} baseName The base name, used to generate "name" tags
 * @param {Object} options An options object containing a set of key value
 *          pairs that can be used by the block.
 * @param {Object} tags A tags object used to apply global tags to specific
 *          resources
 */
function WebElb(baseKey, baseName, options, tags) {
    WebElb.super_.call(this, baseKey, baseName, options, tags);

    this._resourceKeys = {
        elb: this._baseKey,
        securityGroup: this._baseKey + 'SecurityGroup'
    };
}

_nodeUtil.inherits(WebElb, ResourceBlock);

/**
 * Generates a set of resource objects that can be used in the AWS cloud
 * formation block.
 *
 * @return {Array} An array of key value objects that can be added to the
 *          resource map of the cloudformation block.
 */
WebElb.prototype.generate = function() {
    var securityGroup = {
        Type: 'AWS::EC2::SecurityGroup',
        Properties: {
            GroupDescription: 'Security rules for web ELB instances',
            VpcId: _utils.resolve(this._options.vpcId),
            SecurityGroupIngress: [ ],
            SecurityGroupEgress : [ ],
            Tags: [
                { Key: 'Name', Value: this._resName('security-group') }
            ]
        }
    };
    this._tags.apply(securityGroup);

    var elb = {
        Type: 'AWS::ElasticLoadBalancing::LoadBalancer',
        Properties: {
            Subnets : _utils.resolve(this._options.subnets),
            Scheme: this._options.isPrivate? 'internal':'internet-facing',
            Listeners: [ ],
            HealthCheck: {
                Target: 'HTTP:' +
                        _utils.resolve(this._options.instancePort) +
                        _utils.resolve(this._options.healthCheckPath),
                HealthyThreshold: 3,
                UnhealthyThreshold: 5,
                Interval: 30,
                Timeout: 5
            },
            SecurityGroups: [ this._localRef('securityGroup') ],
            ConnectionDrainingPolicy: {
                Enabled: true
            },
            Tags: [
                { Key: 'Name', Value: this._resName('') }
            ]
        }
    };

    if(!this._options.disableHttp) {
        securityGroup.Properties.SecurityGroupIngress.push({
            IpProtocol: 'tcp',
            FromPort: '80',
            ToPort: '80',
            CidrIp : '0.0.0.0/0'
        });
        elb.Properties.Listeners.push({
            LoadBalancerPort: 80,
            InstancePort: _utils.resolve(this._options.instancePort),
            Protocol: 'HTTP',
            InstanceProtocol: 'HTTP'
        });
    }

    if(this._options.sslCertificateId) {
        securityGroup.Properties.SecurityGroupIngress.push({
            IpProtocol: 'tcp',
            FromPort: '443',
            ToPort: '443',
            CidrIp : '0.0.0.0/0'
        });
        elb.Properties.Listeners.push({
            LoadBalancerPort: 443,
            InstancePort: _utils.resolve(this._options.instancePort),
            Protocol: 'HTTPS',
            InstanceProtocol: 'HTTP',
            SSLCertificateId: _utils.resolve(this._options.sslCertificateId)
        });
    }

    this._tags.apply(elb);

    var resources = {};
    resources[this.getResourceKey('securityGroup')] = securityGroup;
    resources[this.getResourceKey('elb')] = elb;

    return resources;
};

module.exports = WebElb;
