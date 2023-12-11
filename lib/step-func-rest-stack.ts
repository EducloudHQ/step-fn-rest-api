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

    const stateMachineARN: cdk.Arn = stateMachine.stateMachineArn;

    const RequestTemplateJson: string =
      '#set($inputString = \'\')\r\n#set($includeHeaders = true)\r\n#set($includeQueryString = true)\r\n#set($includePath = true)\r\n#set($includeAuthorizer = false)\r\n#set($allParams = $input.params())\r\n#set($inputRoot=\'"httpMethod" :"\'+ $context.httpMethod+\'"\')\r\n{\r\n    "stateMachineArn": "' +
      stateMachineARN +
      '",\r\n\r\n    #set($inputString = "$inputString,@@body@@: $input.body")\r\n\r\n    #if ($includeHeaders)\r\n        #set($inputString = "$inputString, @@header@@:{")\r\n        #foreach($paramName in $allParams.header.keySet())\r\n            #set($inputString = "$inputString @@$paramName@@: @@$util.escapeJavaScript($allParams.header.get($paramName))@@")\r\n            #if($foreach.hasNext)\r\n                #set($inputString = "$inputString,")\r\n            #end\r\n        #end\r\n        #set($inputString = "$inputString },$inputRoot")\r\n\r\n        \r\n    #end\r\n\r\n    #if ($includeQueryString)\r\n        #set($inputString = "$inputString, @@querystring@@:{")\r\n        #foreach($paramName in $allParams.querystring.keySet())\r\n            #set($inputString = "$inputString @@$paramName@@: @@$util.escapeJavaScript($allParams.querystring.get($paramName))@@")\r\n            #if($foreach.hasNext)\r\n                #set($inputString = "$inputString,")\r\n            #end\r\n        #end\r\n        #set($inputString = "$inputString }")\r\n    #end\r\n\r\n    #if ($includePath)\r\n        #set($inputString = "$inputString, @@path@@:{")\r\n        #foreach($paramName in $allParams.path.keySet())\r\n            #set($inputString = "$inputString @@$paramName@@: @@$util.escapeJavaScript($allParams.path.get($paramName))@@")\r\n            #if($foreach.hasNext)\r\n                #set($inputString = "$inputString,")\r\n            #end\r\n        #end\r\n        #set($inputString = "$inputString }")\r\n    #end\r\n    \r\n    #if ($includeAuthorizer)\r\n        #set($inputString = "$inputString, @@authorizer@@:{")\r\n        #foreach($paramName in $context.authorizer.keySet())\r\n            #set($inputString = "$inputString @@$paramName@@: @@$util.escapeJavaScript($context.authorizer.get($paramName))@@")\r\n            #if($foreach.hasNext)\r\n                #set($inputString = "$inputString,")\r\n            #end\r\n        #end\r\n        #set($inputString = "$inputString }")\r\n    #end\r\n\r\n    #set($requestContext = "")\r\n    ## Check if the request context should be included as part of the execution input\r\n    #if($requestContext && !$requestContext.empty)\r\n        #set($inputString = "$inputString,")\r\n        #set($inputString = "$inputString @@requestContext@@: $requestContext")\r\n    #end\r\n\r\n    #set($inputString = "$inputString}")\r\n    #set($inputString = $inputString.replaceAll("@@",\'"\'))\r\n    #set($len = $inputString.length() - 1)\r\n    "input": "{$util.escapeJavaScript($inputString.substring(1,$len)).replaceAll("\\\\\'","\'")}"\r\n}';

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
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        requestTemplates: {
          "application/json": RequestTemplateJson,
        },
      })
    );
    const weatherIdRoute: apigateway.Resource = weather.addResource('{weatherId}')

    //Get weather item
    weatherIdRoute.addMethod(
      "GET",
      apigateway.StepFunctionsIntegration.startExecution(stateMachine, {
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        requestTemplates: {
          "application/json": RequestTemplateJson,
        },
      })
    );
    
    // Update weather item
    weatherIdRoute.addMethod(
      "PUT",
      apigateway.StepFunctionsIntegration.startExecution(stateMachine, {
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        requestTemplates: {
          "application/json": RequestTemplateJson,
        },
      })
    );

    // Delete weather item
    weatherIdRoute.addMethod(
      "DELETE",
      apigateway.StepFunctionsIntegration.startExecution(stateMachine, {
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        requestTemplates: {
          "application/json": RequestTemplateJson,
        },
      })
    );

    // List weather
    weather.addMethod(
      "GET",
      apigateway.StepFunctionsIntegration.startExecution(stateMachine, {
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        requestTemplates: {
          "application/json": RequestTemplateJson,
        },
      })
    );
  }
}
