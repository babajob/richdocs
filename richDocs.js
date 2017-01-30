// Copyright 2016, Google, Inc.
/*


Todos:
Handle delete
Fix on web
Parse UserId, firstAndLast



get in a repro
Post to google hosting

Handle Address parsing
Push upload 


//RichDocs
Expose as one function inputFile, {user:userid, firstName, lastName }, options: findFace, savePictures, verbose (includes Google Data)
return 
success: true | false
nameFound: true | false
document: 
  type: 
  hasFace: 
  user:
  humanVerified: 
files:
  documentPhotoURL
  facePhotoURL
googleData:
  textDetection
  faceDetection
err:

2. Move to expose as webservice - Done
3. Save photo and face to FB
4. Expose on Google Cloud
5. Do address lookup on text... - likely as a separate service...

Eventual Usage
--web, apps NOT messenger...
0. Get an auth credential from a babajob userID
1. Auth to Fire
2. Call Client service to upload a file?



*/

'use strict';

//import config file
var config = require('./config');

//request 
var request = require("request");

// [START app]
// [START import_libraries]
var S = require('string'); // http://stringjs.com/
// Instantiate a vision client
var Vision = require('@google-cloud/vision');
var vision = Vision();

//natural language
var language = require('@google-cloud/language')();
// [END import_libraries]

//for speech reco
const fs = require('fs');
const record = require('node-record-lpcm16');
const speech = require('@google-cloud/speech')();
var cloudconvert = new (require('cloudconvert'))('uxxiWKnVTQ-j100gNxgJcrSSzxw7AnD-N73YhOn03CKg-nHbHS0un6mjtY8zBhSsg4KDLfu7t9nL7UKRiaYl5w');

//async lib
var async = require("async");

//firebase
var firebase = require('firebase');
var firebaseDBDomain = "babajob-dd6d9.firebaseio.com";
var firebaseStorageBucket = "babajob-dd6d9.appspot.com";
firebase.initializeApp({
  serviceAccount: "./FirebaseServiceAccount.json",
  databaseURL: "https://" + firebaseDBDomain,
  storageBucket: firebaseStorageBucket
});

const util = require('util');

//storage
//var gcloud = require('google-cloud')();  //may need to add ({...}) params...
//var storage = gcloud.storage({ projectId: "babarichdocs" });
//var bucket = storage.bucket(firebaseStorageBucket);

/*
//https://cloud.google.com/appengine/docs/flexible/nodejs/using-cloud-storage
var storage = gcloud.storage({
  projectId: process.env.GCLOUD_PROJECT
});

// A bucket is a container for objects (files).
var bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);
*/



       

var richdocsDB = "richdocstest";
var useProduction = false;
function richDocs() {
  richdocsDB = "richdocs" + (useProduction ? "" : "test");
  
}

//get
richDocs.prototype.get = function (id, callback) {
  var db = firebase.database();
  var ref = db.ref(richdocsDB + "/all/" + id);
  // Attach an asynchronous callback to read the data
  ref.once("value", function (snapshot) {
    callback(null, snapshot.val());
  }, function (errorObject) {
    callback("The read of firebase id:" + id +  + errorObject.code);
  });
}


//getAll
richDocs.prototype.getAll = function (callback) { 
  var db = firebase.database();
  var ref = db.ref(richdocsDB + "/all");
  // Attach an asynchronous callback to read the data
  ref.once("value", function (snapshot) {
    callback(null, snapshot.val());
  }, function (errorObject) {
    callback("The read of firebase failed: " + errorObject.code);
  });
}



//deleteByIdAndUserId
richDocs.prototype.deleteByUserIdAndId = function (userid, id, callback) {
  console.log("starting deleteByIdAndUserId", userid, id);
  var db = firebase.database();
  //var ref = db.ref(richdocsDB + "/all/" + id);
  var refByUserId = db.ref(richdocsDB + '/by-userid/' + userid + "/" + id);

  if (!id) {
      return callback("richDocs.deleteByIdAndUserId id was null");
  }
  if (!userid) {
    return callback("richDocs.deleteByIdAndUserId userid was null");
  }

  // Attach an asynchronous callback to delete the data
  

  var localRichDocs = new richDocs();
  async.waterfall([
    function (callback) {
      localRichDocs.get(id, function (err, result) {
        if (err) {
          return callback(err);
        } else {
          //check to see if we are storing the photo
          console.log("starting delete id:" + id + " result:" + result);
          if (!result) {
            //object to be deleted did not exist...
            return callback(null, "Could not find richDocs object id:" + id);
          } else {
            
            console.log("result.contentUrl:" + result.contentUrl);
            if (!S(result.contentUrl).contains(firebaseStorageBucket.trim() + "asds")) {
              //if the contentUrl is not ours immediately call the next function...
              console.log("delete - contentUrl was not in our domain:" + firebaseStorageBucket);
              callback(null, result);
            } else {
              console.log("delete - contentUrl WAS in our domain");
              // Create a reference to the file to delete
              /*
              TODO: Hook up Google storage to actually delete the old files...
              var storageRef = storage.refFromUrl(result.contentUrl);
              // Delete the file
              storageRef.delete(
                function (err) {
                  if (err) {
                    console.log("delete - photo delete failed");
                    return callback(err);
                  } else {
                    // File deleted successfully, so call next function...
                    console.log("delete - photo storage delete worked");
                    callback(null, result);
                  }
                }
              );
              */
            }
          }
        }
      })
    },

    //Now that we've guaranteed the photoURL file is deleted, delete the FB object
    function (result, callback) {
      console.log("starting delete of FB Object" + id + " result:" + result.contentUrl);

      refByUserId.remove(
        function (err) {
          if (err) {
            console.log("error while removing id:");
            return callback(err);
          } else {
            console.log("remove successful");
            callback(null, result);
          }
        }
      );
      console.log("after initate call to delete FB");
    }

  ],
    //finally callback to the calling function
    function (err, result) {
      console.log("final callback called to deletebyuseridandid");
      callback(null, result);
    }
  )
};


