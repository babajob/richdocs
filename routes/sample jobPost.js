var job = {
  "items": [
    {
      "modifiedOn": "2016-09-16T03:39:43.189Z",
      "createdOn": "2016-09-15T15:02:39.916Z",
      "jobId": 2146288609,
      "totalNumberOfOpenings": 1,
      "address": {
        "address_line_2": "Visakhapatnam",
        "address_line_1": "Plot No: 12-165, Ganesh Nagar, Madhuarawada, Vizag, 530041",
        "locality": "Visakhapatnam",
        "administrative_area_level_1": "Andhra Pradesh",
        "country": "India",
        "postal_code": "535145",
        "location": {
          "latitude": 17.6868159,
          "longitude": 83.2184815
        }
      },
      "salary": {
        "attributeId": 6,
        "attributeName": "CurrentSalary",
        "attributeType": "SingleValue",
        "classification": "Profile",
        "dataType": "Number",
        "value": 6000
      },
      "description": "Maid",
      "title": "House Maid",
      "validUntil": "2016-12-14T15:02:39.232Z",
      "status": "Rejected",
      "previousStatus": "AwaitingApproval",
      "currentVacancies": 1,
      "callConnectEnabled": true,
      "isPromoted": false,
      "hasActiveCampaigns": false,
      "createdById": "6591734",
      "timing": {
        "startTime": "09:00:00",
        "duration": 9
      },
      "jobCategory": {
        "id": 1,
        "name": "Maid/Housekeeping"
      },
      "plan": {
        "planId": "1",
        "name": "Free Post",
        "description": "Post a job for free. No phone no. access",
        "price": {
          "basePrice": 0,
          "serviceTax": 0,
          "swatchBharatCessTax": 0.5,
          "krishiKalyanaCessTax": 0.5,
          "totalPrice": 0
        },
        "numberOfUnlocks": 0,
        "planType": "Free"
      },
      "totalAllowedUnlocks": 0,
      "employer": {
        "modifiedOn": "2016-09-15T14:59:26.131Z",
        "createdOn": "2016-02-26T19:08:53.887Z",
        "lastSignIn": "2016-02-29T15:12:14.433Z",
        "feedback": [],
        "communicationPreference": [],
        "notificationPreferences": [],
        "organisation": {
          "role": "Owner",
          "name": "Varaprasad",
          "contactDetails": [],
          "address": {
            "confidence": 100,
            "locality": "Medak",
            "country": "India",
            "postal_code": "502032",
            "formatted_address": "",
            "location": {
              "latitude": 17.506536,
              "longitude": 78.2837407
            }
          }
        },
        "employerType": 1,
        "user": {
          "aboutMe": "",
          "userID": 6591734,
          "dateOfBirth": "1900-01-01T00:00:00.000Z",
          "createdBy": "6591734",
          "createdOn": "2016-02-26T19:08:53.887Z",
          "profilePicture": "services/getimage.aspx?id=15",
          "lastSignIn": "2016-09-15T20:29:19.000Z",
          "isDeleted": false,
          "gender": 0,
          "role": 3,
          "contactDetails": [
            {
              "isVerified": true,
              "value": "+919949997297",
              "contactType": 2
            },
            {
              "isVerified": true,
              "value": "varaprasad.b9@gmail.com",
              "contactType": 4
            }
          ],
          "name": {
            "lastName": "-",
            "firstName": "Varaprasad"
          }
        },
        "employerId": "57d553f3b4490e71f53939c5"
      },
      "jobRequirements": [
        {
          "requirementType": "Preferred",
          "value": {
            "max": 10000,
            "min": 5000
          },
          "dataType": "NumberRange",
          "classification": "Profile",
          "attributeType": "SingleValue",
          "options": [
            5000,
            10000,
            15000,
            20000,
            25000,
            30000,
            35000,
            40000,
            45000
          ],
          "questionText": "What is the monthly salary offer?",
          "attributeName": "ExpectedSalary",
          "questionId": 1941,
          "attributeId": 1
        },
        {
          "value": {
            "max": 20,
            "min": 5
          },
          "dataType": "NumberRange",
          "classification": "Profile",
          "attributeType": "SingleValue",
          "options": [
            5,
            10,
            15,
            20
          ],
          "questionText": "What should be the maximum distance from place of work to candidate's home?",
          "attributeName": "Location",
          "questionId": 1942,
          "attributeId": 2
        },
        {
          "value": {
            "max": 45,
            "min": 18
          },
          "dataType": "NumberRange",
          "classification": "Profile",
          "attributeType": "SingleValue",
          "options": [
            18,
            20,
            25,
            30,
            35,
            40,
            45
          ],
          "questionText": "What age group is preferred?",
          "attributeName": "Age",
          "questionId": 1945,
          "attributeId": 3
        },
        {
          "requirementType": "Mandatory",
          "value": {
            "labelPost": "Female",
            "labelSeeker": "Female",
            "answerOptionId": 4347,
            "value": "Female",
            "id": 2
          },
          "dataType": "Default",
          "classification": "Profile",
          "attributeType": "SingleValue",
          "options": [
            {
              "labelPost": "Male",
              "labelSeeker": "Male",
              "answerOptionId": 4346,
              "value": "Male",
              "id": 1
            },
            {
              "labelPost": "Female",
              "labelSeeker": "Female",
              "answerOptionId": 4347,
              "value": "Female",
              "id": 2
            }
          ],
          "questionText": "What gender is preferred?",
          "attributeName": "Gender",
          "questionId": 1946,
          "attributeId": 4
        },
        {
          "value": {
            "labelPost": "Photo Needed",
            "labelSeeker": "Has Photo",
            "answerOptionId": 4352,
            "value": "Required",
            "id": 1
          },
          "dataType": "Default",
          "classification": "Profile",
          "attributeType": "SingleValue",
          "options": [
            {
              "labelPost": "Photo Needed",
              "labelSeeker": "Has Photo",
              "answerOptionId": 4352,
              "value": "Required",
              "id": 1
            }
          ],
          "questionText": "Should there be a profile photo?",
          "attributeName": "ProfilePic",
          "questionId": 1948,
          "attributeId": 5
        },
        {
          "value": {
            "labelPost": "Resume Needed",
            "labelSeeker": "Has Resume",
            "answerOptionId": 4353,
            "value": "Required",
            "id": 1
          },
          "dataType": "Default",
          "classification": "Profile",
          "attributeType": "SingleValue",
          "options": [
            {
              "labelPost": "Resume Needed",
              "labelSeeker": "Has Resume",
              "answerOptionId": 4353,
              "value": "Required",
              "id": 1
            }
          ],
          "questionText": "Should there be an attached CV/Resume?",
          "attributeName": "Resume",
          "questionId": 1949,
          "attributeId": 6
        },
        {
          "value": {
            "labelPost": "Willing to Cook",
            "labelSeeker": "Cook",
            "answerOptionId": 4433,
            "value": "Yes",
            "id": 1
          },
          "dataType": "Default",
          "classification": "JobPreference",
          "attributeType": "SingleValue",
          "options": [
            {
              "labelPost": "Willing to Cook",
              "labelSeeker": "Cook",
              "answerOptionId": 4433,
              "value": "Yes",
              "id": 1
            },
            {
              "answerOptionId": 4434,
              "value": "No",
              "id": 2
            }
          ],
          "questionText": "Should also be willing to cook as part of the job?",
          "attributeName": "MaidWillingToCook",
          "questionId": 1980,
          "attributeId": 16
        }
      ],
      "modifiedById": "3887934",
      "rejectedBy": "3887934",
      "rejectionReason": "DisapprovedUnknownReason",
      "jobPostId": "57dab80f9dacf41f779fec89"
    }
  ],
  "totalCount": 1,
  "pageNumber": 1,
  "pageSize": 20
}