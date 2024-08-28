const bodyParser = require('body-parser');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const dns = require('dns');
const isUrlHttp = require('is-url-http');

//console.log(process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, { /* dbName: "urlshortner", */ useUnifiedTopology: true})
  .then(()=> console.log("mongodb is connected")).catch(error =>{ console.log(error); console.log("rawr")});


let siteSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number 
}) 

let Site = mongoose.model('Site', siteSchema);


const SubmitAndSaveSite = (site, done) => {

  let randomNum = Math.floor(Math.random() * 1000);
 
  try{
    if(!isUrlHttp(site)){
      throw new Error('Invalid URL');
    }
  

    console.log("isUrl: " + isUrlHttp(site))

  let newSite = new Site({
    original_url: site,
    //short_url value should be the last record short_url value +1
    short_url: randomNum
  })
  
  //model.prototype.save() no longer accepts a callback
  newSite.save().then(function(data){ console.log("shorturl: " + newSite.short_url); done(null, data)}).catch(function(err){ console.log("save error: " + err)});
  }catch(err){
    done(err, {error: "Invalid URL"})
  }
  
}


const FindByShortURL = (shorturl, done) => {
  Site.findOne({short_url: shorturl}).then(function(data){ console.log("data found: " + data); done(null, data)}).catch((err)=>{console.log("error found: " + err)});
}

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({extended:false}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res){
  SubmitAndSaveSite(req.body.url, (err, data) => {
    if(err) console.log(err);
    console.log("request body: " + req.body.url);
    
    if(err){
      res.json(data);
    }else{
      res.json({
        original_url: data.original_url,
        short_url: data.short_url
      })
    } 
  })
})

app.get('/api/shorturl/:shorturl', function(req, res){
  FindByShortURL(Number(req.params.shorturl), (err, data) => {
    if(err) console.log(err);
    console.log("data: " + data);
    console.log("redirected to: " + data.original_url);
    res.redirect(`${data.original_url}`);
  });
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
