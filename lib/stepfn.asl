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
          "Variable": "$.level",
          "NumericEquals": 1,
          "Next": "BeginnerState"
        },
        {
          "Variable": "$.level",
          "NumericEquals": 2,
          "Next": "IntermidiateState"
        },
        {
          "Variable": "$.level",
          "NumericEquals": 3,
          "Next": "AdvanceState"
        }
      ],
      "Default": "DefaultState"
    },

    "BeginnerState": {
      "Type" : "Pass",
      "Result": {
        "level": "Welcome to eCa. You are a beginner"
      },
      "End": true
    },

    "IntermidiateState": {
      "Type" : "Pass",
      "Result": {
        "level": "Your level is Intermidiate"
      },
      "End": true
    },

    "AdvanceState": {
      "Type" : "Pass",
      "Result": {
        "level": "Your level is advanced"
      },
      "End": true
    },

    "DefaultState": {
      "Type": "Fail",
      "Error": "DefaultStateError",
      "Cause": "No Matches!"
    }
  }
}