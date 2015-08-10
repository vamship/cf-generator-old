/* jshint node:true */
'use strict';

var VpcBuilder = require('./builders/vpc-builder');
var SandboxBuilder = require('./builders/sandbox-instance-builder');

var _baseName = 'wc-dev';
var _tags = {
    project: 'witchcraft',
    environment: 'development',
    team: 'cloud'
};

var vpcTemplate = new VpcBuilder({
    name: _baseName + '-vpc',
    description: 'High availability VPC infrastructure for the witchcraft project',
    cidr: '10.0.0.0/16',
    subnets: [ {
        name: 'A',
        az: 'us-east-1a',
        publicCidr: '10.0.0.0/22',
        privateCidr: '10.0.4.0/22',
        natImageId:  'ami-184dc970',
        natInstanceType: 'm3.medium'
    }, {
        name: 'B',
        az: 'us-east-1b',
        publicCidr: '10.0.8.0/22',
        privateCidr: '10.0.12.0/22',
        natImageId:  'ami-184dc970',
        natInstanceType: 'm3.medium'
    }, {
        name: 'D',
        az: 'us-east-1d',
        publicCidr: '10.0.16.0/22',
        privateCidr: '10.0.20.0/22',
        natImageId:  'ami-184dc970',
        natInstanceType: 'm3.medium'
    }],
    tags: _tags
});
var result = vpcTemplate.build();
console.log(result);
process.exit(0);

var vpcId = 'vpc-a7bc58c3';
var sshKeyName = 'cloud-master-key';

var sandboxTemplate = new SandboxBuilder({
    name: _baseName + '-sandbox',
    description: 'Sandbox instances on a VPC for testing purposes',
    instances: [ {
        name: 'PublicSubnetA',
        vpcId: vpcId,
        sshKeyName: sshKeyName,
        subnetId: 'subnet-4439741d',
        isPublic: true
    }, {
        name: 'PrivateSubnetA',
        vpcId: vpcId,
        sshKeyName: sshKeyName,
        subnetId: 'subnet-4539741c',
        isPublic: false
    }, {
        name: 'PublicSubnetB',
        vpcId: vpcId,
        sshKeyName: sshKeyName,
        subnetId: 'subnet-5868422f',
        isPublic: true
    }, {
        name: 'PrivateSubnetB',
        vpcId: vpcId,
        sshKeyName: sshKeyName,
        subnetId: 'subnet-47684230',
        isPublic: false
    } ],
    tags: _tags
});

result = sandboxTemplate.build();

console.log(result);