//Delete 
//1. Get the object - - call back
//2. See if there's an FB storage item then Delete the stored object - callback
//4. Finally Delete the record - callback
//samples/
//curl -XDELETE http://localhost:3001/api/richdocs/-KRb1T0ApMGYURMkWSzr
richDocs.prototype.deleteById = function (id, callback) {
  var db = firebase.database();
  var ref = db.ref(richdocsDB + "/all/" + id);
 
  var refByUserId = null;
  
  if (!id) {
      return callback("richDocs.deleteById id was null");
  }
  
  // Attach an asynchronous callback to delete the data
  

  var localRichDocs = new richDocs();
  async.waterfall([
    function (callback) {
      localRichDocs.get(id, function (err, result) {
        if (err) {
          return callback(err);
        } else {
          //check to see if we are storing the photo
          console.log("starting delete id:" + id + " result:" + result);
          if (!result) {
            //object to be deleted did not exist...
            return callback(null, "Could not find richDocs object id:" + id);
          } else {
            
            console.log("result.contentUrl:" + result.contentUrl);
            if (!S(result.contentUrl).contains(firebaseStorageBucket.trim() + "asds")) {
              //if the contentUrl is not ours immediately call the next function...
              console.log("delete - contentUrl was not in our domain:" + firebaseStorageBucket);
              callback(null, result);
            } else {
              console.log("delete - contentUrl WAS in our domain");
              // Create a reference to the file to delete
              /*
              TODO: Hook up Google storage to actually delete the old files...
              var storageRef = storage.refFromUrl(result.contentUrl);
              // Delete the file
              storageRef.delete(
                function (err) {
                  if (err) {
                    console.log("delete - photo delete failed");
                    return callback(err);
                  } else {
                    // File deleted successfully, so call next function...
                    console.log("delete - photo storage delete worked");
                    callback(null, result);
                  }
                }
              );
              */
            }
          }
        }
      })
    },

    //Now that we've guaranteed the photoURL file is deleted, delete the FB object
    function (result, callback) {
      console.log("starting delete of FB Object" + id + " result:" + result.contentUrl);

      ref.remove(
        function (err) {
          if (err) {
            console.log("error while removing id:");
            return callback(err);
          } else {
            console.log("remove successful");
            callback(null, result);
          }
        }
      );
      console.log("after initate call to delete FB");
    },

    //Delete by userid as well
    function (result, callback) {
      //the set userid
      if (result.user && result.user.userid && result.user.userid.length > 2) {
        let userid = result.user.userid;
        console.log("deleting by userid:", userid);
        refByUserId = db.ref(richdocsDB + '/by-userid/' + userid);

        /*
        refByUserId.remove(
          function (err) {
            if (err) {
              console.log("error while removing by id:");
              return callback(err);
            } else {
              console.log("remove by userif successful");
              callback(null, result);
            }
          }
        );
        */
      } else {
        //if userid, then just callback
        callback(null, result);
      }
    }

  ],
    //finally callback to the calling function
    function (err, result) {
      console.log("final callback called");
      callback(null, result);
    }
  )
};



/* 
Expose as one function inputFile, firebaseKey {can be null}, {user:userid, firstName, lastName }, options: findFace, savePictures, verbose (includes Google Data)


*/

