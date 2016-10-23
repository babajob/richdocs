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

// [START app]
// [START import_libraries]
var S = require('string'); // http://stringjs.com/
// Instantiate a vision client
var Vision = require('@google-cloud/vision');
var vision = Vision();

//natural language
var language = require('@google-cloud/language')();
// [END import_libraries]

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
            
            console.log("result.photoURL:" + result.photoURL);
            if (!S(result.photoURL).contains(firebaseStorageBucket.trim() + "asds")) {
              //if the photoURL is not ours immediately call the next function...
              console.log("delete - photoURL was not in our domain:" + firebaseStorageBucket);
              callback(null, result);
            } else {
              console.log("delete - photoURL WAS in our domain");
              // Create a reference to the file to delete
              /*
              TODO: Hook up Google storage to actually delete the old files...
              var storageRef = storage.refFromUrl(result.photoURL);
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
      console.log("starting delete of FB Object" + id + " result:" + result.photoURL);

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
            
            console.log("result.photoURL:" + result.photoURL);
            if (!S(result.photoURL).contains(firebaseStorageBucket.trim() + "asds")) {
              //if the photoURL is not ours immediately call the next function...
              console.log("delete - photoURL was not in our domain:" + firebaseStorageBucket);
              callback(null, result);
            } else {
              console.log("delete - photoURL WAS in our domain");
              // Create a reference to the file to delete
              /*
              TODO: Hook up Google storage to actually delete the old files...
              var storageRef = storage.refFromUrl(result.photoURL);
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
      console.log("starting delete of FB Object" + id + " result:" + result.photoURL);

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

//function parsePhoto(photoURL, fireBaseKey, user, options, callback) {
richDocs.prototype.parsePhoto = function (photoURL, firebaseKey, user, options, callback) {

  //photoURL = "https://storage.googleapis.com/babarichdocs/archpass.jpg";  
  if (!photoURL) {
    callback("richDocs.parsePhoto(photoURL) is not defined");
  }  

  options = options || {
    verbose: null,
    savePictures: null,
    findFace: null,
    findEntities: null,
    offline: null
  };

  user = user || {};

  var result = {
    success: false,
    user: user,
    photoURL: photoURL,
    facePhotoURL: "",
    nameMatch: null,
    document: {
      summary: "",
      type: null,
      hasFace: null,
      humanVerified: null,
      user: { firstName: '', lastName: '', location: { stateName: null } }
    },
    googleData: {
      summaryText: null,
      fullText: null,
      face: null,
      languageEntities: null,
    },
    err: null
  }

  //for offline testing
  if (options.offline) return finallyRun(options, result, callback);
  
  console.log("starting parsePhoto firebaseBay" + firebaseKey +  " photoURL:"+ photoURL);

  async.waterfall([
    function (callback) {

      detectText(photoURL, function (err, texts) {
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
          
        //update the summary text with the name match results.
        result.document.summary = updateSummaryforMatchName(result.nameMatch, user, result.document.summary );

        //set success to true if we found a known document pattern.
        if (result.document.type) {
          result.success = true;
        }




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
    }
  ],
    function (err, result) {
      finallyRun(options, result, callback)
    }
  )
}        

function finallyRun(options, result, callback) {
    //strip the google data...
    if (!options.verbose && result.googleData) {
      result.googleData.fullText = "";
      result.googleData.face = "";
      result.googleData.languageEntities = "";
    }
    //finally print the result
    //console.log("parsePhoto result:" + JSON.stringify(result, null, 2));    
    callback(null, result);
} 

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
  
    

  //PASSPORT
  if (
    (findText("passport", texts))
  ) {
    result.document.type = "Passport";
    result.document.summary += result.document.type + " ";

    //find the passport Number
    var passportMatches = texts.match(/([A-Z])(\d\d\d\d\d\d\d)/g);
    if (passportMatches != null && passportMatches.length > 0) {
      result.document.user.passportNumber = passportMatches[0];
      result.document.summary += passportMatches[0] + " ";
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
      result.document.user.PANumber = panMatches[0];
      result.document.summary += panMatches[0] + " ";
    } else {
      var noSpaces = S(texts).replaceAll(' ', '').s; 
      panMatches = noSpaces.match(panRegex);
      if (panMatches != null && panMatches.length > 0) {
        result.document.user.PANumber = panMatches[0];
        result.document.summary += panMatches[0] + " ";
      }
    }

    //PAN Cards have a DOB...
    result.document.user.DOB = findDOB(texts);
  }
  //VoterCard
  else if (findText("election", texts) && findText("commission", texts)) {
    result.document.type = "VoterCard";
    result.document.summary += result.document.type + " ";
    //find the voterID
    var voterIDMatches = texts.match(/([A-Z][A-Z][A-Z])(\d\d\d\d\d\d\d)/g);
    if (voterIDMatches != null && voterIDMatches.length > 0) {
      result.document.user.voterID = voterIDMatches[0];
      result.document.summary += voterIDMatches[0] + " ";
    }
  }
  //Aadhaar Card
  else if (findText("Aadhaar", texts) || findText("UID", texts)) {
    result.document.type = "AadhaarCard";
    result.document.summary += result.document.type + " ";
    
    //find the aadhaar number
    var matches = texts.match(/(\d\d\d\d)(\ )(\d\d\d\d)(\ )(\d\d\d\d)/g);
    if (matches != null && matches.length > 0) {
      result.document.user.aadhaarNumber = matches[0];
      result.document.summary += matches[0] + " ";
    }
  }
  //DriverLicense
  else if (
    (findText("drive", texts) || findText("driving", texts) ||
      findText("transport", texts)
    ) && (findText("lisense", texts) || findText("licence", texts) || findText("license", texts)) ||
    
    findText("DL no", texts)
  ) {
    result.document.type = "DriverLicense";
    result.document.summary += result.document.type + " ";
    //find the license number
    if (state == "Maharashtra") {
      var matches = texts.match(/([A-Z][A-Z])-(\d\d\d\d\d\d\d\d\d\d\d\d\d)/g);
      if (matches != null && matches.length > 0) {
        result.document.user.driverLicenseNumber = matches[0];
        result.document.summary += matches[0] + " ";
      }
    } else {

      //try for back of Karnataka          
      // KA20 20140006565
      var matches = texts.match(/(KA)\d{2} \d{11}/g);
      if (matches != null && matches.length > 0) {
        result.document.user.driverLicenseNumber = matches[0];
        result.document.summary += matches[0] + " ";
        if (!result.document.user.location.stateName || result.document.user.location.stateName == '') {
          result.document.user.location.stateName = "Karnataka";
          result.document.summary += result.document.user.location.stateName + " ";
        }
      }
    }
  }
  //PALSLIP
  else if (
     findText("pay slip", texts) || findText("payslip", texts) || findText("salaryslip", texts) || findText("salary slip", texts)
  ) {
    result.document.type = "PaySlip";
    result.document.summary += result.document.type + " ";
  } 

      
  //All Card scanning...
  if (findText("male", texts)) {
    result.document.user.gender = "Male";
    result.document.summary += "Male" + " ";
  }

  if (findText("female", texts)) {
    result.document.user.gender = "Female";
    result.document.summary += "Female" + " ";
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


module.exports = richDocs;