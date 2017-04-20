# Welcome to Babajob RichDocs
> This is a stand alone library that accepts photos (PAN Cards, Aadhaar Card, Driver's Licenses, etc) and audio files and parses them with Google and Microsoft's vision, OCR and speech reco APIs to determine the information therein and then calls various authentication APIs to verify PAN and/or Aadhaar numbers are real and match the Indian government's records. 
> This exposes itself as a CRUD based webservice. 


## Setup steps
1. Install Node 6.4 
2. Sync this Repo
3. Nav to your repo folder
4. Run `npm install`

### Get API Creds for Firebase, Google Cloud APIs and Microsoft
> Get the Creds .json files from Sean or create your own from google API cloud and Firebase
5. Add to root directory: `FirebaseServiceAccount.json`

### Google API Creds 
> be sure to change the name of your project below from `babajobrichdocs`
6. Add to root directory: `RichDocsCreds.json`

### TODO: Get Microsoft Creds
> We currently call the Microsoft Vision API to get a well-framed thumbnail of whatever 

### TODO Optional: Get BetterPlace Authentication Creds
> We use betterplace to verify Indian PAN and Aadhaar information

### TODO Optional: Get CloudConvert Authentication Creds
> We use cloudconvert to convert facebook audio clips to formats that the Google Speech Reco accepts


#To Start the Service
1. Open `git bash` 
```
cd c:
cd c:/Users/sean_/Node/richDocs
export GOOGLE_APPLICATION_CREDENTIALS="./RichDocsCreds.json"
export GCLOUD_PROJECT="babarichdocs"
nodemon
```


#Sample Commands
To ensure the service is working: `http://localhost:3001/api/richdocs`

Show form to upload docs: `http://localhost:3001/index.html`
```
http://localhost:3001/richdocs/public/index.html
http://localhost:3001/richdocs/api/richdocs
```

To DELETE

```
curl -XDELETE http://localhost:3001/api/richdocs/-KRb9H7hJbIqRc54Egwv
```