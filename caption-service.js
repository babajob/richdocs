// The exported functions in this module makes a call to Microsoft Cognitive Service Computer Vision API and return caption
// description if found. Note: you can do more advanced functionalities like checking
// the confidence score of the caption. For more info checkout the API documentation:
// https://www.microsoft.com/cognitive-services/en-us/Computer-Vision-API/documentation/AnalyzeImage

const request = require('request').defaults({ encoding: null });
var $ = require('jQuery');

var key = "30f4242a4da848ba9f9a5f4e788f7fcb";

//const VISION_URL = 'https://api.projectoxford.ai/vision/v1.0/analyze/?visualFeatures=Description&form=BCSIMG&subscription-key=' + key; // process.env.MICROSOFT_VISION_API_KEY;
const VISION_URL = 'https://api.projectoxford.ai/vision/v1.0/analyze/?visualFeatures=Description&form=BCSIMG&subscription-key=' + key; // process.env.MICROSOFT_VISION_API_KEY;


/** 
 *  Gets the caption of the image from an image stream
 * @param {stream} stream The stream to an image.
 * @return {Promise} Promise with caption string if succeeded, error otherwise
 */
exports.getCaptionFromStream = stream => {
    return new Promise(
        (resolve, reject) => {
            const requestData = {
                url: VISION_URL,
                encoding: 'binary',
                headers: { 'content-type': 'application/octet-stream' }
            };

            stream.pipe(request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode !== 200) {
                    reject(body);
                }
                else {
                    resolve(extractCaption(JSON.parse(body)));
                }
            }));
        }
    );
};

/** 
 * Gets the caption of the image from an image URL
 * @param {string} url The URL to an image.
 * @return {Promise} Promise with caption string if succeeded, error otherwise
 */
exports.getCaptionFromUrl = url => {
    return new Promise(
        (resolve, reject) => {
            const requestData = {
                url: VISION_URL,
                json: { 'url': url }
            };

            request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode !== 200) {
                    reject(body);
                }
                else {
                    resolve(extractCaption(body));
                }
            });
        }
    );
};

/**
 * Extracts the caption description from the response of the Vision API
 * @param {Object} body Response of the Vision API
 * @return {string} Description if caption found, null otherwise.
 */
const extractCaption = body => {
    if (body && body.description && body.description.captions && body.description.captions.length) {
        return body.description.captions[0].text;
    }

    return null;
};


/** 
 * @param {string} url The URL to an image.
 * @return {Promise} Promise with body if succeeded, error otherwise
 */
exports.getThumbnail = url => {
    return new Promise(
        (resolve, reject) => {

/*            
             var params = {
            // Request parameters
            "width": "{number}",
            "height": "{number}",
            "smartCropping": "true",
        };
        */    
            var height = 80;
            var width = 160;
            
            const requestData = {
                url: "https://westus.api.cognitive.microsoft.com/vision/v1.0/generateThumbnail?width=" + width + "&height=" + height + "&smartCropping=true" , // VISION_URL, ocr
                json: { 'url': url },
                headers: {
                    "Content-Type": "application/json",
                    "Ocp-Apim-Subscription-Key": key
                },
                
            };     
            request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode !== 200) {
                    reject(body);
                }
                else {
                    resolve(body);
                }
            });
        }
    );
};



/** 
 * @param {string} url The URL to an image.
 * @return {Promise} Promise with body if succeeded, error otherwise
 */
exports.getBodyFromUrl = url => {
    return new Promise(
        (resolve, reject) => {

            var params = {
                // Request parameters
                "language": "unk",
                "detectOrientation ": "true",
            };

            params = {
                "visualFeatures": "Faces,Adult",
                //"details": "{string}",
                "language": "en",
                 
            }
            const requestData = {
                //url: "https://westus.api.cognitive.microsoft.com/vision/v1.0/analyze?visualFeatures=Faces,Adult&language=en" , // VISION_URL, ocr
                url: "https://westus.api.cognitive.microsoft.com/vision/v1.0/ocr?language=unk&detectOrientation=true" , // VISION_URL, ocr
                json: { 'url': url },
                headers: {
                    "Content-Type": "application/json",
                    "Ocp-Apim-Subscription-Key": key
                },
                
            };
/*
{ adult:
   { isAdultContent: false,
     isRacyContent: false,
     adultScore: 0.03398316726088524,
     racyScore: 0.03725968301296234 },
  requestId: 'e887614a-466a-4f7b-9bd5-5bdf4ab5c348',
  metadata: { width: 1536, height: 2048, format: 'Jpeg' },
  faces:
   [ { age: 37,
       gender: 'Male',
       faceRectangle: { left: 1195, top: 1320, width: 149, height: 149 } } ] }
*/            
            
            request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode !== 200) {
                    reject(body);
                }
                else {
                    resolve(extractBody(body));
                }
            });
        }
    );
};



exports.getTextSummaryForMsftOcr = body => {
    var summary = "";
    var textParts = [];
    if (body.regions) {
        body.regions.forEach(function (region) {
            region.lines.forEach(function (line) {
                line.words.forEach(function(word) {
                    textParts.push(word.text);        
                }, this);
            }, this);
        }, this);
    }
    if (textParts.length > 0) {
        summary = textParts.join(" ");
    }
    return summary;
}    
/*
{ language: 'en',
  textAngle: -9.500000000000037,
  orientation: 'Up',
  regions:
   [ { boundingBox: '85,709,614,522',
       lines:
        [ { boundingBox: '162,709,537,119',
            words:
             [ { boundingBox: '162,709,171,65', text: 'INCOME' },
               { boundingBox: '342,732,357,96', text: 'TAKDEPARTMENT' } ] },
          { boundingBox: '170,825,404,89',
            words:
             [ { boundingBox: '170,825,120,48', text: 'SEAN' },
               { boundingBox: '301,844,273,70', text: 'BLAGSVEDr' } ] },
          { boundingBox: '146,921,368,86',
            words:
             [ { boundingBox: '146,921,98,46', text: 'DON' },
               { boundingBox: '268,940,246,67', text: 'BLAGSVDr' } ] },
          { boundingBox: '122,1034,237,70',
            words: [ { boundingBox: '122,1034,237,70', text: '17/02/1976' } ] },
          { boundingBox: '92,1076,491,101',
            words:
             [ { boundingBox: '92,1076,188,55', text: 'Permanent' },
               { boundingBox: '286,1107,149,48', text: 'Account' },
               { boundingBox: '443,1130,140,47', text: 'Number' } ] },
          { boundingBox: '85,1151,315,80',
            words: [ { boundingBox: '85,1151,315,80', text: 'AJGPB7S06B' } ] } ] },
     { boundingBox: '990,833,168,65',
       lines:
        [ { boundingBox: '990,833,168,65',
            words: [ { boundingBox: '990,833,168,65', text: 'GOVT' } ] } ] },
     { boundingBox: '1266,1776,55,115',
       lines:
        [ { boundingBox: '1266,1776,55,115',
            words: [ { boundingBox: '1266,1776,55,115', text: '1\'1.11.' } ] } ] } ] }

*/


/**
 * Extracts the caption description from the response of the Vision API
 * @param {Object} body Response of the Vision API
 * @return {string} Description if caption found, null otherwise.
 */
const extractBody = body => {
    if (body) {
        return body;
    }

    return null;
};

