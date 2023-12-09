{
  "Comment": "Amazon state language definition",
  "StartAt": "InitState",
  "States": {
    "InitState": {
      "Type": "Pass",
      "Next": "LevelState"
    },
    "LevelState": {
      "Type" : "Choice",
      "Choices": [
        {
          "Variable": "$.httpMethod",
          "StringEquals": "POST",
          "Next": "DynamoDB Create Weather Item"
        },
        {
          "Variable": "$.httpMethod",
          "StringEquals": "PUT",
          "Next": "DynamoDB Update Weather Item"
        },
        {
          "Variable": "$.httpMethod",
          "StringEquals": "DELETE",
          "Next": "DynamoDB Delete Weather Item"
        },
        {
          "Variable": "$.httpMethod",
          "StringEquals": "GET",
          "Next": "DynamoDB Get Weather Item"
        }
      ],
      "Default": "Default"
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
        "Next": "Item fail To Create"
      }],
      "ResultPath": "$.dynamodbPut",
      "Next": "Item Created"
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
        "Next": "Item Not Found"
      }],
      "ResultPath": "$.GetStore",
      "Next": "Item Found"
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
        "Next": "Item Not Updated"
      }],
      "ResultPath": "$.GetStore",
      "Next": "Item Updated"
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
        "Next": "Item Not Deleted"
      }],
      "ResultPath": "$.GetStore",
      "Next": "Item Deleted"
    },

    "Item fail To Create":{
      "Type": "Fail",
      "Error": "Item Create Fail",
      "Cause": "Dynamodb error"
    },
    "Item Created":{
      "Type": "Pass",
      "End": true
    },
    "Item Found":{
      "Type": "Pass",
      "End": true
    },
    "Item Not Found":{
      "Type": "Fail",
      "Error": "Item Create Fail",
      "Cause": "Dynamodb error"
    },
    "Item Deleted":{
      "Type": "Pass",
      "End": true
    },
    "Item Not Deleted":{
      "Type": "Fail",
      "Error": "Item Delete Fail",
      "Cause": "Dynamodb error"
    },
    "Item Updated":{
      "Type": "Pass",
      "End": true
    },
    "Item Not Updated":{
      "Type": "Fail",
      "Error": "Item Update Fail",
      "Cause": "Dynamodb error"
    },
    "Default":{
      "Type": "Pass",
      "End": true
    }
  }
}