/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

 var richdocsDB = "richdocstest";  

// Initializes FriendlyChat.
function FriendlyChat() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.messageList = document.getElementById('messages');
  this.messageForm = document.getElementById('message-form');
  this.messageInput = document.getElementById('message');
  this.submitButton = document.getElementById('submit');
  this.submitImageButton = document.getElementById('submitImage');
  this.imageForm = document.getElementById('image-form');
  this.mediaCapture = document.getElementById('mediaCapture');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signOutButton = document.getElementById('sign-out');
  this.signInSnackbar = document.getElementById('must-signin-snackbar');

  // Saves message on form submit.
  this.messageForm.addEventListener('submit', this.saveMessage.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));

  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);
  this.messageInput.addEventListener('keyup', buttonTogglingHandler);
  this.messageInput.addEventListener('change', buttonTogglingHandler);

  // Events for image upload.
  this.submitImageButton.addEventListener('click', function() {
    this.mediaCapture.click();
  }.bind(this));
  this.mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));    

  this.initFirebase();



  //TODO: check to ensure names are good...  
  //http://localhost:3001/index.html?userid=bj10001&firstName=Bob&lastName=Jain&mode=edit&desiredDocs=DriversLisence,PaySlip,AadhaarCard

  //console.log("reading params" + this.userid);  
  //userid=bj10001&name=Bob%20Jain&mode=edit
  this.userid = getUrlParameter("userid") || "BJ10001";
  this.firstName = getUrlParameter("firstName") || "No";
  this.lastName = getUrlParameter("lastName") || "Name";
  this.mode = getUrlParameter("mode") || "view";
  this.desiredDocs = getUrlParameter("desiredDocs") || "";
  this.uploadedDocArray = [];


  //Now setup UX based on parametters
  $("#nameHeader").html(this.firstName + ' ' + this.lastName);

  if (this.mode == "edit")
  {
    $("#messages").addClass("messages-edit-mode");
    $("#image-form").show();
    $(".addDocs").show();   
    
   
  }

  
  fixExifOrientation($(".message img"));

  // We load currently existing chat messages.
  this.loadMessages();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
FriendlyChat.prototype.initFirebase = function() {
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  //this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));


};

// Loads chat messages history and listens for upcoming ones.
FriendlyChat.prototype.loadMessages = function() {
  // Reference to the /messages/ database path.

 
  var richDocsListName = '/' + richdocsDB + '/by-userid/' + this.userid;

  //this.messagesRef = this.database.ref('messages');
   this.messagesRef = this.database.ref(richDocsListName);
   
  // Make sure we remove all previous listeners.
  this.messagesRef.off();

  //Set the DB ref so we can save correctly to /by-userid and /all  
  this.dbRef = this.database.ref("/");

  // Loads the last 12 messages and listen for new ones.
  var setMessage = function(data) {
    var val = data.val();
    //for old Chat client...
    //this.displayMessage(data.key, val.name, val.text, val.photoUrl, val.imageUrl);
    /*
    {
  "-KRkVRxxkMIp43Sd4kT4": {
    "document": {
      "type": "DriverLicense",
      "user": {
        "DOB": "1994-02-01T03:00:00.000Z",
        "driverLicenseNumber": "KA05 20140006565",
        "firstName": "",
        "lastName": "",
        "location": {
          "stateName": "Karnataka"
        }
      }
    },
    "googleData": {
      "summaryText": "FORM 7\nDOI 20/03/2014\nDL No. KA05 20140006565\nSee Rule 16(2)\nNAME\nSYED SALMAN PASHA\nB.G. O+\nD.O.B 01/02/1994\n19/08/2018(TR)\nVALID TILL 19/03/2034(NT)\nBADGE NO 3423 CAB\nVALID THROUGHOUT INDIA\n20/03/2014\nCOV: LMV\nLMVCAB 20/08/2015\nS/o\nBAB JAN\nADDRESS\n#55, 1ST CROSS, SARSBANDE PLAYA, BSK\nBENGALURU (RDS) 560082\nSign. Of Holder\nSign. Licencing Authority\nBENGAL URU(S)\n"
    },
    "nameMatch": "firstAndLast",
    "contentURL": "https://firebasestorage.googleapis.com/v0/b/babajob-dd6d9.appspot.com/o/10001%2F1473987451169%2FSyed%20DL.jpg?alt=media&token=dd4a1ab0-8322-4aee-8f0f-89ada8e17654",
    "success": true,
    "user": {
      "firstName": "Syed",
      "lastName": "Pasha",
      "userid": "BJ10001"
    }
  }
}
*/    

    if (val.document && val.document.type) {
      this.uploadedDocArray.push(val.document.type);//add to collection...
    }
    this.displayMessage(data.key, val.document.summary, '', val.facePhotoURL, val.contentUrl);
    
  }.bind(this);
  this.messagesRef.limitToLast(12).on('child_added', setMessage);
  this.messagesRef.limitToLast(12).on('child_changed', setMessage);
  this.messagesRef.limitToLast(12).on('child_removed', setMessage);

  //check to update encouragement to add documents...
  if (this.mode == "edit") {
    this.setNeededDocsMessage();
  }
};

