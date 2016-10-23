// Copyright 2016, Google, Inc.
/*
1. Get a file, a userid and a name
2. Run text detection
3. See if the name matches 
4. See if the photo contains any key words like UID




//TODOs
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

2. Move to expose as webservice
3. Save photo and face to FB
4. Expose on Google Cloud
5. Do address lookup on text... - likely as a separate service...

Eventual Usage
--web, apps NOT messenger...
0. Get an auth credential from a babajob userID
1. Auth to Fire
2. Call Client service to upload a file?


Setup steps
//install gm as command line tool
install the npm tools



//export GOOGLE_APPLICATION_CREDENTIALS="/path/to/keyfile.json"
//export GCLOUD_PROJECT="babarichdocs"
//node textDetection.js samples/amal.JPG "amal" "pius"


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

// [START authenticate]
// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GCLOUD_PROJECT environment variable. See
// https://googlecloudplatform.github.io/gcloud-node/#/docs/google-cloud/latest/guides/authentication
// [END authenticate]

/**
 * Uses the Vision API to detect texts in the given file.
 */
// [START construct_request]
function detectText (inputFile, callback) { 
  // Make a call to the Vision API to detect the texts  
  vision.detectText(inputFile, { verbose: false }, function (err, texts) {

    if (err) {
      return callback(err);
    }
    //console.log('result:', JSON.stringify(texts[0], null, 2));
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
function matchName(firstName,lastName,texts) {

    if (findText(S(firstName + ' ' + lastName).trim(),texts)
|| (findText(firstName,texts) && findText(lastName,texts))
) {
    return 'firstAndLast';
  }
  
   else 
    if (findText(firstName,texts)) {
      return 'firstOnly';
    } else  if (findText(lastName,texts)) {
      return 'lastOnly';
    } else {
        return null;
    }
}

//returns none, PAN, Passport, DriverLicense, 

function detectIDDocument(texts, result) {

  //PASSPORT
  if (
      (findText("passport",texts))
  ) 
  {
      result.document.type = "Passport";

      //find the passport Number
        var passportMatches = texts.match(/([A-Z])(\d\d\d\d\d\d\d)/g);
        if (passportMatches != null && passportMatches.length > 0) {
          result.document.user.passportNumber = passportMatches[0];
        }

        //PAN Cards have a DOB... (but two other dates too...)
        result.document.user.DOB = findDOB(texts);
  } 

  //PAN
  else if (
      (findText("income",texts) && findText("tax",texts))
  || (findText("PERMANENT",texts) && findText("ACCOUNT",texts))
  ) 
  {
      result.document.type = "PANCard";
      //PERMANENT ACCOUNT NUMBER\nADAPP7854L

      //find the PAN Number
        var panMatches = texts.match(/([A-Z][A-Z][A-Z][A-Z][A-Z])(\d\d\d\d)([A-Z])/g);
        if (panMatches != null && panMatches.length > 0) {
          result.document.user.PANumber = panMatches[0];
        }

        //PAN Cards have a DOB...
        result.document.user.DOB = findDOB(texts);
  } 
  //VoterCard
  else if (findText("election",texts) && findText("commission",texts)) 
      {
        result.document.type = "VoterCard";
        //find the voterID
        var voterIDMatches = texts.match(/([A-Z][A-Z][A-Z])(\d\d\d\d\d\d\d)/g);
        if (voterIDMatches != null && voterIDMatches.length > 0) {
          result.document.user.voterID = voterIDMatches[0];
        }
      }
//Aadhaar Card
  else if (findText("Aadhaar",texts) || findText("UID",texts)) 
      {
        result.document.type  = "AadhaarCard";
        //find the aadhaar number
        var matches = texts.match(/(\d\d\d\d)(\ )(\d\d\d\d)(\ )(\d\d\d\d)/g);
        if (matches != null && matches.length > 0) {
          result.document.user.aadhaarNumber = matches[0];
        }
      }
//DriverLicense
  else if ((findText("drive",texts) || findText("driving",texts) ||
  findText("transport",texts)
  ) && ( findText("lisense",texts) || findText("licence",texts) || findText("license",texts))) 
      {
        result.document.type = "DriverLicense";
        //find the license number
        /*
        var matches = texts.match(/([A-Z][A-Z][A-Z])(\d\d\d\d\d\d\d)/g);
        if (matches != null && matches.length > 0) {
          result.document.user.driverLicenseNumber = matches[0];
        }
        */
      }

      //detect a state
      result.document.user.location.state = findIndianState(texts);

    //All Card scanning...
    if  (findText("male",texts)) { result.document.user.gender = "Male"};
    if  (findText("female",texts)) { result.document.user.gender = "Female"};

    //find the date of birth
    if  ((findText("date",texts) && findText("birth",texts)) || findText("dob",texts) ) {
      result.document.user.DOB = findDOB(texts);
    };

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
      if (findText(state, input)) { foundState = states[i]; }
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


/* 
Expose as one function inputFile, {user:userid, firstName, lastName }, options: findFace, savePictures, verbose (includes Google Data)
return 
success: true | false
nameFound: true | false
document: 
  type: 
  user:
files:
  documentPhotoURL
  facePhotoURL
googleData:
  textDetection
  faceDetection
err:


*/

function parsePhoto(inputFile, user, options, callback)
{
    options = options || {
      verbose: null,
      savePictures: null,
      findFace: null,
      findEntities: null
    };

    user = user || {};

    var result = {
      success: false,
      nameMatch: null,
      document: {
        type: null,
        hasFace: null,
        humanVerified: null,
        user: {location: {state:null}}
      },
      files: {
        documentPhotoURL: null,
        facePhotoURL: null
      },
      googleData : {
        summaryText: null,
        fullText : null,
        face : null,
        languageEntities: null,
      },
      err: null
    }

    detectText(inputFile, function (err, texts) {
          if (err) {
            return callback(err);
          }
          var summary = texts[0];
          result.googleData.summaryText = summary;
          result.googleData.fullText = texts;

          result.nameMatch = matchName(user.firstName, user.lastName, summary);
          //console.log("nameMatch:" + result.nameMatch);

          result = detectIDDocument(summary,result);
          
          //set success to true if we found a known document pattern.
          if (result.document.type) 
          {
              result.success = true;
          }

          //OPTIONAL FEATURES
          //TODO: Figure out the right way to async callback these...

          //find entities in the photo (usually returns nothing useful)
          if (options.findEntities) {
            language.detectEntities(summary, function(err, entities) {
              if (err) {
                return callback(err);
              }
              result.googleData.languageEntities = entities;
              console.log('Language entities:', JSON.stringify(entities, null, 2));
            });
          }

          //the face in the photo
          if (options.findFace) {
                detectFace(inputFile,function(err,faces){
                  if (err) {
                        return callback(err);
                      }
                  result.document.hasFace = true;
                  result.googleData.face = faces;
              });
          }

          finallyRun(options, result, callback);
      });
}

function finallyRun(options, result, callback) {
    //strip the google data...
    if (!options.verbose) {
      result.googleData.fullText = "";
      result.googleData.face = "";
      result.googleData.languageEntities = "";
    }
    //finally print the result
    console.log("parsePhoto result:" + JSON.stringify(result, null, 2));    
    //callback(null);
}

// Run the example
function main (inputFile, firstName, lastName, callback) {

  //Pramila PAN
  //var fileURL = "https://storage.googleapis.com/babarichdocs/prampan.jpg";
//var fileURL = "https://storage.googleapis.com/babarichdocs/pramuid.jpg";

//random election CARD
 //fileURL = "http://3.imimg.com/data3/RA/DI/MY-513699/pvc-electrol-photo-identity-cards-epic-500x500.jpg";
//fileURL = "http://2.bp.blogspot.com/-2LAeNFXtyOo/U23BAddkBvI/AAAAAAACqVw/fGrqOR7RKeI/s1600/Pawan+Kalyan+voter+Card.jpg"
  
  

//Pramila PAN
  //var fileURL = "https://storage.googleapis.com/babarichdocs/prampan.jpg";
//var fileURL = "https://storage.googleapis.com/babarichdocs/pramuid.jpg";

//random election CARD
 //fileURL = "http://3.imimg.com/data3/RA/DI/MY-513699/pvc-electrol-photo-identity-cards-epic-500x500.jpg";
//fileURL = "http://2.bp.blogspot.com/-2LAeNFXtyOo/U23BAddkBvI/AAAAAAACqVw/fGrqOR7RKeI/s1600/Pawan+Kalyan+voter+Card.jpg"
  
  var fileURL;
  //fileURL = "http://3.bp.blogspot.com/-wjE-n6YDs9E/VJBsuYOwfTI/AAAAAAAAAo0/4bOTgXMfoqM/s1600/PAN-CARD.jpg";
  // fileURL = "https://storage.googleapis.com/babarichdocs/prampan.jpg";

 //passport
 //fileURL = "https://storage.googleapis.com/babarichdocs/seanpassport.jpg";

//archana passport
//fileURL = "https://storage.googleapis.com/babarichdocs/archpass.jpg"
//fileURL = "./archpass-small.jpg"

fileURL = "./JonDriver.jpg";
fileURL = "http://www.charteredclub.com/wp-content/uploads/2013/04/PAN-CARD.jpg";

fileURL = "./samples/amal.jpg";
//DRIVING license
//fileURL = "http://www.fingerprintsscanner.com/wp-content/uploads/2013/10/Biometric-Driving-Licence5.jpg";

  inputFile = fileURL; //override the input file

  var user = {};
  user.firstName = firstName;
  user.lastName = lastName;
  user.userid = "BJ10001";

  var options = {};
  options.findFace = true;
  options.verbose = false;
  parsePhoto(inputFile, user, options, callback);
}

// [START run_application]
if (module === require.main) {
  if (process.argv.length < 4) {
    console.log('Usage: node textDetection <inputFile> "FirstName" "LastName"');
    process.exit(1);
  }
  var inputFile = process.argv[2];
  var firstName = process.argv[3];
   var lastName = process.argv[4];
   console.log("starting...")
  main(inputFile, firstName, lastName, console.log);
}
// [END run_application]
// [END app]

exports.main = main;