//function parseRichDoc(richDocL, fireBaseKey, user, options, callback) {
richDocs.prototype.parseRichDoc = function (richDoc, firebaseKey, user, options, callback) {

  //richDoc.contentUrl = "https://storage.googleapis.com/babarichdocs/archpass.jpg";  
  if (!richDoc || !richDoc.contentUrl) {
    callback("richDocs.parseRichDoc(richDoc) is not defined");
  } else if (!richDoc.contentType) {
    callback("richDocs.parseRichDoc(richDoc.contentType) is not defined");
  }

  options = options || {
    verbose: null,
    savePictures: null,
    findFace: null,
    findEntities: null,
    offline: null
  };

  user = user || {};

  var media = "document";
  //Android records audio as video/mp4.
  if (S(richDoc.contentType).contains("audio") || S(richDoc.contentType).contains("video/mp4")) {
    media = "voiceClip"
  }
  var result = {
    success: false,
    user: user,
    originalUrl: richDoc.contentUrl,
    contentUrl: richDoc.contentUrl,
    contentType: richDoc.contentType,
    media: media, //document or voiceClip or CV or selfie
    facePhotoURL: "",
    nameMatch: null,
    attributeData : null,
    document: {
      summary: "",
      hint: richDoc.documentHint || null,
      type: null,
      hasFace: null,
      humanVerified: null,
      documentId: null,
      user: { firstName: '', lastName: '', location: { stateName: null } }
    },
    voiceClip: {
      matchPhrase: richDoc.matchPhrase || "",
      convertedUrl: null,
      bestReco: null,
      recos: [
      /*
        {
          dialect: "en-US",
          recognizedText: "",
          matchScore: 0,
        engine: "Google"
        }
*/
      ]
    },
    googleData: {
      summaryText: null,
      fullText: null,
      face: null,
      languageEntities: null,
    },
    err: null
  }

/*
  "matchPhrase": "I'm an honest and hard worker and I'd love to work for you.",
    "recognizedText": "I'm on this too hard worker and I'd love to work for you.",
    "bestRecognizedDialect": "",
    "matchScore": 84.61538461538461,
    "convertedUrl": "gs://voiceclips/BJ10001-1478080840.56.flac",
    "recognizedDialect": "en-US"
  },  
*/

  //for offline testing
  if (options.offline) return finallyRunDocs(options, result, callback);
  
  console.log("starting parseRichDoc firebaseBay" + firebaseKey + " contentUrl:" + richDoc.contentUrl);

  

  if (media == "voiceClip") {
    var callBackCounter = 0;
    //TODO: 
        /*
          Call cloudConvert to save and convert.
          Call Google Speech API with 16000 or 8000 sample rate, depending on content type
          Try both en-US and en-IN
          Assess how well the recording matches the matchphrase and then write a score and summary.
          Set dialect
        
        cloudconvert API key
        //uxxiWKnVTQ-j100gNxgJcrSSzxw7AnD-N73YhOn03CKg-nHbHS0un6mjtY8zBhSsg4KDLfu7t9nL7UKRiaYl5w
        
        */
        

    //var isAndroid = true;
        
    var sampleRate = result.contentType == "audio/aac" ? 8000 : 16000;
    var inputformat = result.contentType == "audio/aac" ? "aac" : "mp4";
    //"97PGVNRzXy", android
    //"YVWo9XiePj", //iphone
    var preset = result.contentType == "audio/aac" ? "YVWo9XiePj" : "97PGVNRzXy";
    
    var seconds = new Date().getTime() / 1000;
    var gsVoiceFileName = result.user.userid + "-" + seconds + ".flac";  
    var gsBucketPath = "gs://voiceclips/";
    var gsPath = gsBucketPath + gsVoiceFileName;

    var highestScore = 0;
    var completedFirstReco = false;

    
    async.waterfall([

      function (callback) {
        //Call cloudConvert to save and convert.

        cloudconvert.convert({
          "inputformat": inputformat,
          "outputformat": "flac",
          "input": "download",
          //"file": "https://cdn.fbsbx.com/v/t59.3654-21/14931650_10154439492671084_6156889271547461632_n.aac/audioclip-1477943008722-4096.aac?oh=9bc5ab0fba4ee79b63e8466b6ab93fcb&oe=58194C96",
          "file": result.contentUrl,
          "preset": preset,
          "timeout": 0,
          "output": {
            "googlecloud": {
              "projectid": "babarichdocs",
              "bucket": "voiceclips",
              "credentials": {
                "type": "service_account",
                "project_id": "babarichdocs",
                "private_key_id": "50165174d770a31345fa33c9022f55d4780b3d88",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7U93EcXw8toUC\nuH2+dI7o95AQvMiX8cNo69UFQFcHo3yC2pzXCvU5usJYkAWEF4SSrm31SeJXToX8\nPmvY5dc5HVDv84PcPHT3l1iHrebn++iSJ7+GS5p0HfOKXMWdtv2o5b7VPL1lQ/kE\nftOpn/U6ICTh1AWIbUtqLx6vT3P3pfI85wUFl863UXpvSqzqB7Lbk/0/SHDrxSsM\n4WDJ1Q4uK2+cpRjckqE1VHhg0mYR9WeQahT3F6VemZ1xbSgLUxYpK6tdznA0mCDf\ncopqE5f/HrGNFuaVoCjfKf4A8qYm+9ebxuYziu2EOMYeE80w8UDk3R2d2qYm9wTx\n3IpEorqpAgMBAAECggEBALnrHqsdRwSq0ZBFsucXn86wBZfXBe9nz12O0jkIBlha\ndfUZK5hyE7hcFw72wcK75KP/4roTvkSQdoJHIZp/YwAYjH/Z3AD1L9GbsA3ZFtcf\nOU/1iyyqVHzyTQgB01AYkeDTRHc2dXLP55ICneg4DZbG2FQZrfQdJUAZzAaKgLpD\nkSuxkwOo645Tgl2VIIkCBO0X6z8Y7MKmTjoHmj1cphSyiDpJtyuMHlDLrpBylJLH\nuE/JTGzYBLxx1j5aPKB23vbV09EKF+Sit26BU9rzSbJIeO0PxKuugq8QgepPsd5O\nOKr9470DMMBNijAPqza3Urs2ngaIWz2JPrbgxuN8UFECgYEA68eQOdzkEadH/No7\nxJzym8HjdG16YuFQzQ/kXy82QujAb6WArb1GWF1Fk2HiUJ7p7SObO+IduK4xxfhx\nvHhEdszdGD+A3am5PnhgfBey0Ay+p3TfFG33u33BwjwZViOUCvRbk4KoKya4dcJb\nGjVIrZ7OALrXmTRXFQu8LTBwaJsCgYEAy2SPzgT3H1mv+Njdu60vO2ha39oNvJJO\nZCBzVL1uz5xplE9sI4Bjl8bXz8YFjbDF0XSQJFuBBsILKqyyVB9In2att1EBGqW3\n31wABUzC18MzNLibX8BWrefXaHPoJFV1Z9RvR5CZyFmCWcg7Yt9Pjr7R2ekkc12Q\n+ucm18O4dAsCgYARsXobPX5H7Nu0F9RgXr69/YDKHeUPQoVDviuPEQXrY3f9aNgN\nMaTzwJwWAURwdFxtlTxy8/bzAu9tQcWXNRc+KwV0al+LQs9J5tKmvUiH4Ez2WAjd\niZsLkNZXcxcbpbPYVpoAqc9g3Zj+DUW048a+cKpY16ySLKFUTPskEPx+fQKBgBb0\nDlaNsOXU1UscDknzzXTC3h6NGSfCyx35m4pgpnS/jhqyq92Fy7eBNTG5gz7uSCTP\nJsUznmgI1gHG44kizqtOhyQ8/Abp1MpcM5RliUeYO9sjSkWQCzgtBd4/1l7jVhCV\npMlKxFAb6d3//tO1p+DQIBabfQWX9ZibJYMMD3DpAoGBAJCk+6Afi7q2tMzv7oAJ\n/7IqSbIKYdhuPOZdDz1unaqDKvsEIejn8K5mWRF2Ga+96pdS9C+E3vu7crbucNT9\nXKlYpjqH23mrTqKWCQhl6xwCpdrqy9lQ3Hlm6EciNdSOjM68RXw5QVF9/lcj1r/W\nygnUqaZqKskNq3SYncc2bOwa\n-----END PRIVATE KEY-----\n",
                "client_email": "ocrphotos@babarichdocs.iam.gserviceaccount.com",
                "client_id": "111747215326020811004",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://accounts.google.com/o/oauth2/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/ocrphotos%40babarichdocs.iam.gserviceaccount.com"
              },
              "path": gsVoiceFileName
            }
          },
          "save": true
        },
          (err, process) => {
            //process is the terminology of cloudconvert...
            //function (err, process) {
            var err;
            callBackCounter++;
            if (err && callBackCounter == 1) {
              console.log("We had an error in cloudconvert:",err);
              return callback(err);
            }
            
            //hack around the fact that the cloud library fires multiple calls...
            
            console.log("Process Counter: " + callBackCounter);
            console.log("Process.data" + util.inspect(process.data, { showHidden: false, depth: null }));

            if (callBackCounter == 1 && result.voiceClip.convertedUrl != gsPath) {
              //console.log("Process.data" + util.inspect(process.data, { showHidden: false, depth: null }));
              result.voiceClip.convertedUrl = gsPath;
              callback(null, result);
            }  
            //console.log("Process:" + process.data.message); 
            
            
            //console.log("Ending cloudConvert...");
            //
          }
        );
      },

/*      
      matchPhrase: richDoc.matchPhrase || "",
      convertedUrl: null,
      bestRecognizedDialect: "",
      bestRecognizedText: "",
      bestMatchScore: 0,
      recos: [      
        {
          dialect: "en-US",
          recognizedText: "",
          matchScore: 0,
        }
      ]
      */

         //var pathToFile;
        //pathToFile = gsPath;
        //pathToFile = "gs://voiceclips/BJ10001-1477949425.848.flac";
        
        // [START speech_sync_recognize]
      
      //Reco in en-US
      function (result, callback) {
        var dialect = 'en-IN';
        
        console.log("Starting first reco in " + dialect);
     
        speech.recognize(gsPath, {
          encoding: 'FLAC',
          sampleRate: sampleRate,   //iphone 8000, android 16000
          languageCode: dialect
        }, (err, foundWords) => {
          if (err) {
            console.log("reco error in en-IN first time...", err);
            callback(null, result); //try again...
            //return callback(err);  
          }
          completedFirstReco = true;
          result.success = true;
          saveRecoForDialect(result, dialect, result.voiceClip.matchPhrase, foundWords);
          console.log('Reco Results in ' + dialect, foundWords);
          callback(null, result);
        });
      },
  
      //Reco in en-IN 2nd time...
      function (result, callback) {
        var dialect = 'en-IN';

        //First one often times out so we want to do it twice...        
        if (completedFirstReco) {
          callback(null, result);
        } else {
        
          console.log("Starting 2nd reco in " + dialect);
     
          speech.recognize(gsPath, {
            encoding: 'FLAC',
            sampleRate: sampleRate,   //iphone 8000, android 16000
            languageCode: dialect
          }, (err, foundWords) => {
            if (err) {
              console.log("reco error 2nd time...", err);
              return callback(err);
            }

            result.success = true;
            saveRecoForDialect(result, dialect, result.voiceClip.matchPhrase, foundWords);
            console.log('Reco Results in ' + dialect, foundWords);
            callback(null, result);
          });
        }  
      },

      //Reco in en-US
      function (result, callback) {
        var dialect = 'en-US';

        //don't run if Indian score is already good...
        var indianRecoScore = getHighestRecoScore(result);
        if (indianRecoScore > 70) {
          callback(null, result);

        } else {
          console.log("Starting reco in " + dialect);
     
          speech.recognize(gsPath, {
            encoding: 'FLAC',
            sampleRate: sampleRate,   //iphone 8000, android 16000
            languageCode: dialect
          }, (err, foundWords) => {
            if (err) {
              console.log("reco error in en-US...", err);
              return callback(err);
            }

            result.success = true;
            saveRecoForDialect(result, dialect, result.voiceClip.matchPhrase, foundWords);
            console.log('Reco Results in ' + dialect, foundWords);
            callback(null, result);
          });
        }  
      },
      

      //Save result to firebase
      function (result, callback) {
        console.log("Saving to Firebase...");
      
        var ref = firebase.database().ref();

        // Get a key for a new richDoc if firebaseKey is not null
        var newDocKey = firebaseKey || ref.child(richdocsDB).push().key;

        // Write the new post's data simultaneously in the richDoc lists and create fast indexes by userid, Aadhaar. 
        var updates = {};
        updates['/' + richdocsDB + '/all/' + newDocKey] = result;
        if (result.user) {
          if (result.user.userid) {
            updates['/' + richdocsDB + '/by-userid/' + result.user.userid + '/' + newDocKey] = result;
          }
          if (result.document.user.aadhaarNumber) {
            updates['/' + richdocsDB + '/by-aadhaar/' + result.document.user.aadhaarNumber + '/' + newDocKey] = result;
          }
        }
      
        console.log("about to save to firebase richdoc result" + util.inspect(result, { showHidden: false, depth: null }));
      
        ref.update(updates, function (err) {
          if (err) {
            return callback(err, result);
          } else {
            callback(null, result);
          }
        });
      }
    ],
      function (err, result) {
        if (err) {
          return callback(err, result);
        } else {
          console.log("Running end of speech");
          finallyRunSpeech(result);
          callback(null, result);
        }
      }
    )
  }
  else {
    //document detection...
    async.waterfall([

      //Save the file to Babajob's Amazon Store
      function (callback) {
        console.log("Saving to Babajob Amazon..." + richDoc.contentUrl);
        var fileName = (user.userid ?  user.userid : "unknownId") + "-" + (richDoc.documentHint ? richDoc.documentHint : "unknown") + '-' + "image.png";
        copyFileToBJ(richDoc.contentUrl, richDoc.contentType, fileName,
          function (err, newFileUrl) {
            if (err) {
              return callback(err, result);
            } else {
              //save the new URL
              result.contentUrl = newFileUrl;
              console.log("Saved at :" + result.contentUrl);
              callback(null, result);
            }
          }
        );
      },

      function (result, callback) {
        detectText(richDoc.contentUrl, function (err, texts) {
          console.log("Got back texts:" + JSON.stringify(texts, 0, 2));
          if (err) {
            return callback(err);
          }
          if (!texts) {
            result.err = err;
            return callback(err, result);
          }

          var summary = texts[0];
          result.googleData.summaryText = summary;
          if (options.verbose) {
            result.googleData.fullText = texts;
          }

          result.nameMatch = matchName(user.firstName, user.lastName, summary);
        
          //console.log("nameMatch:" + result.nameMatch);

          result = detectIDDocument(summary, result);

          
          //set success to true if we found a known document pattern.
          if (result.document.type) {
            result.success = true;
          }          

          //update the summary text with the name match results.
          result.document.summary = updateSummaryforMatchName(result.nameMatch, user, result.document.summary);

          //Update the Summary           
          if (result.document.hint) {
            if (result.success) {
              //if document type == hint...
              //take name match into account
              result.document.summary = "Verified: " + result.document.summary;
            } else {
              result.document.summary = result.document.hint + (result.document.summary ? ". Verified: " + result.document.summary : "");
            }
          }  

  //Non-blocking async save back to Babajob
  

          //callback before close
          callback(null, result);
        })
         

      },
      //OPTIONAL FEATURES
      function (result, callback) {
        //the face in the photo
        if (!options.findFace) {
          callback(null, result);
        }
        else {
          console.log("Finding face...");
          detectFace(photoURL, function (err, faces) {
            if (err) {
              return callback(err, result);
            }
            result.document.hasFace = true;
            result.googleData.face = faces;
            callback(null, result);
          });
        }
      },
      function (result, callback) {
        //find entities in the photo (usually returns nothing useful)
        if (!options.findEntities) {
          callback(null, result);
        } else {
          console.log("Finding entities...");
          language.detectEntities(summary, function (err, entities) {
            if (err) {
              return callback(err, result);
            }
            result.googleData.languageEntities = entities;
            console.log('Language entities:', JSON.stringify(entities, null, 2));
            callback(null, result);
          });
        }
      },
      //Save result to firebase
      function (result, callback) {
        //console.log("Saving to Firebase...");
      
        var ref = firebase.database().ref();

        // Get a key for a new richDoc if firebaseKey is not null
        var newDocKey = firebaseKey || ref.child(richdocsDB).push().key;

        // Write the new post's data simultaneously in the richDoc lists and create fast indexes by userid, Aadhaar. 
        var updates = {};
        updates['/' + richdocsDB + '/all/' + newDocKey] = result;
        if (result.user) {
          if (result.user.userid) {
            updates['/' + richdocsDB + '/by-userid/' + result.user.userid + '/' + newDocKey] = result;
          }
          if (result.document.user.aadhaarNumber) {
            updates['/' + richdocsDB + '/by-aadhaar/' + result.document.user.aadhaarNumber + '/' + newDocKey] = result;
          }
        }

      
        console.log("about to save to firebase richdoc result" + util.inspect(result, { showHidden: false, depth: null }));
      
        ref.update(updates, function (err) {
          if (err) {
            return callback(err, result);
          } else {
            callback(null, result);
          }
        });
      },

      //SAVE BACK TO BABAJOB
      function (result, callback) {
        //ensure we have auth and key...
        if (!(user.jobSeekerId && user.accessToken)) {
          callback(null, result);
        }
        else {
          console.log("Saving to Babajob...");
          saveRichDocToBJ(result, user.jobSeekerId, user.accessToken,
            function (err, result) {
              if (err) {
                return callback(err, result);
              } else {
                callback(null, result);
              }
            });
        }
      }      

    ],
      function (err, result) {
        finallyRunDocs(options, result, callback)
      }
    )
  }
}        

