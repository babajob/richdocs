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



//export GOOGLE_APPLICATION_CREDENTIALS="./RichDocsCreds.json"
//export GCLOUD_PROJECT="babarichdocs"
//node textDetection.js samples/amal.JPG "amal" "pius"


*/

'use strict';

// [START import_libraries]


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

//fileURL = "./samples/amal.jpg";
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
  options.offline = false;
  var RichDocs = require('./richDocs');
  var richDocs = new RichDocs();
  
  richDocs.parsePhoto(inputFile, user, options,
      function (err, result) {

        if (err) {
          return callback(err);
        }
        //console.log('result:', JSON.stringify(texts[0], null, 2));
        callback(null, result);
      });
      
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
   console.log("starting...");
   main(inputFile, firstName, lastName, console.log);
}
// [END run_application]
// [END app]

exports.main = main;