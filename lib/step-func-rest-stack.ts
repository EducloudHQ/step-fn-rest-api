import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as logs from "aws-cdk-lib/aws-logs";
import * as fs from "fs";

export class StepFuncRestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const logGroup: logs.LogGroup = new logs.LogGroup(this, "StepFunction");

    const table: dynamodb.Table = new dynamodb.Table(this, "weather-table", {
      tableName: "weather-table",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const file: Buffer = fs.readFileSync(__dirname + "/stepfn.asl");

    const stateMachine: sfn.StateMachine = new sfn.StateMachine(this, "WeatherApiStateMachine", {
      definitionBody: sfn.StringDefinitionBody.fromString(file.toString()),
      stateMachineType: sfn.StateMachineType.EXPRESS,
      stateMachineName: "WeatherApiStateMachine",
      tracingEnabled: true,
      logs: {
        destination: logGroup,
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
      },
      timeout: cdk.Duration.seconds(30),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    table.grantReadWriteData(stateMachine);

    const restApi: apigateway.RestApi = new apigateway.RestApi(this, "weather-api", {
      restApiName: "weather-api",
      deployOptions: {
        stageName: "dev",
        dataTraceEnabled: true,
        tracingEnabled: true,
        metricsEnabled: true,
      },
    });

    restApi.root.addMethod("ANY");
    const weather: apigateway.Resource = restApi.root.addResource("weather");
    // Create weather item
    weather.addMethod(
      "POST",
      apigateway.StepFunctionsIntegration.startExecution(stateMachine, {
        requestContext: {
          httpMethod: true,
        },
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        
      })
    );
    const weatherIdRoute: apigateway.Resource = weather.addResource('{weatherId}')

    //Get weather item
    weatherIdRoute.addMethod(
      "GET",
      apigateway.StepFunctionsIntegration.startExecution(stateMachine, {
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        requestContext: {
          httpMethod: true,
        },
      })
    );
    
    // Update weather item
    weatherIdRoute.addMethod(
      "PUT",
      apigateway.StepFunctionsIntegration.startExecution(stateMachine, {
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        requestContext: {
          httpMethod: true,
        },
      })
    );

    // Delete weather item
    weatherIdRoute.addMethod(
      "DELETE",
      apigateway.StepFunctionsIntegration.startExecution(stateMachine, {
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        requestContext: {
          httpMethod: true,
        },
      })
    );

    // List weather
    weather.addMethod(
      "GET",
      apigateway.StepFunctionsIntegration.startExecution(stateMachine, {
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        requestContext: {
          httpMethod: true,
        },
      })
    );
  }
}
