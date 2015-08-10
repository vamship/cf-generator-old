/* jshint node:true */
'use strict';

var TemplateGenerator = require('./template-generator');
var VpcBlock = require('./resources/vpc-block');
var SubnetBlock = require('./resources/subnet-block');
var NatBlock = require('./resources/nat-block');
var WebElbBlock = require('./resources/web-elb-block');
var OpsWorksStackBlock = require('./resources/opsworks-stack-block');
var OpsWorksNodeLayerBlock = require('./resources/opsworks-node-layer-block');
var OpsWorksInstanceBlock = require('./resources/opsworks-instance-block');

var Tags = require('./utils/tags');
var Ref = require('./utils/ref');

var _accessKeyId = '';
var _secretAccessKey = '';
var _baseName = 's4';
var _tags = new Tags({
    project: 'bassomatic',
    environment: 'sandbox',
    team: 'cloud'
});

function resName(name) {
    return _baseName + '-' + name;
}

var defaultVpc = new VpcBlock('Vpc', resName('vpc'), {
    cidr: '10.0.0.0/16'
}, _tags);

// Subnet A = public, private, NAT
var publicSubnetA = new SubnetBlock('PublicSubnetA', resName('public-subnet-a'), {
    isPrivate: false,
    cidr: '10.0.0.0/22',
    az: 'us-east-1a',
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    internetGatewayId: new Ref(defaultVpc.getResourceKey('internetGateway'))
}, _tags);

var privateSubnetA = new SubnetBlock('PrivateSubnetA', resName('private-subnet-a'), {
    isPrivate: true,
    cidr: '10.0.4.0/22',
    az: 'us-east-1a',
    vpcId: new Ref(defaultVpc.getResourceKey('vpc'))
}, _tags);

var natSubnetA = new NatBlock('NatSubnetA', resName('nat-subnet-a'), {
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    imageId:  'ami-184dc970',
    instanceType: 'm3.medium',
    publicSubnetId: new Ref(publicSubnetA.getResourceKey('subnet')),
    privateSubnetRouteTableId: new Ref(privateSubnetA.getResourceKey('routeTable'))
}, _tags);

// Subnet B = public, private, NAT
var publicSubnetB = new SubnetBlock('PublicSubnetB', resName('public-subnet-b'), {
    isPrivate: false,
    cidr: '10.0.8.0/22',
    az: 'us-east-1b',
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    internetGatewayId: new Ref(defaultVpc.getResourceKey('internetGateway'))
}, _tags);

var privateSubnetB = new SubnetBlock('PrivateSubnetB', resName('private-subnet-b'), {
    isPrivate: true,
    cidr: '10.0.12.0/22',
    az: 'us-east-1b',
    vpcId: new Ref(defaultVpc.getResourceKey('vpc'))
}, _tags);

var natSubnetB = new NatBlock('NatSubnetB', resName('nat-subnet-a'), {
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    imageId:  'ami-184dc970',
    instanceType: 'm3.medium',
    publicSubnetId: new Ref(publicSubnetB.getResourceKey('subnet')),
    privateSubnetRouteTableId: new Ref(privateSubnetB.getResourceKey('routeTable'))
}, _tags);

// Front end 
var feElb = new WebElbBlock('FeElb', resName('fe-elb'), {
    isPrivate: false,
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    subnets: [
        new Ref(publicSubnetA.getResourceKey('subnet')),
        new Ref(publicSubnetB.getResourceKey('subnet'))
    ],
    instancePort: 80,
    healthCheckPath: '/__status'
}, _tags);

// DS
var dsElb = new WebElbBlock('DsElb', resName('ds-elb'), {
    isPrivate: true,
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    subnets: [
        new Ref(privateSubnetA.getResourceKey('subnet')),
        new Ref(privateSubnetB.getResourceKey('subnet'))
    ],
    instancePort: 80,
    healthCheckPath: '/__status'
}, _tags);

// Worker
var awElb = new WebElbBlock('AwElb', resName('aw-elb'), {
    isPrivate: true,
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    subnets: [
        new Ref(privateSubnetA.getResourceKey('subnet')),
        new Ref(privateSubnetB.getResourceKey('subnet'))
    ],
    instancePort: 80,
    healthCheckPath: '/__status'
}, _tags);


// Opsworks stack
var opsWorksStack = new OpsWorksStackBlock('OpsWorksStack', resName('stack'), {
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    defaultSubnetId: new Ref(privateSubnetA.getResourceKey('subnet')),
    serviceRole: 'aws-opsworks-service-role',
    defaultInstanceRole: 'aws-opsworks-ec2-role',
    customCookbooksUrl: 'https://gitlab.lyricsemiconductor.com/platformdevops/opsworks-cookbooks.git'
}, _tags);