// Saves a new message on the Firebase DB.
FriendlyChat.prototype.saveMessage = function(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (this.messageInput.value && this.checkSignedInWithMessage()) {
    var currentUser = this.auth.currentUser;
    // Add a new message entry to the Firebase Database.
    this.messagesRef.push({
      name: currentUser.displayName,
      text: this.messageInput.value,
      photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
    }).then(function() {
      // Clear message text field and SEND button state.
      FriendlyChat.resetMaterialTextfield(this.messageInput);
      this.toggleButton();
    }.bind(this)).catch(function(error) {
      console.error('Error writing new message to Firebase Database', error);
    });
  }
};

// Sets the URL of the given img element with the URL of the image stored in Firebase Storage.
FriendlyChat.prototype.setImageUrl = function(imageUri, imgElement) {
  // If the image is a Firebase Storage URI we fetch the URL.
  if (imageUri.startsWith('gs://')) {
    imgElement.src = FriendlyChat.LOADING_IMAGE_URL; // Display a loading image first.
    this.storage.refFromURL(imageUri).getMetadata().then(function(metadata) {
      imgElement.src = metadata.downloadURLs[0];
    });
  } else {
    imgElement.src = imageUri;
  }
};


function fixExifOrientation($img) {
  console.log("calling fixExifOrientation at source");
  $img.on('load', function () {
    console.log("calling fixExifOrientation ");
    fixExif($img);
  });
}

function fixExif($img) {
  EXIF.getData($img[0], function () {
    console.log('Exif=', EXIF.getTag(this, "Orientation"));
    switch (parseInt(EXIF.getTag(this, "Orientation"))) {
      case 2:
        $img.addClass('flip'); break;
      case 3:
        $img.addClass('rotate-180'); break;
      case 4:
        $img.addClass('flip-and-rotate-180'); break;
      case 5:
        $img.addClass('flip-and-rotate-270'); break;
      case 6:
        $img.addClass('rotate-90'); break;
      case 7:
        $img.addClass('flip-and-rotate-90'); break;
      case 8:
        $img.addClass('rotate-270'); break;
    }
  });
}