function finallyRunDocs(options, result, callback) {
  //strip the google data...
  if (!options.verbose && result && result.googleData) {
    result.googleData.fullText = "";
    result.googleData.face = "";
    result.googleData.languageEntities = "";
  }

  //finally print the result
  //console.log("parseRichDoc result:" + JSON.stringify(result, null, 2));    
  callback(null, result);
} 

function saveRecoForDialect(result, dialect, desiredPhrase, detectedWords) {
  var desiredArray = desiredPhrase.split(' ');
  var detectedArray = detectedWords.split(' ');
  var missingWords = desiredArray.diff(detectedArray);

  var score = 100 * ((desiredArray.length - missingWords.length) / desiredArray.length);
 
  var reco = {};
  reco.dialect = dialect;
  reco.recognizedText = detectedWords;
  reco.matchScore = score;
  reco.engine = "Google";

  result.voiceClip.recos.push(reco);
}

//returns the highest reco score...

function getHighestRecoScore(result) {

  var bestMatchScore = 0;
  var bestRecoItemNumber = -1;

  for (var i = 0; i < result.voiceClip.recos.length; i++) {
    var score = result.voiceClip.recos[i].matchScore
    if (score > bestMatchScore) {
      bestRecoItemNumber = i;
      bestMatchScore = score;
    }
  }

  return bestMatchScore;
}


