'use strict';

var _nodeUtil = require('util');
var _clone = require('clone');
var Ref = require('../utils/ref');

var Builder= require('./builder');
var VpcBlock = require('../resources/vpc-block');
var SubnetBlock = require('../resources/subnet-block');
var NatBlock = require('../resources/nat-block');

/**
 * Builder for VPC templates. Generates public and private subnets across
 * multiple AZs. It also creates a high availability NAT instance for each
 * subnet.
 *
 * @class VpcBuilder
 * @constructor
 * @param {Options} options An options hash that define different
 *          parameters of the VPC
 */
function VpcBuilder(options) {
    if(!options || typeof options !== 'object') {
        throw new Error('Invalid options object specified (arg #1)');
    }

    VpcBuilder.super_.call(this, options.name, options.description, options.tags);
    if(typeof options.cidr !== 'string' || options.cidr.length <= 0) {
        throw new Error('Invalid CIDR block specified for vpc (options.cidr)');
    }
    if(!(options.subnets instanceof Array) || options.subnets.length <= 0) {
        throw new Error('At least one subnet must be specified for the vpc (options.subnets)');
    }

    this._cidr = options.cidr;
    this._subnets = _clone(options.subnets);
    this._enableDnsSupport = (typeof options.enableDnsSupport !== 'undefined')? options.enableDnsSupport:true;
    this._enableDnsHostNames = !!options.enableDnsSupport;
}

_nodeUtil.inherits(VpcBuilder, Builder);

/**
 * @class VpcBuilder
 * @method _addResources
 * @protected
 */
VpcBuilder.prototype._addResources = function(template, outputs) {
    var blocks = [];

    var vpc = new VpcBlock('Vpc', this._resName(''), {
        cidr: this._cidr,
        enableDnsSupport: this._enableDnsSupport,
        enableDnsHostNames: this._enableDnsHostNames
    }, this._tags);
    blocks.push(vpc);
    outputs.Vpc = {
        description: 'Vpc id',
        value: new Ref(vpc.getResourceKey('vpc'))
    };

    this._subnets.forEach(function(subnet) {
        var suffix = 'Subnet' + subnet.name;
        var pubSubnetName = 'Public' + suffix;
        var priSubnetName = 'Private' + suffix;
        var natName = 'Nat' +  suffix;

        var publicSubnet;
        var privateSubnet;

        var publicSubnet = new SubnetBlock(pubSubnetName, this._resName(pubSubnetName), {
            isPrivate: false,
            cidr: subnet.publicCidr,
            az: subnet.az,
            vpcId: new Ref(vpc.getResourceKey('vpc')),
            internetGatewayId: new Ref(vpc.getResourceKey('internetGateway'))
        }, this._tags);

        var privateSubnet = new SubnetBlock(priSubnetName, this._resName(priSubnetName), {
            isPrivate: true,
            cidr: subnet.privateCidr,
            az: subnet.az,
            vpcId: new Ref(vpc.getResourceKey('vpc'))
        }, this._tags);

        var nat = new NatBlock(natName, this._resName(natName), {
            vpcId: new Ref(vpc.getResourceKey('vpc')),
            imageId: subnet.natImageId,
            instanceType: subnet.natInstanceType,
            publicSubnetId: new Ref(publicSubnet.getResourceKey('subnet')),
            privateSubnetRouteTableId: new Ref(privateSubnet.getResourceKey('routeTable')),

            az: subnet.az
        }, this._tags);

        blocks.push(publicSubnet);
        blocks.push(privateSubnet);
        blocks.push(nat);

        outputs[pubSubnetName] = {
            description: 'Subnet id for ' + pubSubnetName,
            value: new Ref(publicSubnet.getResourceKey('subnet'))
        };

        outputs[priSubnetName] = {
            description: 'Subnet id for ' + priSubnetName,
            value: new Ref(privateSubnet.getResourceKey('subnet'))
        };
    }.bind(this));

    blocks.forEach(function(block) {
        template.addResource(block);
    });
};

module.exports = VpcBuilder;
