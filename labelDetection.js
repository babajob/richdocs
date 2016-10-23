// Copyright 2016, Google, Inc.


'use strict';

// [START app]
// [START import_libraries]

var Vision = require('@google-cloud/vision');
var vision = Vision();



// [END import_libraries]

// [START authenticate]
// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GCLOUD_PROJECT environment variable. See
// https://googlecloudplatform.github.io/gcloud-node/#/docs/google-cloud/latest/guides/authentication

// Instantiate a vision client
//var vision = Vision();
// [END authenticate]

/**
 * Uses the Vision API to detect labels in the given file.
 */
// [START construct_request]
function detectLabels (inputFile, callback) {
  // Make a call to the Vision API to detect the labels
  vision.detectLabels(inputFile, { verbose: true }, function (err, labels) {
    if (err) {
      return callback(err);
    }
    console.log('result:', JSON.stringify(labels, null, 2));
    callback(null, labels);
  });
}
// [END construct_request]

// Run the example
function main (inputFile, callback) {
  detectLabels(inputFile, function (err, labels) {
    if (err) {
      return callback(err);
    }

    // [START parse_response]
    console.log('Found label: ' + labels[0].desc + ' for ' + inputFile);
    // [END parse_response]
    callback(null, labels);
  });
}

// [START run_application]
if (module === require.main) {
  if (process.argv.length < 3) {
    console.log('Usage: node labelDetection <inputFile>');
    process.exit(1);
  }
  var inputFile = process.argv[2];
  main(inputFile, console.log);
}
// [END run_application]
// [END app]

exports.main = main;