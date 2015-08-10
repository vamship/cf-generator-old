/* jshint node:true */
'use strict';

module.exports = RDS;

var _nodeUtil = require('util');
var _utils = require('../utils/utils');
var Ref = require('../utils/ref');


function RDS(baseKey, baseName, options, tags) {
    RDS.super_.call(this, baseKey, baseName, options, tags);

    this._resourceKeys = {
        db: this._baseKey + 'DBInstance',
        securityGroup: this._baseKey + 'DBSecurityGroup',
        subnetGroup: this._baseKey + 'AddNatTrafficRoute'
    };
}

RDS.prototype.generate = function () {
    var options = this.options;

    var secGroup = this.generateSecGroup(options);
    var subnetGroup = this.generateSubnetGroup(options);
    var db = this.generateDB(options);

    var resources = {};
    resources[this.getResourceKey('securityGroup')] = secGroup;
    resources[this.getResourceKey('subnetGroup')] = subnetGroup;
    resources[this.getResourceKey('db')] = db;

    return resources;
};

RDS.prototype.generateDB = function (options) {

    var database = {
        "Type": "AWS::RDS::DBInstance",
        "Properties": {
            "DBName": _utils.resolve(this._options.dbusername),
            "Engine": "MySQL",
            "MasterUsername": _utils.resolve(this._options.dbusername),
            "DBInstanceClass": _utils.resolve(this._options.instancetype),
            "DBSecurityGroups": this._localRef('securityGroup'),
            "AllocatedStorage": _utils.resolve(this._options.storage),
            "MasterUserPassword": _utils.resolve(this._options.dbpassword),
            "DBSubnetGroupName": this._localRef('subnetGroup'),
            "MultiAZ": true
        }
    };

    this._tags.apply(database);

    return database;
};

RDS.prototype.generateSecurityGroup = function (options) {

    var secGroup = {
        "Type": "AWS::EC2::SecurityGroup",
        "Properties": {
            "GroupDescription": "Enable SQL database access on port 3306",
            "SecurityGroupIngress": [{
                "IpProtocol": "tcp",
                "FromPort": "3306",
                "ToPort": "3306",
                "CidrIp": "0.0.0.0/0"
            }]
        }
    };

    this._tags.apply(secGroup);

    return secGroup;
};

RDS.prototype.generateSubnetGroup = function (options) {

    var subnetGroup = {
        "Type": "AWS::RDS::DBSubnetGroup",
        "Properties": {
            "DBSubnetGroupDescription": 'RDS Subnet Group for ' + this._baseKey,
            "SubnetIds": this._options.subnetIds.map(function (subnetId) {
                return _utils.resolve(subnetId);
            }),
        }
    };
    this._tags.apply(subnetGroup);

    return subnetGroup;
};