function finallyRunSpeech(result) {
  /*
    {
      dialect: "en-US",
      recognizedText: "",
      matchScore: 0,
    }
*/

    
  var bestMatchScore = 0;
  var bestRecoItemNumber = -1;
  var bestReco;
  for (var i = 0; i < result.voiceClip.recos.length; i++) {
    var score = result.voiceClip.recos[i].matchScore
    if (score > bestMatchScore) {
      bestRecoItemNumber = i;
      bestMatchScore = score;
    }
  }
  console.log("Finished Reco Loop" + bestRecoItemNumber);
  if (bestRecoItemNumber >= 0) {
    console.log("Saving Best Reco;;;");
    bestReco = result.voiceClip.recos[bestRecoItemNumber];
    result.voiceClip.bestReco = bestReco;

    var naturalDialect = (bestReco.dialect == "en-US" ? "US" : "Indian"); 
    if (bestReco.matchScore > 80) {
          result.document.summary = "You speak " + naturalDialect + " English very well. "
    }    

    var simpleScore = bestReco.matchScore + " ";
    simpleScore = simpleScore.split('.')[0] + "%";    
    result.document.summary +=
      "Your " + naturalDialect + " English Score is: " + simpleScore + ". We heard: " + bestReco.recognizedText;
  }
}

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

/*

*/

// [START authenticate]
// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GCLOUD_PROJECT environment variable. See
// https://googlecloudplatform.github.io/gcloud-node/#/docs/google-cloud/lasynatest/guides/authentication
// [END authenticate]

/**
 * Uses the Vision API to detect texts in the given file.
 */
// [START construct_request]
function detectText (inputFile, callback) { 
  // Make a call to the Vision API to detect the texts  
  vision.detectText(inputFile, { verbose: false }, function (err, texts) {
    console.log('detectText:inputFile:', inputFile);
    
    if (err) {
      return callback(err);
    }
    if (!texts[0]) {
      console.log("Rich Docs detectText found no texts");
      texts = [''];
    }
    console.log('detectText:', JSON.stringify(texts[0], null, 2));
    callback(null, texts);
  });
}
// [END construct_request]

//see if the name appeared in the found text
function findText (little, big) {
  if (!little || !big) return null;
  return S(big.toLowerCase()).contains(little.toLowerCase().trim());
}

//Returns null, firstOnly, LastOnly, FirstAndLast
function matchName(firstName, lastName, texts) {
  var combinedName = S(firstName).trim() + S(lastName).trim();
  if (combinedName.length < 5) {
    return null; //too short
  } else {
    if (
      findText(combinedName, texts) ||
      findText(S(firstName + ' ' + lastName).trim(), texts)
      || (findText(firstName, texts) && findText(lastName, texts))
    ) {
      return 'firstAndLast';
    }
  
    else
      if (findText(firstName, texts)) {
        return 'firstOnly';
      } else if (findText(lastName, texts)) {
        return 'lastOnly';
      } else {
        return null;
      }
  }
}

function updateSummaryforMatchName(matchNameType, user, summaryText) {
  if (matchNameType == 'firstAndLast')
  {
    var capFirst 
    return ucfirst(user.firstName, true) + " " + ucfirst(user.lastName, true)  + "'s " + summaryText;
  } else {
    return summaryText;
   }
}

//make capital
function ucfirst(str, force)
{
          str=force ? str.toLowerCase() : str;
          return str.replace(/(\b)([a-zA-Z])/,
                   function(firstLetter){
                      return   firstLetter.toUpperCase();
                   });
     }


//returns none, PAN, Passport, DriverLicense, 

