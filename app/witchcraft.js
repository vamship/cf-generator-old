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
var _baseName = 'wc-development';
var _tags = new Tags({
    project: 'witchcraft',
    environment: 'development',
    team: 'cloud'
});

function resName(name) {
    return _baseName + '-' + name;
}

var defaultVpc = new VpcBlock('Vpc', resName('vpc'), {
    cidr: '10.0.0.0/16',
    enableDnsHostNames: true,
    enableDnsSupport: true
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

var natSubnetB = new NatBlock('NatSubnetB', resName('nat-subnet-b'), {
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    imageId:  'ami-184dc970',
    instanceType: 'm3.medium',
    publicSubnetId: new Ref(publicSubnetB.getResourceKey('subnet')),
    privateSubnetRouteTableId: new Ref(privateSubnetB.getResourceKey('routeTable'))
}, _tags);

// Subnet D = public, private, NAT
var publicSubnetD = new SubnetBlock('publicSubnetD', resName('public-subnet-d'), {
    isPrivate: false,
    cidr: '10.0.16.0/22',
    az: 'us-east-1d',
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    internetGatewayId: new Ref(defaultVpc.getResourceKey('internetGateway'))
}, _tags);

var privateSubnetD = new SubnetBlock('PrivateSubnetD', resName('private-subnet-d'), {
    isPrivate: true,
    cidr: '10.0.20.0/22',
    az: 'us-east-1d',
    vpcId: new Ref(defaultVpc.getResourceKey('vpc'))
}, _tags);

var natSubnetD = new NatBlock('NatSubnetD', resName('nat-subnet-d'), {
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    imageId:  'ami-184dc970',
    instanceType: 'm3.medium',
    publicSubnetId: new Ref(publicSubnetD.getResourceKey('subnet')),
    privateSubnetRouteTableId: new Ref(privateSubnetD.getResourceKey('routeTable'))
}, _tags);

// Dashboard
var dashboardElb = new WebElbBlock('DashboardElb', resName('dashboard-elb'), {
    isPrivate: false,
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    subnets: [
        new Ref(publicSubnetA.getResourceKey('subnet')),
        new Ref(publicSubnetB.getResourceKey('subnet')),
        new Ref(publicSubnetD.getResourceKey('subnet'))
    ],
    sslCertificateId: 'arn:aws:iam::986433031334:server-certificate/star_analoggarage_com',
    disableHttp: true,
    instancePort: 80,
    healthCheckPath: '/__status'
}, _tags);

// API Layer
var apiElb = new WebElbBlock('ApiElb', resName('api-elb'), {
    isPrivate: false,
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    subnets: [
        new Ref(publicSubnetA.getResourceKey('subnet')),
        new Ref(publicSubnetB.getResourceKey('subnet')),
        new Ref(publicSubnetD.getResourceKey('subnet'))
    ],
    sslCertificateId: 'arn:aws:iam::986433031334:server-certificate/star_analoggarage_com',
    disableHttp: true,
    instancePort: 80,
    healthCheckPath: '/__status'
}, _tags);


// Dashboard Layer
var dashboardStack = new OpsWorksStackBlock('DashboardOpsWorksStack', resName('dashboard'), {
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    defaultSubnetId: new Ref(privateSubnetA.getResourceKey('subnet')),
    serviceRole: 'aws-opsworks-service-role',
    defaultInstanceRole: 'aws-opsworks-ec2-role',
    customCookbooksUrl: 'https://gitlab.lyricsemiconductor.com/platformdevops/opsworks-cookbooks.git'
}, _tags);

var dashboardLayer = new OpsWorksNodeLayerBlock('OpsWorksDashboardLayer', resName('app-layer'), {
    layerShortName: 'wc-dashboard',
    stackId: new Ref(dashboardStack.getResourceKey('stack')),
    elbName: new Ref(dashboardElb.getResourceKey('elb')),

    appName: 'wc-dashboard',
    appUrl: 'https://s3.amazonaws.com/cloud-team-data/deploy/wc-dashboard/app.zip',
    appUserName: _accessKeyId,
    appPassword: _secretAccessKey,
    appVersion: 'v1.0.0'
}, _tags);

var dashboardCoreInstances = new OpsWorksInstanceBlock('OpsWorksDashboardCoreInstance', resName('dashboard-core-instance'), {
    instanceCount: 3,
    instanceType: 'm3.medium',
    os: 'Amazon Linux 2015.03',
    subnetIds: [
        new Ref(privateSubnetA.getResourceKey('subnet')),
        new Ref(privateSubnetB.getResourceKey('subnet')),
        new Ref(privateSubnetD.getResourceKey('subnet'))
    ],
    stackId: new Ref(dashboardStack.getResourceKey('stack')),
    layerIds: [
        new Ref(dashboardLayer.getResourceKey('layer'))
    ]

    ,sshKeyName: 'cloud-master-key'
}, _tags);

// Api Layer
var apiStack = new OpsWorksStackBlock('ApiOpsWorksStack', resName('api'), {
    vpcId: new Ref(defaultVpc.getResourceKey('vpc')),
    defaultSubnetId: new Ref(privateSubnetA.getResourceKey('subnet')),
    serviceRole: 'aws-opsworks-service-role',
    defaultInstanceRole: 'aws-opsworks-ec2-role',
    customCookbooksUrl: 'https://gitlab.lyricsemiconductor.com/platformdevops/s4-cookbooks.git'
}, _tags);

var apiLayer = new OpsWorksNodeLayerBlock('OpsWorksApiLayer', resName('api-layer'), {
    layerShortName: 'wc-api',
    stackId: new Ref(apiStack.getResourceKey('stack')),
    elbName: new Ref(apiElb.getResourceKey('elb')),

    appName: 'wc-api',
    appUrl: 'https://s3.amazonaws.com/cloud-team-data/deploy/wc-api/app.zip',
    appUserName: _accessKeyId,
    appPassword: _secretAccessKey,
    appVersion: 'v1.0.0'
}, _tags);

var apiCoreInstances = new OpsWorksInstanceBlock('OpsWorksApiCoreInstance', resName('api-core-instance'), {
    instanceCount: 3,
    instanceType: 'm3.medium',
    os: 'Amazon Linux 2015.03',
    subnetIds: [
        new Ref(privateSubnetA.getResourceKey('subnet')),
        new Ref(privateSubnetB.getResourceKey('subnet')),
        new Ref(privateSubnetD.getResourceKey('subnet'))
    ],
    stackId: new Ref(apiStack.getResourceKey('stack')),
    layerIds: [
        new Ref(apiLayer.getResourceKey('layer'))
    ]

    ,sshKeyName: 'cloud-master-key'
}, _tags);

// ============================================================================
var template = new TemplateGenerator();

template.setDescription('High availability infrastructure for the witchcraft (iot) project');
template.addResource(defaultVpc);

template.addResource(publicSubnetA);
template.addResource(privateSubnetA);
template.addResource(natSubnetA);

template.addResource(publicSubnetB);
template.addResource(privateSubnetB);
template.addResource(natSubnetB);

template.addResource(publicSubnetD);
template.addResource(privateSubnetD);
template.addResource(natSubnetD);

template.addResource(dashboardElb);
template.addResource(apiElb);

template.addResource(dashboardStack);
template.addResource(dashboardLayer);
template.addResource(dashboardCoreInstances);

template.addResource(apiStack);
template.addResource(apiLayer);
template.addResource(apiCoreInstances);

var result = template.generate();
console.log(result);
