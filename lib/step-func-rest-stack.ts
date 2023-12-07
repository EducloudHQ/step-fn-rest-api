import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as logs from "aws-cdk-lib/aws-logs";
import * as fs from "fs";

export class StepFuncRestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const logGroup = new logs.LogGroup(this, "StepFunction");

    const file = fs.readFileSync(__dirname + "/stepfn.asl");
    const stateMachine = new sfn.StateMachine(this, "MyStateMachine", {
      definitionBody: sfn.StringDefinitionBody.fromString(file.toString()),
      stateMachineType: sfn.StateMachineType.EXPRESS,
      stateMachineName: "MyStateMachine",
      tracingEnabled: true,
      logs: {
        destination: logGroup,
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
      },
      timeout: cdk.Duration.seconds(30),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new apigateway.StepFunctionsRestApi(
      this,
      "StepFunctionsRestApi",
      { stateMachine: stateMachine }
    );
  }
}