function detectIDDocument(texts, result) {

  
  //Make summary
  result.document.summary = "";
  
  //detect a state
  var state = findIndianState(texts);
  if (state) {
    result.document.user.location.stateName = state;
    result.document.summary += state + " ";
  }
  
  //PALSLIP 
  //comes at top because it has much of the other data below...
  if (
    findText("pay slip", texts) || findText("payslip", texts) || findText("salaryslip", texts) || findText("salary slip", texts)
  ) {
    result.document.type = "PaySlip";
    result.document.summary += result.document.type + " ";
  }
    
  //PASSPORT
  else if (
    (findText("passport", texts))
  ) {
    result.document.type = "Passport";
    result.document.summary += result.document.type + " ";

    //find the passport Number
    var passportMatches = texts.match(/([A-Z])(\d\d\d\d\d\d\d)/g);
    if (passportMatches != null && passportMatches.length > 0) {
      let id = passportMatches[0];
      //result.document.user.passportNumber = id;
      result.document.summary += id + " ";
      result.document.documentId = id;
    }

    //PAN Cards have a DOB... (but two other dates too...)
    result.document.user.DOB = findDOB(texts);
  }

  //Insurance doc form 51
  else if (
    (findText("insurance", texts) && findText("form 51", texts))
  ) {
    result.document.type = "InsuranceForm51";
    result.document.summary += result.document.type + " ";
  }
  
  //PAN
  else if (
    (findText("income", texts) && findText("tax", texts))
    || (findText("PERMANENT", texts) && findText("ACCOUNT", texts))
  ) {
    result.document.type = "PANCard";
    result.document.summary += result.document.type + " ";
    //PERMANENT ACCOUNT NUMBER\nADAPP7854L

    //find the PAN Number
    var panRegex = /([A-Z][A-Z][A-Z][A-Z][A-Z])(\d\d\d\d)([A-Z])/g
    var panMatches = texts.match(panRegex);
    if (panMatches != null && panMatches.length > 0) {
      result.document.documentId = panMatches[0];
      result.document.summary += panMatches[0] + " ";
    } else {
      var noSpaces = S(texts).replaceAll(' ', '').s;
      panMatches = noSpaces.match(panRegex);
      if (panMatches != null && panMatches.length > 0) {
        result.document.documentId = panMatches[0];
        result.document.summary += panMatches[0] + " ";
      }
    }

    //PAN Cards have a DOB...
    result.document.user.DOB = findDOB(texts);
  }
  //VoterID
  else if (findText("election", texts) && findText("commission", texts)) {
    result.document.type = "VoterID";
    result.document.summary += result.document.type + " ";
    //find the voterID
    var voterIDMatches = texts.match(/([A-Z][A-Z][A-Z])(\d\d\d\d\d\d\d)/g);
    if (voterIDMatches != null && voterIDMatches.length > 0) {
      result.document.documentId = voterIDMatches[0];
      result.document.summary += voterIDMatches[0] + " ";
    }
  }
    
  //RationCard
  else if (findText("ration", texts) 
  ) {
    result.document.type = "RationCard";
    result.document.summary += result.document.type + " ";
    
    //find the aadhaar number
    var matches = texts.match(/(\d\d\d\d)(\ )(\d\d\d\d)(\ )(\d\d\d\d)/g);
    if (matches != null && matches.length > 0) {
      result.document.user.aadhaarNumber = matches[0];
      result.document.summary += matches[0] + " ";
    }
  }

  //Aadhaar Card
  else if (findText("Aadhaar", texts) || findText("UID", texts)
    || texts.match(/(\d\d\d\d)(\ )(\d\d\d\d)(\ )(\d\d\d\d)/g)
  ) {
    result.document.type = "AadhaarCard";
    result.document.summary += result.document.type + " ";
    
    //find the aadhaar number
    var matches = texts.match(/(\d\d\d\d)(\ )(\d\d\d\d)(\ )(\d\d\d\d)/g);
    if (matches != null && matches.length > 0) {
      result.document.user.aadhaarNumber = matches[0];
      result.document.documentId = matches[0];
      result.document.summary += matches[0] + " ";
    }
  }
  //DrivingLicense
  else if (
    (findText("drive", texts) || findText("driving", texts) ||
      findText("transport", texts)
    ) && (findText("lisense", texts) || findText("licence", texts) || findText("license", texts)) ||
    
    findText("DL no", texts)
  ) {
    result.document.type = "DrivingLicense";
    result.document.summary += result.document.type + " ";
    //find the license number
    if (state == "Maharashtra") {
      var matches = texts.match(/([A-Z][A-Z])-(\d\d\d\d\d\d\d\d\d\d\d\d\d)/g);
      if (matches != null && matches.length > 0) {
        result.document.user.documentId = matches[0];
        result.document.summary += matches[0] + " ";
      }
    } else {

      //try for back of Karnataka          
      // KA20 20140006565
      var matches = texts.match(/(KA)\d{2} \d{11}/g);
      if (matches != null && matches.length > 0) {
        result.document.user.documentId = matches[0];
        result.document.summary += matches[0] + " ";
        if (!result.document.user.location.stateName || result.document.user.location.stateName == '') {
          result.document.user.location.stateName = "Karnataka";
          result.document.summary += result.document.user.location.stateName + " ";
        }
      }
    }
  }
  

      
  //All Card scanning...
  if (findText("female", texts)) {
    result.document.user.gender = "Female";
    result.document.summary += "Female" + " ";
  } else if (findText("male", texts)) {
    result.document.user.gender = "Male";
    result.document.summary += "Male" + " ";
  }


  //find the date of birth
  if (result.document.user.DOB == null) {
    result.document.user.DOB = findDOB(texts); //will be null if nothing found or not between 17 and 100 years
  }
  
  if (result.document.user.DOB != null) {
    result.document.summary += "Age: " + getAge(result.document.user.DOB) + " ";
  }
  result.document.summary = result.document.summary.trim();
  return result;
}

