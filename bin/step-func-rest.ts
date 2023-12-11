#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StepFuncRestStack } from '../lib/step-func-rest-stack';

const app = new cdk.App();
new StepFuncRestStack(app, 'StepFuncRestStack', {
  env: { account: '<accountNumber>', region: '<Region>' },
});