// Saves a new message containing an image URI in Firebase.
// This first saves the image in Firebase storage.
FriendlyChat.prototype.saveImageMessage = function (event) {
  var file = event.target.files[0];

  // Clear the selection in the file picker input.
  this.imageForm.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
    return;
  }

  // Check if the user is signed-in
  //if (this.checkSignedInWithMessage()) {

  // We add a message with a loading icon that will get updated with the shared image.
  //var currentUser = this.auth.currentUser;
  
  //    this.displayMessage(data.key, val.document.type, "", val.document.faceUrl, val.photoUrl);

  /*
   this.messagesRef.push({
      //name: currentUser.displayName,
      name: 'New ID Document',
      imageUrl: FriendlyChat.LOADING_IMAGE_URL,
      photoUrl: '/images/profile_placeholder.png'
      //   photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
    })
    */


  var newRichDocData = {
    document:
    {
      summary: 'Analyzing...',
      type: "Analyzing..."
    },
    nameMatch: '',
    contentUrl: FriendlyChat.LOADING_IMAGE_URL, // '',
    contentType: "image",
    facePhotoURL: '/images/profile_placeholder.png'
  }

  var passedUser = {
    firstName: this.firstName,
    lastName: this.lastName,
    userid: this.userid
  }

  
  

  // Get a key for a new richDoc if firebaseKey is not null
  var newDocKey = this.messagesRef.child(richdocsDB).push().key;

  var updates = {};
  var updatePath1 = richdocsDB + '/all/' + newDocKey;
  console.log("updatePath1", updatePath1);
  updates[updatePath1] = newRichDocData;
  
  console.log("saving pic:", this.userid);

  var newDocRef = null;   

  if (this.userid) {
    var updatePath2 = richdocsDB + '/by-userid/' + this.userid + '/' + newDocKey;
    console.log("updatePath2", updatePath2);
    updates[updatePath2] = newRichDocData;
    //store the ref to the object.
    newDocRef = this.database.ref(updatePath2);
  }

  
  
  /*
  this.messagesRef.update(updates, function (err) {
          if (err) {
            return callback(err, result);
          } else {
            callback(null, result);
          }
  */

  //save the updates...
  this.dbRef.update(updates, function (err) {
    //this.messagesRef.push(newRichDocData).then(function (data) {

    // Upload the image to Firebase Storage.
    var uploadTask = this.storage.ref(this.userid + '/' + Date.now() + '/' + file.name)
      .put(file, { 'contentType': file.type });
    // Listen for upload completion.
    uploadTask.on('state_changed', null, function (error) {
      console.error('There was an error uploading a file to Firebase Storage:', error);
    }, function () {

      // Get the file's Storage URI and update the chat message placeholder.
      var filePath = uploadTask.snapshot.metadata.fullPath;
      var refPath = this.storage.ref(filePath).toString();
      //data.update({ imageUrl: this.storage.ref(filePath).toString() });
      newDocRef.update({ contentUrl: refPath, 'contentType': file.type });
        
      var betterPhotoPath;
        
      this.storage.ref(filePath).getMetadata().then(function (metadata) {
        betterPhotoPath = metadata.downloadURLs[0];

        console.log("refPath " + betterPhotoPath);
        //Now call PUT to the RichDocs API to parse
        var firebaseKey = newDocKey; //data.key;
        var putData = {
          firstName: passedUser.firstName, lastName: passedUser.lastName,
          userid: passedUser.userid, contentUrl: betterPhotoPath, contentType: file.type
        };
        //firstname, lastName, filePath
        $.ajax({
          url: '../api/richdocs/' + firebaseKey,
          type: 'put',
          contentType: 'application/x-www-form-urlencoded',
          data: putData,
          success: function (result) {
            //the data is automatically bound with firebase...
          }
        });
      });
    }.bind(this));
  }.bind(this));
  //}
};

// Signs-in Friendly Chat.
FriendlyChat.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

// Signs-out of Friendly Chat.
FriendlyChat.prototype.signOut = function() {
  // Sign out of Firebase.
  this.auth.signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
FriendlyChat.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL;
    var userName = user.displayName;

    // Set the user's profile pic and name.
    this.userPic.style.backgroundImage = 'url(' + (profilePicUrl || '/images/profile_placeholder.png') + ')';
    this.userName.textContent = userName;

    // Show user's profile and sign-out button.
    this.userName.removeAttribute('hidden');
    this.userPic.removeAttribute('hidden');
    this.signOutButton.removeAttribute('hidden');

    // Hide sign-in button.
    this.signInButton.setAttribute('hidden', 'true');

    // We load currently existing chant messages.
    this.loadMessages();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    this.userName.setAttribute('hidden', 'true');
    this.userPic.setAttribute('hidden', 'true');
    this.signOutButton.setAttribute('hidden', 'true');

    // Show sign-in button.
    this.signInButton.removeAttribute('hidden');
  }
};