//Returns the earliest date of those found...
function findDOB(texts) {
  
    var dates = texts.match(/(\d\d)[\//-](\d\d)[\//-](\d\d\d\d)/g);
      if (dates != null && dates.length > 0) {
        console.log('Date entities:', dates);

        var dateArray = [];
        dates.forEach(function(element) {
          dateArray.push(parseDateIndia(element));
        }, this);
          
        var earliest = dateArray.reduce(function (pre, cur) {
            return Date.parse(pre) > Date.parse(cur) ? cur : pre;
        });
        
        console.log("earlist date:" + earliest);

        //check for acceptable date range
        var now = new Date();
        var ageInYears = parseInt((now-earliest)/(1000*3600*24*365));
          if (ageInYears > 17 && ageInYears < 100) {
            return earliest; 
          } else {
            return null; // parseDateIndia(dates[oldestDate]);
          }
      } 
      else 
      {
        return null;
      }
}

function getAge(date) {
  var now = new Date();
  return parseInt((now-date)/(1000*3600*24*365));
}

//DD/MM/YYYY
  function parseDateIndia(input) {
  input = S(input).replaceAll('-', '/').s; 
  var parts = input.split('/');
  // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
  var date = new Date(parts[2], parts[1]-1, parts[0]); // Note: months are 0-based
  return date.addHours(8.5); //offset for India TimeZone...
}

Date.prototype.addHours = function(h) {    
   this.setTime(this.getTime() + (h*60*60*1000)); 
   return this;   
}

//Find the State
var states = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
"Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka",
"Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
"Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
"Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

function findIndianState(input, searchWithNoSpaces) {
    var foundState = null;
    var count = 0;
    
    for (var i = 0; (i < states.length && !foundState); i++) { 
      var state = states[i];
      if (searchWithNoSpaces) {state = S(state).replaceAll(' ', '').s;}
      if (findText(state, input)) { foundState = states[i].toString(); }
  	}
    //if nothing found, check again without spaces....
  if (!foundState && S(input).contains(' ')) 
  { 
     var noSpaces = S(input).replaceAll(' ', '').s; 
     return findIndianState(noSpaces, true);
  } else {
    return foundState;
  }  
}


////////////////////////////////////////////////////////////////////////////
////// SAVE FILE TO AMAZON      ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////

function copyFileToBJ(originalUrl, contentType, fileName, callback) {
  var savedUrl = "";
  var errorMsg = "There was an erroring while copying this file to Babajob's Amazon account";

  //var uri = bjAPIDomain + "/api/images/bj-richdocs/upload";
  //hardcoding until we deploy... 30 Jan 2016...

  var uri = "http://qa02api.babajob.com" + "/api/images/bj-richdocs/upload";
  var formData = {
    //my_file: ,
    // Pass optional meta-data with an 'options' object with style: {value: DATA, options: OPTIONS}
    // Use case: for some types of streams, you'll need to provide "file"-related information manually.
    // See the `form-data` README for more information about options: https://github.com/form-data/form-data
    //attachments: [  request(picUrl) ],
        
    custom_file: {
      value: request(originalUrl),
      options: {
        filename: fileName, //hmmmmm
        contentType: contentType
      }
      //"file\"; filename=\"image.png\"")
    }
  };

  request({
    uri: uri,
    method: "POST",
    timeout: 45000,
    contentType: "multipart/form-data",
    
    /*
    headers: {
        'Authorization': accessToken,
        'consumer-key': consumerKey,
        'ProfileId': jobSeekerId
    },
    */
    formData: formData
  }, function (error, response, body) {
    if (error) {
      callback("copyFileToBJ:error" + error, savedUrl);   
    } else {
      try {
        var obj = JSON.parse(JSON.parse(body));
        console.log(util.inspect(obj));

        if (obj.urls) {
          var url = obj.urls[0];

          console.log("Saved new file to URL " + url);
          savedUrl = url;
          /*
          '"{\\"status\\":true,\\"message\\":\\"Upload Successful\\",\\"urls\\":[\\"http://bj-richdocs.s3-ap-southeast-1.amazonaws.com/image.png\\"]}"',
          */

          callback(null, savedUrl);
        } else {
          console.log("ERROR in copyFileToBJ " + obj);
          return callback(null, savedUrl);
        }
      } 
      catch (e) {
        return callback(e, savedUrl);
      }
    }
  }
  );
}

////////////////////////////////////////////////////////////////////////////
////// SAVE RICH DOC TO BABAJOB ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////

var consumerKey = "DZdXZhkUx2qjom5YwJYc0PiBgIgcKI"; 

var debugLocallyButOnProductionDB = false;
var onProduction = debugLocallyButOnProductionDB || config.onProduction;
var bjAPIDomain =onProduction ? "http://api.babajob.com" : "http://qa02api.babajob.com";
//var bjWebDomain =onProduction ? "http://www.babajob.com" : "http://qa02.babajob.com";

function saveRichDocToBJ(richDocObj, jobSeekerId, accessToken, callback) {
 
  var putData = [];
  putData.push(getRichDocJSONForBJSave(richDocObj));


  var apiSuffix = "/documents";  //switch to profile if resume...
  if (richDocObj.document.hint == "Resume") {
    apiSuffix = "";
  }


  console.log("Saving RichDocs...");
  console.log(util.inspect(putData));

  if (putData.length == 0) {
    console.log("saveRichDocToBJ: No Data to save...");
    callback(null, richDocObj);
  } else {
    
    if (!(accessToken && jobSeekerId)) {
      console.log("saveRichDocToBJ not logged in. docs: ", util.inspect(putData));
      callback(null, richDocObj);
    } else {
        //save the data to babajob...
      
      //TODO - change to update profile in case of CV save...

      var uri = bjAPIDomain + "/v2/jobseekers/" + jobSeekerId + apiSuffix;
      request({
        uri: uri,
        method: "POST",
        timeout: 30000,
        accept: "application/json",
        contentType: "application/json",
        headers: {
          'Authorization': accessToken,
          'consumer-key': consumerKey,
        },
        json: putData
      }, function (error, response, body) {
        if (error) {
          handleError("saveRichDocToBJ", error, putData,
            "Sorry, I failed to save your data back to Babajob."
            , uri, body);
          richDocObj.attributeData = putData;
          callback(error, richDocObj);
        } else {
          let seekerObj;
          try {
            seekerObj = body;
            console.log("Saved new rich doc` on " + jobSeekerId);

            // return the putData to callers so they can update their data models...
            richDocObj.attributeData = putData;
            callback(null, richDocObj);
          } catch (e) {
            handleError("saveRichDocToBJ", e, putData,
              "exception while parsing JSON:"
              , uri, body);
             callback(e, richDocObj);
          }
        }
      }
      );
    }
  }
}
   

function getRichDocJSONForBJSave(richDocObj, session) {
  var putData = null;
  //check for resume    
  if (richDocObj.document.hint == "Resume") {
    putData = {
      value:
      {
        id: 0,
        name: 'Resume',
        uploaded: richDocObj.contentUrl,
        isVerified: richDocObj.nameMatch != null,
        confidence: 0,
        has: true
      },
      attributeId: 6,
      attributeName: 'Resume',
      attributeType: 'SingleValue',
      classification: 'Profile',
      dataType: 'Document'
    }
    

  } else {
    //Get the IDProofs JSON
    var putData = JSON.parse(JSON.stringify(richDocSampleData));

    //find the matching document type...
    var doc;
    var matches = putData.options.filter(
      function (documentType) {
        return documentType.name == richDocObj.document.hint;
      })
    if (matches && matches.length > 0) {
      doc = JSON.parse(JSON.stringify(matches[0]));
    }
    //delete the other options...
    if (putData.options) {
      delete putData.options;
    }

      
    //{ "id": 1, "answerOptionId": 5815, "uploaded": "yes", 
    //"name": "VoterID", "isVerified": false, "has": false, 
    //"confidence": 0, "labelSeeker": "Has VoterID",
    //    "labelPost": "Need VoterID"

    //remove the answer option, given they are not answering a question        
    if (doc.answerOptionId) {
      delete doc.answerOptionId;
    }
    doc.has = true;
    doc.confidence = .9;
    doc.isVerified = richDocObj.nameMatch != null;
    doc.uploaded = richDocObj.contentUrl;    
    

    //extended props
    doc.properties = {};
    doc.verificationNotes = richDocObj.document.summary;

    //TODO: save url back to google store.
    doc.properties.publicUploaded = richDocObj.contentUrl;

    if (richDocObj.document.documentId) {
      doc.properties.documentId = richDocObj.document.documentId;
    }
    doc.properties.verificationLevel = getVerificationLevel(richDocObj);

    doc.properties.verifier = "Babajob_OCR";
    doc.properties.verificationData = richDocObj.googleData;
    doc.properties.verificationDate = new Date();
    
    putData.value = doc;
  }
  console.log("getRichDocJSONForBJSave putData" + util.inspect(putData));
  
  return putData;
}

/*
0 :NotVerified
1: Name
2: Name_DocTitle
3. Name_DocTitle_ID
4: Name_DocTitle_ID_Human
5: API_Number
6: API_Number_Name
*/

var VerificationLevelEnum = {
  NotVerified: 0,
  Name: 1,
  Name_DocTitle: 2,
  Name_DocTitle_ID: 3,
  Name_DocTitle_ID_Human: 4,
  API_Number: 5,
  API_Number_Name: 6,
};


function getVerificationLevel(richDocObj) {
  var verificationLevel = VerificationLevelEnum.NotVerified;
  if (richDocObj.nameMatch != null) {
    verificationLevel = VerificationLevelEnum.Name;
    if (richDocObj.document.type) {
      verificationLevel = VerificationLevelEnum.Name_DocTitle;
      if (richDocObj.document.documentId) {
        verificationLevel = VerificationLevelEnum.Name_DocTitle_ID;
      }
    }
  } 
  return verificationLevel;
}

var resumeSampleData = {
    "attributeId": 6, "attributeName": "Resume", "classification": "Profile",
    "dataType": "Document", "attributeType": "SingleValue", "options": []
};

var richDocSampleData = 
        {
            "attributeId": 122, "attributeName": "IDProofs",
            "classification": "Document", "dataType": "Document", "attributeType": "MultiValue",
            
            "options": [
                { "id": 1, "answerOptionId": 5815, "uploaded": "yes", "name": "VoterID", "isVerified": false, "has": false, "confidence": 0, "labelSeeker": "Has VoterID", "labelPost": "Need VoterID" },
                { "id": 2, "answerOptionId": 5816, "uploaded": "yes", "name": "RationCard", "isVerified": false, "has": false, "confidence": 0, "labelSeeker": "Has RationCard", "labelPost": "Need RationCard" },
                { "id": 3, "answerOptionId": 5817, "uploaded": "yes", "name": "DrivingLicense", "isVerified": false, "has": false, "confidence": 0, "labelSeeker": "Has DrivingLicense", "labelPost": "Need DrivingLicense" },
                { "id": 4, "answerOptionId": 5818, "uploaded": "yes", "name": "AadharCard", "isVerified": false, "has": false, "confidence": 0, "labelSeeker": "Has AadharCard", "labelPost": "Need AadharCard" },
                //misspelled...
            
                { "id": 5, "answerOptionId": 5819, "uploaded": "yes", "name": "Passport", "isVerified": false, "has": false, "confidence": 0, "labelSeeker": "Has Passport", "labelPost": "Need Passport" },
            
                //need new IDs    
                { "id": 6, "answerOptionId": 581999, "uploaded": "yes", "name": "PANCard", "isVerified": false, "has": false, "confidence": 0, "labelSeeker": "Has PANCard", "labelPost": "Need PANCard" },
                { "id": 7, "answerOptionId": 581999, "uploaded": "yes", "name": "PaySlip", "isVerified": false, "has": false, "confidence": 0, "labelSeeker": "Has PaySlip", "labelPost": "Need PaySlip" },
                { "id": 8, "answerOptionId": 581999, "uploaded": "yes", "name": "CompanyCard", "isVerified": false, "has": false, "confidence": 0, "labelSeeker": "Has CompanyCard", "labelPost": "Need CompanyCard" }
            ]
    }
        



////////////////////////////////////////////////////////////////////////////
//// FACE RECO /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////


//Find the face...
function detectFace(inputFile, callback) {
  vision.detectFaces(inputFile, function(err, faces) {
    if (err) {
      return callback(err);
    }
    //console.log('face result:', JSON.stringify(faces, null, 2));
    if (faces != null && faces.length > 0) {
        var headBounds = faces[0].bounds.head;
        console.log('headBounds result:', JSON.stringify(headBounds, null, 2));
        cropFace(inputFile,headBounds, callback);
    }
    
    callback(null, faces);
  });
}


/* 
 "head": [
        {
          "x": 492,
          "y": 259
        },
        {
          "x": 578,
          "y": 259
        },
        {
          "x": 578,
          "y": 358
        },
        {
          "x": 492,
          "y": 358
        }
      ],
*/
function cropFace(inputFile,headBounds,callback) {
    var gm = require('gm')
      , dir =  './output';
      
      var width = headBounds[1].x - headBounds[0].x; 
      var height = headBounds[2].y - headBounds[1].y;
      var x = headBounds[0].x;
      var y = headBounds[0].y;
    
    gm(inputFile)
      .crop(width, height, x, y) //.crop(200, 155, 300, 0)  
      .write(dir + "/crop.jpg", function(err){ //write to local directory
        if (err) return console.dir(arguments)
        console.log(this.outname + " created  ::  " + arguments[3])
      }
    ) 
}

////////////////////////////////////////////////////////////////////////////////////////
/////// ERROR HANDLING /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////


/* 
                  handleError("saveRichDocToBJ", session, error, putData,
                        "Sorry, I failed to save your data back to Babajob."
                        , uri, body);
                        */
function handleError(functionName,
  errorDetails, parameters,
  userMsg, uri, responseBody) {
  console.log("ERROR:" + functionName);
  console.log("ERROR Details:" + errorDetails);
  console.log("ERROR parameters:" + parameters);
  console.log("ERROR userMsg:" + userMsg);
  console.log("ERROR uri:" + uri);
  console.log("ERROR responseBody:" + responseBody); 
}


module.exports = richDocs;