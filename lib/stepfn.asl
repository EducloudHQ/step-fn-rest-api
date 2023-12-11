{
  "Comment": "Amazon state language definition",
  "StartAt": "InitState",
  "States": {
    "InitState": {
      "Type": "Pass",
      "Next": "Request Method"
    },
    "Request Method": {
      "Type" : "Choice",
      "Choices": [
        {
          "Variable": "$.requestContext.httpMethod",
          "StringEquals": "POST",
          "Next": "DynamoDB Create Weather Item"
        },
        {
          "Variable": "$.requestContext.httpMethod",
          "StringEquals": "PUT",
          "Next": "DynamoDB Update Weather Item"
        },
        {
          "Variable": "$.requestContext.httpMethod",
          "StringEquals": "DELETE",
          "Next": "DynamoDB Delete Weather Item"
        },
        {
          "Variable": "$.requestContext.httpMethod",
          "StringEquals": "GET",
          "Next": "DynamoDB Get Weather Item"
        }
      ]
    },
    "DynamoDB Create Weather Item": {
      "Type": "Task",
      "Resource": "arn:aws:states:::dynamodb:putItem",
      "Parameters": {
        "TableName": "weather-table",
        "Item": {
          "id": {
            "S.$": "$.body.id"
          },
          "city": {
            "S.$": "$.body.city"
          }
        }
      },
      "Retry": [
        {
          "ErrorEquals": [
            "States.All"
          ],
          "IntervalSeconds": 1,
          "MaxAttempts": 1
        }
      ],
      "Catch": [{

        "ErrorEquals": [
          "States.All"
        ],
        "Next": "Create Failed"
      }],
      "ResultPath": "$.dynamodbPut",
      "Next": "Create Success"
    },
    "DynamoDB Get Weather Item": {
      "Type": "Task",
      "Resource": "arn:aws:states:::dynamodb:getItem",
      "Parameters": {
        "TableName": "weather-table",
        "Key": {
          "id": {
            "S.$": "$.path.weatherId"
          }
        }
      },
      "Retry": [
        {
          "ErrorEquals": ["States.All"],
          "IntervalSeconds": 1,
          "MaxAttempts": 2
        }
      ],
      "Catch": [{
        "ErrorEquals": ["States.All"],
        "Next": "Get Failed"
      }],
      "Next": "Get Success"
    },

    "DynamoDB Update Weather Item": {
      "Type": "Task",
      "Resource": "arn:aws:states:::dynamodb:updateItem",
      "Parameters": {
        "TableName": "weather-table",
        "Key": {
          "id": {
            "S.$": "$.path.weatherId"
          }
        },
        "UpdateExpression": "set city = :city",
        "ExpressionAttributeValues": {
          ":city": {
            "S.$": "$.body.city"
          }
        },
        "ReturnValues": "UPDATED_NEW"
      },
      "Retry": [
        {
          "ErrorEquals": ["States.All"],
          "IntervalSeconds": 1,
          "MaxAttempts": 2
        }
      ],
      "Catch": [{
        "ErrorEquals": ["States.All"],
        "Next": "Update Failed"
      }],
      "Next": "Update Success"
    },

    "DynamoDB Delete Weather Item": {
      "Type": "Task",
      "Resource": "arn:aws:states:::dynamodb:deleteItem",
      "Parameters": {
        "TableName": "weather-table",
        "Key": {
          "id": {
            "S.$": "$.path.weatherId"
          }
        }
      },
      "Retry": [
        {
          "ErrorEquals": ["States.All"],
          "IntervalSeconds": 1,
          "MaxAttempts": 2
        }
      ],
      "Catch": [{
        "ErrorEquals": ["States.All"],
        "Next": "Delete Failed"
      }],
      "Next": "Delete Success"
    },
    "Create Failed":{
      "Type": "Fail",
      "Error": "Item Create Fail",
      "Cause": "Dynamodb error"
    },
    "Create Success":{
      "Type": "Pass",
      "End": true
    },
    "Get Success":{
      "Type": "Pass",
      "End": true
    },
    "Get Failed":{
      "Type": "Fail",
      "Error": "Item Create Fail",
      "Cause": "Dynamodb error"
    },
    "Delete Success":{
      "Type": "Pass",
      "End": true
    },
    "Delete Failed":{
      "Type": "Fail",
      "Error": "Item Delete Fail",
      "Cause": "Dynamodb error"
    },
    "Update Success":{
      "Type": "Pass",
      "End": true
    },
    "Update Failed":{
      "Type": "Fail",
      "Error": "Item Update Fail",
      "Cause": "Dynamodb error"
    }
  }
}