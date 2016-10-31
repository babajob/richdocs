var express = require('express');
var router = express.Router();
var RichDocs = require('../richDocs');
var richDocs = new RichDocs();
    


/* GET api listing. */
/*
RichDocs API
POST - push a new Photo
GET - Get all recently push RichDoc Photos
GET/ID - Get all rich docs for babajob userid


TODO:
PUT
DELETE
*/

//getAll
router.get('/richdocs', function (req, res, next) {
  // Get a database reference to our posts
  richDocs.getAll(
    function (err, result) {
      if (err) {
        res.send(JSON.stringify(err));
      } else {
        res.send(JSON.stringify(result, null, 2));
      }
    }
  );
}); 

/*
router.get('/richdocs/:bjid', function(req, res, next) {
  var bjid = req.params.bjid;
  res.send('richdocs for BabajobUserID' + bjid);
});
*/

//get by Firebase ID
//curl -XGET http://localhost:3001/api/richdocs/-KRTIzBONLSpuomi0k6X
router.get('/richdocs/:id', function(req, res, next) {
  var id = req.params.id;

  richDocs.get(id,
    function (err, result) {
      if (err) {
        res.send(JSON.stringify(err));
      } else {
        res.send(JSON.stringify(result, null, 2));
      }
    }
  );  
});


//DELETE BY USERID
//curl -XDELETE http://localhost:3001/api/richdocs/-KRayREIz57HOJGPIYR5
//curl -XDELETE http://localhost:3001/api/richdocs/-KRXozlE6QIR44MMALRW 
//curl -XDELETE http://localhost:3001/api/richdocs/-KRMrtFFCUX9XO8Lh7ZC
//delete by firebase object id
router.delete('/richdocs/:userid/:id', function(req, res, next) {
  var id = req.params.id;
  var userid = req.params.userid;
  
  richDocs.deleteByUserIdAndId(userid, id,
    function (err, result) {
      if (err) {
        res.send(JSON.stringify(err));
      } else {
        res.send(JSON.stringify(result, null, 2));
      }
    }
  );  
});


//curl -XDELETE http://localhost:3001/api/richdocs/-KRayREIz57HOJGPIYR5
//curl -XDELETE http://localhost:3001/api/richdocs/-KRXozlE6QIR44MMALRW 
//curl -XDELETE http://localhost:3001/api/richdocs/-KRMrtFFCUX9XO8Lh7ZC
//delete by firebase object id
router.delete('/richdocs/:id', function(req, res, next) {
  var id = req.params.id;
  
  richDocs.deleteById(id,
    function (err, result) {
      if (err) {
        res.send(JSON.stringify(err));
      } else {
        res.send(JSON.stringify(result, null, 2));
      }
    }
  );  
});


router.post('/richdocs', function (req, res, next) {

  var user = {};
  if (req.body.firstName == null || req.body.lastName == null || req.body.userid == null
    || req.body.contentType == null || req.body.contentUrl == null
  ) {
    res.send("Params missing: firstName, lastName or userid, contentType, contentUrl");
  } else {

    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    //user.name = req.body.name;
    user.userid = req.body.userid;

    //var fileURL = "http://www.fingerprintsscanner.com/wp-content/uploads/2013/10/Biometric-Driving-Licence5.jpg"
    var richDoc = {};
    richDoc.contentUrl = req.body.contentUrl;
    richDoc.contentType = req.body.contentType || "image";

    if (req.body.matchPhrase) {
      richDoc.matchPhrase = req.body.matchPhrase || "";
    }

    if (req.body.documentHint) {
      richDoc.documentHint = req.body.documentHint || "";
    }



    var options = {};
    options.findFace = false;
    options.verbose = false;
    options.offline = false;
      
    richDocs.parseRichDoc(richDoc, null, user, options,
      function (err, result) {
        if (err) {
          res.send(JSON.stringify(err));
        } else {
          res.send(JSON.stringify(result, null, 2));
        }
      });
  }
}
);


//updates an existing richDocs object after parse...
router.put('/richdocs/:id', function (req, res, next) {
  var firebaseKey = req.params.id;

  if (!firebaseKey) {
    res.send("no firebase key passed");
  } else {
    
    var user = {};

    if (req.body.firstName == null || req.body.lastName == null || req.body.userid == null
      || req.body.contentType == null || req.body.contentUrl == null
    ) {
      res.send("Params missing: firstName, lastName or userid, contentType, contentUrl");
    }
    else {
      user.firstName = req.body.firstName;
      user.lastName = req.body.lastName;
      user.userid = req.body.userid;
    
      var richDoc = {};
      richDoc.contentUrl = req.body.contentUrl;
      richDoc.contentType = req.body.contentType || "image";

   
      if (req.body.matchPhrase) {
        richDoc.matchPhrase = req.body.matchPhrase || "";
      }

      if (req.body.documentHint) {
        richDoc.documentHint = req.body.documentHint || "";
      }
        
      console.log("PUT:" + richDoc.contentUrl);


      var options = {};
      options.findFace = false;
      options.verbose = false;
      options.offline = false;

      richDocs.parseRichDoc(richDoc, firebaseKey, user, options,
        function (err, result) {
          if (err) {
            res.send(JSON.stringify(err));
          } else {
            res.send(JSON.stringify(result, null, 2));
          }
        });
    }
  }
}  
);


module.exports = router;
