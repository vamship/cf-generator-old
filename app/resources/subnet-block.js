/* jshint node:true */
'use strict';

var _nodeUtil = require('util');
var _utils = require('../utils/utils');
var ResourceBlock = require('./resource-block');

/**
 * Block that generates the required cloudformation specs for a subnet
 * within the VPC.
 *
 * @class Subnet
 * @constructor
 * @param {String} baseKey The base key for the generated resources
 * @param {String} baseName The base name, used to generate "name" tags
 * @param {Object} options An options object containing a set of key value
 *          pairs that can be used by the block.
 * @param {Object} tags A tags object used to apply global tags to specific
 *          resources
 */
function Subnet(baseKey, baseName, options, tags) {
    Subnet.super_.call(this, baseKey, baseName, options, tags);

    this._resourceKeys = {
        subnet: this._baseKey,
        routeTable: this._baseKey + 'RouteTable',
        addInternetTrafficRoute: this._baseKey + 'AddInternetTrafficRoute',
        attachRouteTable: this._baseKey + 'AttachRouteTable'
    };
}

_nodeUtil.inherits(Subnet, ResourceBlock);

/**
 * Generates a set of resource objects that can be used in the AWS cloud
 * formation block.
 *
 * @return {Array} An array of key value objects that can be added to the
 *          resource map of the cloudformation block.
 */
Subnet.prototype.generate = function() {
    var routeTable = {
        Type: 'AWS::EC2::RouteTable',
        Properties: {
            VpcId: _utils.resolve(this._options.vpcId),
            Tags: [
                { Key: 'Name', Value: this._resName('route-table') }
            ]
        }
    };
    this._tags.apply(routeTable);

    //Don't add internet traffic route if the subnet is private.
    if(!this._options.isPrivate) {
        var addInternetTrafficRoute = {
            Type: 'AWS::EC2::Route',
            Properties: {
                RouteTableId: this._localRef('routeTable'),
                DestinationCidrBlock: '0.0.0.0/0',
                GatewayId: _utils.resolve(this._options.internetGatewayId)
            }
        };
    }

    var subnet = {
        Type: 'AWS::EC2::Subnet',
        Properties: {
            VpcId: _utils.resolve(this._options.vpcId),
            CidrBlock: _utils.resolve(this._options.cidr),
            AvailabilityZone: _utils.resolve(this._options.az),
            Tags: [
                { Key: 'Name', Value: this._resName('') },
                { Key: 'network', Value: this._options.isPrivate? 'private': 'public' }
            ]
        }
    };
    this._tags.apply(subnet);

    var attachRouteTable = {
        Type: 'AWS::EC2::SubnetRouteTableAssociation',
        Properties: {
            SubnetId: this._localRef('subnet'),
            RouteTableId: this._localRef('routeTable')
        }
    };

    var resources = {};
    resources[this.getResourceKey('subnet')] = subnet;
    if(!this._options.isPrivate) {
        resources[this.getResourceKey('addInternetTrafficRoute')] = addInternetTrafficRoute;
    } else {
        delete this._resourceKeys.addInternetTrafficRoute;
    }
    resources[this.getResourceKey('routeTable')] = routeTable;
    resources[this.getResourceKey('attachRouteTable')] = attachRouteTable;

    return resources;
};

module.exports = Subnet;