// Fe Layer
var feLayer = new OpsWorksNodeLayerBlock('OpsWorksFeLayer', resName('fe-layer'), {
    layerShortName: 's4-fe',
    stackId: new Ref(opsWorksStack.getResourceKey('stack')),
    elbName: new Ref(feElb.getResourceKey('elb')),

    appName: 's4-fe',
    appUrl: 'https://s3.amazonaws.com/cloud-team-data/deploy/nodejs-webapp/node-app-template-cjs_0.1.0.zip',
    appUserName: _accessKeyId,
    appPassword: _secretAccessKey,
    appVersion: 'v1.0.0'
}, _tags);

var feCoreInstances = new OpsWorksInstanceBlock('OpsWorksFeCoreInstance', resName('fe-core-instance'), {
    instanceCount: 2,
    instanceType: 'm3.medium',
    os: 'Amazon Linux 2015.03',
    subnetIds: [
        new Ref(privateSubnetA.getResourceKey('subnet')),
        new Ref(privateSubnetB.getResourceKey('subnet'))
    ],
    stackId: new Ref(opsWorksStack.getResourceKey('stack')),
    layerIds: [
        new Ref(feLayer.getResourceKey('layer'))
    ]

    ,sshKeyName: 'cloud-master-key'
}, _tags);

// Ds Layer
var dsLayer = new OpsWorksNodeLayerBlock('OpsWorksDsLayer', resName('ds-layer'), {
    layerShortName: 's4-ds',
    stackId: new Ref(opsWorksStack.getResourceKey('stack')),
    elbName: new Ref(dsElb.getResourceKey('elb')),

    appName: 's4-ds',
    appUrl: 'https://s3.amazonaws.com/cloud-team-data/deploy/nodejs-webapp/node-app-template-cjs_0.1.0.zip',
    appUserName: _accessKeyId,
    appPassword: _secretAccessKey,
    appVersion: 'v1.0.0'
}, _tags);

var dsCoreInstances = new OpsWorksInstanceBlock('OpsWorksDsCoreInstance', resName('ds-core-instance'), {
    instanceCount: 2,
    instanceType: 'm3.medium',
    os: 'Amazon Linux 2015.03',
    subnetIds: [
        new Ref(privateSubnetA.getResourceKey('subnet')),
        new Ref(privateSubnetB.getResourceKey('subnet'))
    ],
    stackId: new Ref(opsWorksStack.getResourceKey('stack')),
    layerIds: [
        new Ref(dsLayer.getResourceKey('layer'))
    ]

    ,sshKeyName: 'cloud-master-key'
}, _tags);

// Aw Layer
var awLayer = new OpsWorksNodeLayerBlock('OpsWorksAwLayer', resName('aw-layer'), {
    layerShortName: 's4-aw',
    stackId: new Ref(opsWorksStack.getResourceKey('stack')),
    elbName: new Ref(awElb.getResourceKey('elb')),

    appName: 's4-aw',
    appUrl: 'https://s3.amazonaws.com/cloud-team-data/deploy/nodejs-webapp/node-app-template-cjs_0.1.0.zip',
    appUserName: _accessKeyId,
    appPassword: _secretAccessKey,
    appVersion: 'v1.0.0'
}, _tags);

var awCoreInstances = new OpsWorksInstanceBlock('OpsWorksAwCoreInstance', resName('aw-core-instance'), {
    instanceCount: 2,
    instanceType: 'm3.medium',
    os: 'Amazon Linux 2015.03',
    subnetIds: [
        new Ref(privateSubnetA.getResourceKey('subnet')),
        new Ref(privateSubnetB.getResourceKey('subnet'))
    ],
    stackId: new Ref(opsWorksStack.getResourceKey('stack')),
    layerIds: [
        new Ref(awLayer.getResourceKey('layer'))
    ]

    ,sshKeyName: 'cloud-master-key'
}, _tags);

// ============================================================================
var template = new TemplateGenerator();

template.setDescription('High availability infrastructure for the s4 (bassomatic) project');
template.addResource(defaultVpc);

template.addResource(publicSubnetA);
template.addResource(privateSubnetA);
template.addResource(natSubnetA);

template.addResource(publicSubnetB);
template.addResource(privateSubnetB);
template.addResource(natSubnetB);

template.addResource(feElb);
template.addResource(dsElb);
template.addResource(awElb);

template.addResource(opsWorksStack);

template.addResource(feLayer);
template.addResource(feCoreInstances);

template.addResource(dsLayer);
template.addResource(dsCoreInstances);

template.addResource(awLayer);
template.addResource(awCoreInstances);

var result = template.generate();
console.log(result);