// Returns true if user is signed-in. Otherwise false and displays a message.
FriendlyChat.prototype.checkSignedInWithMessage = function() {
  // Return true if the user is signed in Firebase
  if (this.auth.currentUser) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

// Resets the given MaterialTextField.
FriendlyChat.resetMaterialTextfield = function(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
};

// Template for messages.
FriendlyChat.MESSAGE_TEMPLATE =
    '<div class="message-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
'<div class="message"></div>' +
'<a class="clear-button" onclick="deleteFireBase(this)">X</a>' +
'<div class="name"></div>' +
    '</div>';

// A loading image URL.
FriendlyChat.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// Displays a Message in the UI.
FriendlyChat.prototype.displayMessage = function(key, name, text, picUrl, imageUri) {
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = FriendlyChat.MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.messageList.appendChild(div);
  }
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
  }
  div.querySelector('.name').textContent = name;

  //add in delete function  
  //.add('onclick', function () { alert("delete" + key); });
  div.querySelector('.clear-button').setAttribute('id', "clear_button" + key);
  
  if (this.mode != "edit") {
    div.querySelector('.clear-button').setAttribute('style', "display:none");
  }

  var messageElement = div.querySelector('.message');
  if (text) { // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (imageUri) { // If the message is an image.
    var image = document.createElement('img');
    image.addEventListener('load', function() {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }.bind(this));
    this.setImageUrl(imageUri, image);
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  }
  // Show the card fading-in and scroll to view the new message.
  setTimeout(function() {div.classList.add('visible')}, 1);
  this.messageList.scrollTop = this.messageList.scrollHeight;
  this.messageInput.focus();

  //check to update encouragement to add documents...
  if (this.mode == "edit") {
    this.setNeededDocsMessage();
  }
};

FriendlyChat.prototype.setNeededDocsMessage = function() {
 //Please add your: DriversLisence,PaySlip,AadhaarCard
   //+ this.desiredDocs;

  var desiredDocArray = this.desiredDocs.split(',');

  //var neededDocs = arr_diff(desiredDocArray, this.uploadedDocArray);
  var neededDocs = desiredDocArray.diff(this.uploadedDocArray);

  
  var message = "Please add your: <b>" + neededDocs.join(", ") + "</b>"
  /*
  for (var i = 0; i < neededDocs.length; i++){
    message += neededDocs[i] + ", ";
  }
  */

  if (neededDocs != "") {
    $(".addDocs").html(message);
  } else {
    $(".addDocs").html("Thanks for uploading your: <b>" + desiredDocArray.join(", ") + "</b>");
  }
};

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

/*
//get difference between two arrays...
function arr_diff (a1, a2) {

    var a = [], diff = [];

    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }

    for (var i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }

    for (var k in a) {
        diff.push(k);
    }

    return diff;
};
*/


// Enables or disables the submit button depending on the values of the input
// fields.
FriendlyChat.prototype.toggleButton = function() {
  if (this.messageInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

// Checks that the Firebase SDK has been correctly setup and configured.
FriendlyChat.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions.');
  } else if (config.storageBucket === '') {
    window.alert('Your Firebase Storage bucket has not been enabled. Sorry about that. This is ' +
        'actually a Firebase bug that occurs rarely. ' +
        'Please go and re-generate the Firebase initialisation snippet (step 4 of the codelab) ' +
        'and make sure the storageBucket attribute is not empty. ' +
        'You may also need to visit the Storage tab and paste the name of your bucket which is ' +
        'displayed there.');
  }
};

function deleteFireBase(element) {
  if (confirm('Are you sure you want to delete this document?')) {
    console.log("deleteFB" + element.id);
    var userid = window.friendlyChat.userid;
  

    var elementIdChanged = S(element.id).replaceAll('clear_button', '');
 
    $('#' + elementIdChanged).hide("fast");

    console.log("deleting userid and id", userid, elementIdChanged);

    $.ajax({
      url: '../api/richdocs/' + userid + '/' + elementIdChanged,
      type: 'delete',
      contentType: 'application/x-www-form-urlencoded',
      success: function (result) {
        //the data is automatically bound with firebase... or at least it should be...
      }
    });
  }
}  


var splitName = function splitName(name) {
  var nameObj = {};
  //name.split(' ')

}

//READ URL params
var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? null : sParameterName[1];
        }
    }
};


window.onload = function() {
  window.friendlyChat = new FriendlyChat();
  
};

$(document).ready(function () {
  //round trip the passed parameters after doc upload...
  $('input[name=userid]').val(getUrlParameter("userid"));
  $('input[name=firstName]').val(getUrlParameter("firstName"));
  $('input[name=lastName]').val(getUrlParameter("lastName"));
  $('input[name=mode]').val(getUrlParameter("mode"));
  $('input[name=desiredDocs]').val(getUrlParameter("desiredDocs"));
});

