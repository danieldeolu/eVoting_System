
const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const bitcoin = new Blockchain();


//initialize module for favicon
let favicon = require('serve-favicon');
let path = require('path');
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use('/favicon.ico', express.static('public/favicon.ico'))

//create another blockchain that will hold the testing
const bitTest = new Blockchain();
let encryptedTestBallots = [];
let encryptedTestPresidentialBallot = [];
let encryptedTestSenatorialBallot = [];
let noOfGeneratedTestBallotMined = 0;
let nextGeneratedBallotMineFlag = false;
let nextMiningMonitor = false;


//to set up cors
var cors = require('cors');

//create functions/variables to measure program execution time

let newStart = process.hrtime();
let newEnd = process.hrtime(newStart);


const uuid = require('uuid/v1'); //creates random strings
//const port = process.argv[2] //refers to the 2 element of the "start" script in package.json
const port = process.env.PORT || 3002
const rp = require('request-promise');
const paill = require('./paillierEnc');
let paillierEnc = new paill();

//import the paillier class for the test blockchain
const paillTest = require('./paillierTest');
let paillierEncTest = new paillTest();
let ballotOverflowFlag; //flag to signify addition of 2 extra ballots;
let ballotOverFlowNumber = 0;

//set up sh256 to hash the final votes count email
const sha256Hash = require('sha256');
//const hash = sha256Hash(dataAsString);

//import module for nodemailer
var nodemailer = require('nodemailer')

//imports for e-voting

var expressHandlebars = require('express-handlebars')
var multer = require('multer');
var upload = multer();
var session = require('express-session');
var cookieParser = require('cookie-parser');

//end of imports for e-voting functionality

//create helpers to allow us send over data
var hbs = expressHandlebars.create({
    //specify helpers which are only registered on this instance.
    helpers: {
        foo: function(){ return "FOO!";},
        bar: function(){ return "BAR!";}
    }
})

//define some containers for the email to be sent
let emailVoterID = null; //req.session.user.id
let  emailRecipient = null; // req.session.user.email;  


//define some containers for ballots
let ballot = []; //holds the ballot casted by a user.
let encryptedBallots = []; //holds the entire encrypted ballot casted by user.
let presidentialBallot = [];
let senatorialBallot = [];
let encryptedPresidentialBallot = [];
let encryptedSenatorialBallot = [];
let oneVoteFlag = true; //makes sure a voter votes once
let globalTallyResult = null;

//define some containers for voters details
let allUsers = [] //stores the list of all users retrieved from the database.
let loggedInVoterId = null //stores id the current logged in voter
let allVotedUsers = [] //stores the list of all voters that have voted already.
let allVoterEmailAddress = [];






// the following are needed to use views
app.engine('handlebars', hbs.engine, expressHandlebars({ defaultLayout: 'main'}))
app.set('view engine', 'handlebars')



// this is necessary to parse form responses
app.use(bodyParser.json({limit: '500mb'}));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(upload.array());
app.use(cookieParser());


app.use(express.static('public'));

app.use(session({secret: "Your secret key", saveUninitialized: true, 
resave: true}));


app.use(cors())


//end of e-voting middlewares

//Initialize some modules for db storage.
var myCrud = require('./crud');
var crudUsers = new myCrud("MyDB", "users"); //retrieve register voters list

var testCrudUsers = new myCrud("MyDB", "testUsers"); 

var cvotes = new myCrud("MyDB", "votes"); //retrieve already existing votes

var adminDB = new myCrud("MyDB", "admin"); //retrieve the login details of the admin

var alreadyVoted = new myCrud("MyDB", "alreadyVoted"); //retrieve the list of voters who have casted ballots already

//define some containers to entirely stop the voting process by the admin.
let stopVotingFlag = new myCrud("MyDB", "stopVotingFlag");

//define containers for login credentials for the testing blockchain.
let bitTestDB = new myCrud("MyDB", "bitTestUser");


//DEFINE THE FUNCTION TO CHECK IF A USER IS LOGGED IN.
let checkSignIn =  function (req, res, next){
    if(req.session.user){
       next();    //If session exists, proceed to page
    } 
    else {
        var err = new Error('Not logged in');
        next (err);
    }
    
    // else {
    //    var err = new Error("Not logged in!");
    //    console.log(req.session.user);
    //   next(err);  //Error, trying to access unauthorized page!
    // }
 }

// end of modules for db
let storeFlag = false;
let voted = []; //is an array which stores the id of the individuals who have logged  in and logged out successfully, hence they cant login again to vote.
let alreadyVotedFlag = null //helps to prevent the voter from being able to vote more than once.

//const nodeAddress = ("0x000FUTMin")+uuid().split('-').join('');
const nodeAddress = uuid().split('-').join('');


 //new edit
 let newCurrentVotedUser = null;
 let formerCurrentVotedUser = null;


//app.use(bodyParser.urlencoded({extended: false})) //parses form data

//uncomment this to add another admin using post man
// app.post('/adminSignUp', async function(req, res){
//     let data = {
//         "id": req.body.id, 
//         "password": req.body.password
// }

//     await adminDB.add(data);

//     res.send("admin added")
// })


let politicalPartiesJson = [
    {
        "index": "0", 
        "partyName": "Accord Party",
        "partyAcronym" : "A"
    },

    {
        "index": "1", 
        "partyName": "Action Alliance", 
        "partyAcronym" : "AA"
    },

    {
        "index": "2", 
        "partyName": "Action Democratic Party", 
        "partyAcronym" : " ADP"
    },

    {
        "index": "3", 
        "partyName": "Action Peoples Party",
        "partyAcronym" : "APP"
    },


    {
        "index": "4", 
        "partyName": "All Progressives Congress",
        "partyAcronym" : "APC"
    },

    {
        "index": "5", 
        "partyName": "All Progressives Grand Alliance",
        "partyAcronym" : "APGA"
    },

    {
        "index": "6", 
        "partyName": "Boot Party",
        "partyAcronym" : "BP"
    },

    {
        "index": "7", 
        "partyName": "KOWA Party",
        "partyAcronym" : "KP"
    },


    {
        "index": "8", 
        "partyName": "Labour Party",
        "partyAcronym" : "LP"
    },

    {
        "index": "9", 
        "partyName": "National Rescue Movement",
        "partyAcronym" : "NRM"
    },

    {
        "index": "10", 
        "partyName": "New Nigeria Peoples Party",
        partyName: "NNPP"
    },

    {
        "index": "11", 
        "partyName": "Peoples Democratic Party",
        "partyAcronym" : "PDP"
    },


    {
        "index": "12", 
        "partyName": "Peoples Redemption Party",
        "partyAcronym" : "PRP"
    },

    {
        "index": "13", 
        "partyName": "Social Democratic Party",
        "partyAcronym" : "SDP"
    },

    {
        "index": "14", 
        "partyName": "Young Progressive Party",
        "partyAcronym" : "YPP"
    },

    {
        "index": "15", 
        "partyName": "Zenith Labour Party (ZLP)",
        "partyAcronym" : "ZLP"
    },  
];



app.get('/', function(req, res){
    res.send(bitcoin);
})
app.get ('/dummyEndPoint', function(req, res){
    console.log("Inside the dummy endpoint");
    res.json({"name":"this is the dummy endpoint"})
})

app.get('/blockchain', function (req, res) {
   //sends the entire blockchain content
   res.send(bitcoin)
})


//the blockchain explorer endpoint to view the entire ledger
app.get('/blockledger', function(req, res, next){
    console.log("Inside the blockledger endpoint")
    res.sendFile('./block-explorer/blockledger.html', {root: __dirname});
})

app.get('/ip', function(req, res){
    let returnData = null
    let reqLocation  = "http://httpbin.org/ip";
    const requestPromises = [];
    const requestOptions = {
        uri : reqLocation,
        method: 'GET', 
        json : true
    }

    requestPromises.push(rp(requestOptions));

    try{
    Promise.all(requestPromises).then(data =>{
        returnData = data
        console.log(data)
        res.json({"ip": data})
    })}
    catch (error){
        console.log(error, 'is the called error.')
        res.json({"ip": returnData});
    }
    
    
})


app.get("/blockrender", function(req, res){
    res.render('blockledger');
})


//define some middleware to protect keeping chain up to data

app.use('/start', checkSignIn, function(err, req, res, next){
    res.redirect('/adminLogin'); //redirects the user back to login if credentials are not correct.
})


app.use('/stop', checkSignIn, function(err, req, res, next){
    res.redirect('/adminLogin'); //redirects the user back to login if credentials are not correct.
})

app.use('/continue', checkSignIn, function(err, req, res, next){
    res.redirect('/adminLogin'); //redirects the user back to login if credentials are not correct.
})


app.use('/update', checkSignIn, function(err, req, res, next){
    res.redirect('/adminLogin'); //redirects the user back to login if credentials are not correct.

})

//define endpoint to send the result of the election to all the voters.
app.use('/makeResultsPublic', checkSignIn, function(err, req, res, next){
    res.redirect('/adminLogin'); //redirects the user back to login if credentials are not correct.
})


app.get('/makeResultsPublic', checkSignIn, async function(req, res){
    //first we check to obtain the list of all registered voters.
    allUsers = await crudUsers.get(); // retrieves the list of all users from the db
    allVotedUsers = await alreadyVoted.get() //retrieves the list of all users who have voted already from the db
    
    //then we check to bring out the email address of all the users that have voted.
    //let allEmailAddress = [];
    allUsers.forEach(function(registeredUser){
        allVotedUsers.forEach(function(votedUser){
            if(votedUser.id == registeredUser.id){
                allVoterEmailAddress.push(registeredUser.email)
            }
        })
    })


    //then I print out the email address of all voters that have voted.
    console.log("Here is the email address of all users that have voted.")
    for(let i=0;i<allVoterEmailAddress.length;i++){
        console.log(allVoterEmailAddress[i],"\n");
    }

    // let tallyResult = {
    //     id: req.session.user.id, 

    //     presidentialAPC: finalResult1.APC, 
    //     presidentialPDP: finalResult1.PDP, 
    //     presidentialAPGA: finalResult1.APGA, 

    //     senatorialAPC:finalResult2.APC, 
    //     senatorialPDP:finalResult2.PDP, 
    //     senatorialAPGA:finalResult2.APGA
    // }
    let presidentialHash1 = "sha256Hash(globalTallyResult.presidentialA)"
    let presidentialHash2 = "sha256Hash(globalTallyResult.presidentialAA)"
    let presidentialHash3 = "sha256Hash(globalTallyResult.presidentialADP)"
    let presidentialHash4 = "sha256Hash(globalTallyResult.presidentialAPP)"
    let presidentialHash5 = "sha256Hash(globalTallyResult.presidentialAPC)"
    let presidentialHash6 = "sha256Hash(globalTallyResult.presidentialAPGA)"
    let presidentialHash7 = "sha256Hash(globalTallyResult.presidentialBP)"
    let presidentialHash8 = "sha256Hash(globalTallyResult.presidentialKP)"
    let presidentialHash9 = "sha256Hash(globalTallyResult.presidentialLP)"
    let presidentialHash10 = "sha256Hash(globalTallyResult.presidentialNRM)"
    let presidentialHash11 = "sha256Hash(globalTallyResult.presidentialNNPP)"
    let presidentialHash12 = "sha256Hash(globalTallyResult.presidentialPDP)"
    let presidentialHash13 = "sha256Hash(globalTallyResult.presidentialPRP)"
    let presidentialHash14 = "sha256Hash(globalTallyResult.presidentialSDP)"
    let presidentialHash15 = "sha256Hash(globalTallyResult.presidentialYPP)"
    let presidentialHash16 = "sha256Hash(globalTallyResult.presidentialZLP)"


    let senatorialHash1 = "sha256Hash(globalTallyResult.senatorialA)"
    let senatorialHash2 = "sha256Hash(globalTallyResult.senatorialAA)"
    let senatorialHash3 = "sha256Hash(globalTallyResult.senatorialADP)"
    let senatorialHash4 = "sha256Hash(globalTallyResult.senatorialAPP)"
    let senatorialHash5 = "sha256Hash(globalTallyResult.senatorialAPC)"
    let senatorialHash6 = "sha256Hash(globalTallyResult.senatorialAPGA)"
    let senatorialHash7 = "sha256Hash(globalTallyResult.senatorialBP)"
    let senatorialHash8 = "sha256Hash(globalTallyResult.senatorialKP)"
    let senatorialHash9 = "sha256Hash(globalTallyResult.senatorialLP)"
    let senatorialHash10 = "sha256Hash(globalTallyResult.senatorialNRM)"
    let senatorialHash11 = "sha256Hash(globalTallyResult.senatorialNNPP)"
    let senatorialHash12 = "sha256Hash(globalTallyResult.senatorialPDP)"
    let senatorialHash13 = "sha256Hash(globalTallyResult.senatorialPRP)"
    let senatorialHash14 = "sha256Hash(globalTallyResult.senatorialSDP)"
    let senatorialHash15 = "sha256Hash(globalTallyResult.senatorialYPP)"
    let senatorialHash16 = "sha256Hash(globalTallyResult.senatorialZLP)"

    



    try{
    //I hash the results of the election to include in the mass email sending.
     
     presidentialHash1 = sha256Hash(""+globalTallyResult.presidentialA);
     presidentialHash2 = sha256Hash(""+globalTallyResult.presidentialAA);
     presidentialHash3 = sha256Hash(""+globalTallyResult.presidentialADP);
     presidentialHash4 = sha256Hash(""+globalTallyResult.presidentialAPP);
     presidentialHash5 = sha256Hash(""+globalTallyResult.presidentialAPC);
     presidentialHash6 = sha256Hash(""+globalTallyResult.presidentialAPGA);
     presidentialHash7 = sha256Hash(""+globalTallyResult.presidentialBP);
     presidentialHash8 = sha256Hash(""+globalTallyResult.presidentialKP);
     presidentialHash9 = sha256Hash(""+globalTallyResult.presidentialLP);
     presidentialHash10 = sha256Hash(""+globalTallyResult.presidentialNRM);
     presidentialHash11 = sha256Hash(""+globalTallyResult.presidentialNNPP);
     presidentialHash12 = sha256Hash(""+globalTallyResult.presidentialPDP);
     presidentialHash13 = sha256Hash(""+globalTallyResult.presidentialPRP);
     presidentialHash14 = sha256Hash(""+globalTallyResult.presidentialSDP);
     presidentialHash15 = sha256Hash(""+globalTallyResult.presidentialYPP);
     presidentialHash16 = sha256Hash(""+globalTallyResult.presidentialZLP);
     


     senatorialHash1 = sha256Hash(""+globalTallyResult.senatorialA);
     senatorialHash2 = sha256Hash(""+globalTallyResult.senatorialAA);
     senatorialHash3 = sha256Hash(""+globalTallyResult.senatorialADP);
     senatorialHash4 = sha256Hash(""+globalTallyResult.senatorialAPP);
     senatorialHash5 = sha256Hash(""+globalTallyResult.senatorialAPC);
     senatorialHash6 = sha256Hash(""+globalTallyResult.senatorialAPGA);
     senatorialHash7 = sha256Hash(""+globalTallyResult.senatorialBP);
     senatorialHash8 = sha256Hash(""+globalTallyResult.senatorialKP);
     senatorialHash9 = sha256Hash(""+globalTallyResult.senatorialLP);
     senatorialHash10 = sha256Hash(""+globalTallyResult.senatorialNRM);
     senatorialHash11 = sha256Hash(""+globalTallyResult.senatorialNNPP);
     senatorialHash12 = sha256Hash(""+globalTallyResult.senatorialPDP);
     senatorialHash13 = sha256Hash(""+globalTallyResult.senatorialPRP);
     senatorialHash14 = sha256Hash(""+globalTallyResult.senatorialSDP);
     senatorialHash15 = sha256Hash(""+globalTallyResult.senatorialYPP);
     senatorialHash16 = sha256Hash(""+globalTallyResult.presidentialZLP);
    }

    catch(error){
        console.log("an error has occured in the process of trying to hash the results");
        console.log(error)
    }
    


    let sendBulkEmailFunction = function(emailAddress){

            var transporter = nodemailer.createTransport({
                service: "gmail", 
                auth : {
                    user: "cpemachines@gmail.com", 
                    pass : "fuyhkuuxxeuwvmqh"
                }
            });
            
            //This is the beginning of composing of the html email message

            let presResultsTable = 
            "<table>" + "<caption>Presidential Results</caption>"+
                "<tr>" +
                       "<th>S/N</th>"+
                       "<th>Political Party</th>" +
                        "<th>No of votes</th>" +
                        "<th>Hash</th>"+
                "</tr>" + 

                "<tr>" +
                        "<td>1.</td>" +
                        "<td>A</td>" +
                        "<td>"+`${globalTallyResult.presidentialA}`+"</td>"+
                        "<td>" + `${presidentialHash1}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>2.</td>" +
                        "<td> AA </td>" +
                        "<td>"+`${globalTallyResult.presidentialAA}`+"</td>"+
                        "<td>" + `${presidentialHash2}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>3.</td>" +
                        "<td> ADP </td>" +
                        "<td>"+`${globalTallyResult.presidentialADP}`+"</td>"+
                        "<td>" + `${presidentialHash3}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>4.</td>" +
                        "<td> APP </td>" +
                        "<td>"+`${globalTallyResult.presidentialAPP}`+"</td>"+
                        "<td>" + `${presidentialHash4}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>5.</td>" +
                        "<td> APC </td>" +
                        "<td>"+`${globalTallyResult.presidentialAPC}`+"</td>"+
                        "<td>" + `${presidentialHash5}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>6.</td>" +
                        "<td> APGA </td>" +
                        "<td>"+`${globalTallyResult.presidentialAPGA}`+"</td>"+
                        "<td>" + `${presidentialHash6}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>7.</td>" +
                        "<td> BP </td>" +
                        "<td>"+`${globalTallyResult.presidentialBP}`+"</td>"+
                        "<td>" + `${presidentialHash7}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>8.</td>" +
                        "<td> KP </td>" +
                        "<td>"+`${globalTallyResult.presidentialKP}`+"</td>"+
                        "<td>" + `${presidentialHash8}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>9.</td>" +
                        "<td> LP </td>" +
                        "<td>"+`${globalTallyResult.presidentialLP}`+"</td>"+
                        "<td>" + `${presidentialHash9}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>10.</td>" +
                        "<td> NRM </td>" +
                        "<td>"+`${globalTallyResult.presidentialNRM}`+"</td>"+
                        "<td>" + `${presidentialHash10}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>11.</td>" +
                        "<td> NNPP </td>" +
                        "<td>"+`${globalTallyResult.presidentialNNPP}`+"</td>"+
                        "<td>" + `${presidentialHash11}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>12.</td>" +
                        "<td> PDP </td>" +
                        "<td>"+`${globalTallyResult.presidentialPDP}`+"</td>"+
                        "<td>" + `${presidentialHash12}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>13.</td>" +
                        "<td> PRP </td>" +
                        "<td>"+`${globalTallyResult.presidentialPRP}`+"</td>"+
                        "<td>" + `${presidentialHash13}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>14.</td>" +
                        "<td> SDP </td>" +
                        "<td>"+`${globalTallyResult.presidentialSDP}`+"</td>"+
                        "<td>" + `${presidentialHash14}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>15.</td>" +
                        "<td> YPP </td>" +
                        "<td>"+`${globalTallyResult.presidentialYPP}`+"</td>"+
                        "<td>" + `${presidentialHash15}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>16.</td>" +
                        "<td> ZLP </td>" +
                        "<td>"+`${globalTallyResult.presidentialZLP}`+"</td>"+
                        "<td>" + `${presidentialHash16}` +"</td>"+
                "</tr>" + 
            "</table>"

            let senResultsTable = 
            "<table>" + "<caption>Senatorial Results</caption>"+
                "<tr>" +
                    "<th>S/N</th>" +
                       "<th>Political Party</th>" +
                        "<th>No of votes</th>" +
                        "<th>Hash</th>"+
                "</tr>" + 

                "<tr>" +
                        "<td>1.</td>" +
                        "<td>A</td>" +
                        "<td>"+`${globalTallyResult.senatorialA}`+"</td>"+
                        "<td>" + `${senatorialHash1}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>2.</td>" +
                        "<td> AA </td>" +
                        "<td>"+`${globalTallyResult.senatorialAA}`+"</td>"+
                        "<td>" + `${senatorialHash2}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>3.</td>" +
                        "<td> ADP </td>" +
                        "<td>"+`${globalTallyResult.senatorialADP}`+"</td>"+
                        "<td>" + `${senatorialHash3}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>4.</td>" +
                        "<td> APP </td>" +
                        "<td>"+`${globalTallyResult.senatorialAPP}`+"</td>"+
                        "<td>" + `${senatorialHash4}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>5.</td>" +
                        "<td> APC </td>" +
                        "<td>"+`${globalTallyResult.senatorialAPC}`+"</td>"+
                        "<td>" + `${senatorialHash5}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>6.</td>" +
                        "<td> APGA </td>" +
                        "<td>"+`${globalTallyResult.senatorialAPGA}`+"</td>"+
                        "<td>" + `${senatorialHash6}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>7.</td>" +
                        "<td> BP </td>" +
                        "<td>"+`${globalTallyResult.senatorialBP}`+"</td>"+
                        "<td>" + `${senatorialHash7}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>8.</td>" +
                        "<td> KP </td>" +
                        "<td>"+`${globalTallyResult.senatorialKP}`+"</td>"+
                        "<td>" + `${senatorialHash8}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>9.</td>" +
                        "<td> LP </td>" +
                        "<td>"+`${globalTallyResult.senatorialLP}`+"</td>"+
                        "<td>" + `${senatorialHash9}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>10.</td>" +
                        "<td> NRM </td>" +
                        "<td>"+`${globalTallyResult.senatorialNRM}`+"</td>"+
                        "<td>" + `${senatorialHash10}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>11.</td>" +
                        "<td> NNPP </td>" +
                        "<td>"+`${globalTallyResult.senatorialNNPP}`+"</td>"+
                        "<td>" + `${senatorialHash11}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>12.</td>" +
                        "<td> PDP </td>" +
                        "<td>"+`${globalTallyResult.senatorialPDP}`+"</td>"+
                        "<td>" + `${senatorialHash12}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>13.</td>" +
                        "<td> PRP </td>" +
                        "<td>"+`${globalTallyResult.senatorialPRP}`+"</td>"+
                        "<td>" + `${senatorialHash13}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>14.</td>" +
                        "<td> SDP </td>" +
                        "<td>"+`${globalTallyResult.senatorialSDP}`+"</td>"+
                        "<td>" + `${senatorialHash14}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>15.</td>" +
                        "<td> YPP </td>" +
                        "<td>"+`${globalTallyResult.senatorialYPP}`+"</td>"+
                        "<td>" + `${senatorialHash15}` +"</td>"+
                "</tr>" + 

                "<tr>" +
                        "<td>16.</td>" +
                        "<td> ZLP </td>" +
                        "<td>"+`${globalTallyResult.senatorialZLP}`+"</td>"+
                        "<td>" + `${senatorialHash16}` +"</td>"+
                "</tr>" + 
            "</table>"

            let fullResultsHtml = "<!DOCTYPE html>" +
                                "<head>" +
                                        "<style> table, th, td {border: 3px solid #009879; border-collapse: collapse; box-shadow:0 0 20px rgba(0, 0, 0, 0.15);} table{margin-top:19px} tr{font-family:sans-serif; min-width: 400px} caption{font-weight:bold} td{text-align:center; background-color:#f3f3f3 ;color:black} th{margin-left:4px; margin-right:4px} th, td{width:250px}</style>"+
                                "</head>" +

                                "<body>"+ presResultsTable+ senResultsTable+ "</body>"+
                            "</html>"

            
            //this is the end of the html email message.

           var mailOptions  = {
               from: 'cpemachines@gmail.com', 
               to : ""+emailAddress, 
               subject: "E-Voting Ballot Results",
               html: fullResultsHtml
           }
        
        
            transporter.sendMail(mailOptions, function(error, info){
            if(error) {console.log(error," has occured");}
            else {
                console.log("Email sent: "+info.response)
            }
        
            })

    }

    try{ await allVoterEmailAddress.forEach(sendBulkEmailFunction);
    }

    catch(error){
        console.log(error)
    }

    res.render('makeResultsPublic',{id:req.session.user.id});
})


//define some endpoints for keeping the chain up to date

app.get('/start', checkSignIn, async function(req, res){

    console.time("Response Time for Start Action")
    //set flag for the stopVote collection in the db.
    let stopFlag = {
        flag: true
    }
    
    //if the chain already exists, it simply sets the blockchain equal to the blockchain.
    let myCheck =  await bitcoin.checkExist() //you must await.
    if(myCheck == true){
        try{
            await bitcoin.setChain();
            await stopVotingFlag.add(stopFlag)
        }
        catch(error){
            console.log("An error occured in setting the vote flag.")
            console.log(error);
        }
        console.timeEnd("Response Time for Start Action")
        res.render('continueCampaignPage',{id:req.session.user.id});
        //res.send("All systems are ready. Current campaign continued.")
    }

    //if the db does not exist already, it will create it and set the chain equal to its content.
    else {
        await bitcoin.saveChain();
        await bitcoin.setChain();
        console.timeEnd("Response Time for Start Action")
        res.render('newCampaignPage', {id: req.session.user.id});
        //res.send("All systems are ready. New campaign started successfully.")
    }

    //then we set the voting flag to true to allow continuation of votes.

    
    
    
    
    
})


app.get('/stop', checkSignIn, async function(req, res){
    
    console.time("Response Time for Stop Action")
    //this is where we set the variable to entirely stop the voting process.
    if(bitcoin.chain.length !=1){
        let stopFlag = {
            flag: false
        }
        
        await bitcoin.updateSavedChain(); // update the blockchain one more time
        try{
            await stopVotingFlag.add(stopFlag)
            
            console.timeEnd("Response Time for Stop Action")
            res.render('stopVote', {id: req.session.user.id});
        }
        catch(error){
            console.timeEnd("Response Time for Stop Action")
            res.render('stopVoteFail', {id: req.session.user.id});    
        }
        
    }   

    else {
        console.timeEnd("Response Time for Stop Action")
        res.render('stopVoteFail', {id: req.session.user.id});
    }

    
})

app.get('/continue', checkSignIn, async function(req, res){
    await bitcoin.setChain();
    res.send("All systems are ready.")
});

app.get('/blockledgerhandle', async function(req, res){
    res.render('blockledgerhandle');
} )

app.get('/update', checkSignIn, async function(req, res){
    await bitcoin.updateSavedChain();
    res.send("Update Operation completed successfully.");
})




app.post('/transaction', function (req, res) {
    
    const newTransaction = req.body
    const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction)
    //console.log(req.url)
    //to then call the /mine endpoint
    let reqLocation  = req.protocol +"://"+req.get('host')
    const requestPromises = [];
    const requestOptions = {
        uri : reqLocation + "/mine", 
        method: 'GET', 
        json : true
    }

    requestPromises.push(rp(requestOptions));

    try{
    Promise.all(requestPromises).then(data =>{
        console.log(data);
    })}
    catch (error){
        console.log(error, 'is the called error.')
    }

    res.json({note:`Transaction will be added in block ${blockIndex}`});


})


app.post('/transaction/broadcast', function(req, res){

    
    const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    //console.log(req.body.amount+ ". "+ req.body.sender+" : " +req.body.recipient)
    //bitcoin.addTransactionToPendingTransactions(newTransaction);
    const requestPromises = []

    if(bitcoin.networkNodes.length == 0 ){
        let reqLocation  = req.protocol +"://"+req.get('host') //this simply captures the url making the request
        
        const requestOptions = {
            uri : reqLocation +'/transaction', 
            method: 'POST', 
            body: newTransaction, 
            json: true
        };

        requestPromises.push(rp(requestOptions))
        formerCurrentVotedUser = newCurrentVotedUser; //to prevent multiple voting...
        Promise.all(requestPromises).then(data =>{
        res.json({note: "Transaction creation and broadcast successful.",data})
    }) 

    }

    else {
        
        bitcoin.networkNodes.forEach(networkNodeUrl =>{
        const requestOptions = {
            uri : networkNodeUrl +'/transaction',
            method : 'POST', 
            body: newTransaction, 
            json: true
        };
        newCurrentVotedUser = formerCurrentVotedUser //to prevent multiple voting.
        requestPromises.push(rp(requestOptions))
    });

    Promise.all(requestPromises).then(data =>{
        res.json({note: "Transaction creation and broadcast successful."})
    })
    }
    
})

app.get('/mine', function (req, res) {

    console.log('||||||||||||||||||||||| BEGINNING OF THE MINNING PROCESS')
    let startMineTime = new Date().getTime();
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash  = lastBlock['hash']
    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1, 

    };

    
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce)
    let newBlock = 0;
    if(bitcoin.pendingTransactions.length != 0)  {  //checks if there are pendingtransactions, if there are, 
                                                    //it will mine if there are no transactions, it will not mine
         newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash)
    }
    let endMineTime = new Date().getTime();
    let mineTime = endMineTime - startMineTime;
    console.log(`Minning time was :  ${mineTime}ms`)
    console.log("END OF THE MINNING PROCESS |||||||||||||||||||||||||||||||||||");
    
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl =>{
        const requestOptions = {
            uri: networkNodeUrl + "/receive-new-block", 
            method: "POST", 
            body: {newBlock: newBlock}, 
            json: true
        };

        requestPromises.push(rp(requestOptions))
    });

    Promise.all(requestPromises).then(data =>{
        res.json ({
            note: "new block mined successfully", 
            block : newBlock
       })
    })

    
    //beginning of reward system
    // bitcoin.createNewTransaction(12.5, "00", nodeAddress );

    // const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash)

    // res.json ({
    //     note: "new block mined successfully", 
    //     block : newBlock
    // })
    //end of reward system
});


app.post('/receive-new-block', function(req, res){

    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1  === newBlock ['index'];

    if(correctHash && correctIndex) {
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];
        res.json({
            note: "New block received and accepted.", 
            newBlock: newBlock
        });

    } else {
        res.json({
            note: "New block rejected", 
            newBlock: newBlock
        });
    }

})


//registers and broadcasts a node to the entire network.
app.post('/register-and-broadcast-node', function(req, res){
    const newNodeUrl = req.body.newNodeUrl;
    
    //to register a  node, we simply need to add the node url to networkNodes[] array
    if(bitcoin.networkNodes.indexOf(newNodeUrl) == -1)  //this checks if the node was in the array before.
     { 
         bitcoin.networkNodes.push(newNodeUrl);
     }

     const regNodesPromises = []; //this array will hold all the promises.

     //then we broadcast the newnode to all other nodes
     bitcoin.networkNodes.forEach(networkNodeUrl => {

         //RED ALERT!!!!! then hit the register-node endpoint
         const requestOptions = {
             uri : networkNodeUrl + '/register-node', 
             method: "POST", 
             body :{newNodeUrl: newNodeUrl},
             json: true 
         };

         //rp(requestOptions) returns a promise, so want to push each promise unto an array
         regNodesPromises.push(rp(requestOptions));
     });

     Promise.all(regNodesPromises).then(data =>{ //runs all our requests
        const bulkRegisterOptions = {
            uri: newNodeUrl + '/register-nodes-bulk', 
            method: 'POST', 
            body: {allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]}, 
            json: true
        };

        return rp(bulkRegisterOptions);

     }).then(data =>{
        res.json({note: "New node registered with network successfully"})
     })

});

//registers a node with the network node that receives the request.
app.post('/register-node',function(req, res){
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl
    if(nodeNotAlreadyPresent && notCurrentNode){ 
    
        bitcoin.networkNodes.push(newNodeUrl);
    }
    res.json({note: "New node registered successfully with node."})

    
});


//*************************************************
//The Bulk Blockchain node registration endpoint
app.post('/blockchain-register-nodes-bulk', async function(req, res){
    //call this endpoint with an array of address of all other nodes in the network
    const allBlockchainNodes = req.body.allBlockchainNodes;
    //let currentRetrievedNode = null;
    let newNodeUrl = null;
    allBlockchainNodes.forEach((item)=>{
        //currentRetrievedNode = item  //set the array item equal to this guy
        newNodeUrl = item;
        if(bitcoin.networkNodes.indexOf(newNodeUrl) == -1) {bitcoin.networkNodes.push(newNodeUrl); //add the item to the array of nodes
            console.log('Inside the first forEach::: ', newNodeUrl);
        }
    })

    const regNodesPromises = [];
    // let newNodeUrl = null;


    allBlockchainNodes.forEach((item)=>{

        newNodeUrl = item;
        console.log('Inside the second forEach::: ', newNodeUrl);
        
         bitcoin.networkNodes.forEach(networkNodeUrl => {
            //invoke the register node endpoint.
            const requestOptions = {
                uri: networkNodeUrl + '/register-node',
                method: 'POST', 
                body: {newNodeUrl: newNodeUrl},
                json: true
            };

            regNodesPromises.push(rp(requestOptions));
        });

         Promise.all(regNodesPromises)
        .then(data => {
            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: { allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl] },
                json:true
         };
            return rp(bulkRegisterOptions);
        })
        .then(data => {
            console.log(data)
            //res.send(data); //in order to wait for the endpoint to rerun 
        });

    })

    //then I'll have to register the node which the bulk was hit on with every other participant in the network.

    //First get the url of the current node.
    let bulkHitNodeUrl = req.protocol + '://' + req.get('host')  //first
    let selectedNodeToInform = null;  //selected node on which to hit api.
    //We have to register this url with all the urls that were sent in bulk.
    console.log(`The name of the hit url is ${bulkHitNodeUrl}`);
    if(allBlockchainNodes.length >1){
        selectedNodeToInform = allBlockchainNodes[2];
        console.log("The node selected to inform others is", selectedNodeToInform) 
    }
    else {
        selectedNodeToInform = bulkHitNodeUrl;
    }
    

  allBlockchainNodes.forEach((item)=>{
    
    const finalRegNodePromise = []

    const finalRequestOption = {
        uri : item + '/register-node', 
        method: "POST", 
        body :{newNodeUrl: bulkHitNodeUrl},
        json: true 
    };

    finalRegNodePromise.push(finalRequestOption)

    Promise.all(finalRegNodePromise).then(data =>{ //runs all our requests
        const bulkRegisterOptions = {
            uri: item + '/register-nodes-bulk', 
            method: 'POST', 
            body: {allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]}, 
            json: true
        };

        return rp(bulkRegisterOptions);

     }).then(data =>{
         console.log(data)
        //res.send(data)
        })
    })
    
    res.json({"info":"finished adding all nodes in bulk to the blockchain"});

});

//End of the Bulk Blockchain node registration endpoint.
//*************************************************


//registers multiple nodes at once.
app.post('/register-nodes-bulk', function(req, res){
   const allNetworkNodes = req.body.allNetworkNodes
    allNetworkNodes.forEach(networkNodeUrl =>{
        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
        if(nodeNotAlreadyPresent && notCurrentNode) {
            bitcoin.networkNodes.push(networkNodeUrl);
        }
    });
        res.json({note: 'Bulk registration successful.'});
});


app.get('/consensus', function(req, res){
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl =>{
        
        const requestOptions = {
            uri: networkNodeUrl + '/blockchain', 
            method: 'GET', 
            json: true
        };

        requestPromises.push(rp(requestOptions));  //make request to all nodes to access their copies of the blockchain
    });

    Promise.all(requestPromises).then(blockchains => {

        const currentChainLength = bitcoin.chain.length;
        let maxChainLength = currentChainLength;
        let newLongestChain = null;
        let newPendingTransactions = null;

        blockchains.forEach(blockchain => {
           
            if (blockchain.chain.length > maxChainLength){
               maxChainLength = blockchain.chain.length;
               newLongestChain = blockchain.chain;
               newPendingTransactions = blockchain.pendingTransactions; 
            };
        });

        if(!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain)))
        {
            res.json({note: "Current Chain has not been replaced", 
                     chain: bitcoin.chain})
            
        }

        else if(newLongestChain && bitcoin.chainIsValid(newLongestChain)){
            bitcoin.chain = newLongestChain;
            bitcoin.pendingTransactions = newPendingTransactions;

            res.json({note:"This chain has been replaced.", 
                      chain: bitcoin.chain })
        }
    })
})


app.get('/block/:blockHash', function(req, res){
    const blockHash = req.params.blockHash;
    const correctBlock = bitcoin.getBlock(blockHash);

    res.json({
        block: correctBlock
    });

});

app.get('/transaction/:transactionId', function(req, res){
    const transactionId = req.params.transactionId;
    const transactionData = bitcoin.getTransaction(transactionId);

    res.json({
        transaction: transactionData.transaction, 
        block: transactionData.block
    })

});

app.get('/address/:address', function(req, res){
    const address = req.params.address;
    const addressData = bitcoin.getAddressData(address);

    res.json({
        addressData : addressData
    })
});

app.get('/block-explorer', function(req, res){
    res.sendFile('./block-explorer/index.html', {root: __dirname});
});

app.get('/sample1', function(req, res){
    console.log("Inside the sample endpoint")
    res.sendFile('./block-explorer/implement.html', {root: __dirname});
})
//Beginning of e-voting implementation.
//some db access functions


app.get('/voterSignUp', function(req, res){
    res.render('signup');

})

//end point to send registration confirmation mail to the voter
app.post('/registrationConfirm', async function(req, res){
    
    blockchainView = "https://cpemachines.onrender.com/blockledger"
    email1 = "Dear, "+ req.body.name;
    email2 = "\nThanks for registering. Please note that your voter id is:\n"+ req.body.id;
    email3 = "\nPlease Note: \n After casting your ballot, you will receive a receipt containing a ciphered(encrypted) form of your ballot (for your privacy)."
    //email4 = "\nVisit "+blockchainView+ " to view the blockchain ledger and search for your voter id on the page"
    emailn = "\n\n* Why will we send you a ciphered(encrypted) receipt of your casted ballot?"
    emailn1 = "\nWe do this to ensure that the entire voting process is transparent, verifiable and auditable."

    emailn2 = "\n* How does the ciphered ballot receipt help to ensure that the process is truly transparent and verifiable?"
    emailn3 = "\n The e-voting system is based on a blockchain technology which provides a ledger system that records all transactions carried out. This ledger can be accessed by following a link that will be sent to you after you must have voted."
    //emailn4 = "\n* What are you to do with the ciphered ballot?"
    emailn5 = "\n You are to visit the link that will be sent to you (after you have voted), to access the blockchain ledger. Use the search bar to search for your voter id. Then, check to see if the ciphered ballot registered against your voter id on the ledger is the same as the ciphered ballot you received by mail."
    email5 = "\nThe ciphered ballots in your voting receipt will of course be the same as that registered in the blockchain ledger for you. This simply means your vote has been casted "
    email6 = "and will be tallied appropriately. Thanks for using the CPE Machines Blockchain-based e-voting platform."
    emailText = email1 + email2 + email3 + emailn + emailn1 + emailn2 + emailn3 + emailn5 + email5 + email6;
    emailSubject = "e-Voting registration confirmation for "+ req.body.name;
    emailRecipient = req.body.email;    
 
    var transporter = nodemailer.createTransport({
        service: "gmail", 
        auth : {
            user: "cpemachines@gmail.com", 
            pass : "fuyhkuuxxeuwvmqh"
        }
    });

   var mailOptions  = {
       from: 'cpemachines@gmail.com', 
       to : ""+emailRecipient, 
       subject: emailSubject,
       text: emailText
   }


    await transporter.sendMail(mailOptions, function(error, info){
    if(error) {console.log(error," has occured");}
    else {
        console.log("Email sent: "+info.response)
    }

    })
    res.send('User added successfully.');
});


app.post('/votersignupbulk1', async function(req, res){
    
    if(!req.body.newUsers){ //check to see if all the fields of the form have been filled.
        res.send('nOK, please fill in all the details');
    }   

    else {

        //console.time("Registration Time:")
        let bulkUsers = req.body.newUsers;
        await testCrudUsers.addMany(bulkUsers)
        console.timeEnd("Registration Time:")
        

        res.json({"info": "Operation successful"});
    }
})


app.post('/generateUsers', async function(req, res){
    if(!req.body.amount){
        res.send("Please specify amount of users you want to generate")
    }

    else {
        let newUsers = []

        let oneUser = {
            "id" : "Danny", 
            "name":"Fredrick Sample",
            "password": "23456",
            "email" : "rodanduivneui@gmail.com", 
            "gender": "Male", 
            "lga": "Ekiti",
            "phoneNumber": "08112341234"
        }


        let required = Number(req.body.amount);

        for(let a =0; a<required; a++){
            newUsers[a] = {
                "id": oneUser.id+""+a, 
                "name": oneUser.name+""+a, 
                "password": oneUser.password+""+a, 
                "email": oneUser.email+""+a, 
                "gender": oneUser.gender+""+a, 
                "lga": oneUser.lga+""+a, 
                "phoneNumber": oneUser.phoneNumber+""+a, 
            }
        }

        //then we try to post all of the generated users. 

        const requestPromises = [];
        let reqLocation  = req.protocol +"://"+req.get('host') 
        
        const requestOptions = {
            uri : reqLocation + "/votersignupbulk1", 
            method : "POST", 
            body : {
               newUsers : newUsers
            }, 
            json : true
        }

        try {
            requestPromises.push(rp(requestOptions));

            await Promise.all(requestPromises).then(data =>{
               
            }).catch( function(){
                res.send("Promise Rejected");
            })
        }
            catch(error){
                console.log(error);
                res.send('Error occured in the process of adding users.');
            }
            
        }
        res.send("Operation sucessful");
})

app.post('/votersignupbulk2', async function(req, res){
    
    if(!req.body.newUsers){ //check to see if all the fields of the form have been filled.
        res.send('nOK, please fill in all the details');
    }   

    else {

        console.time("Registration Time:")
        let bulkUsers = req.body.newUsers;
        

        bulkUsers.forEach(async function(item, index){
            let newUserBulk = {
                id: item.id, 
                name: item.name, 
                password: item.password, 
                email: item.email, 
                gender: item.gender, 
                phoneNumber: item.phoneNumber
            }
        
        //find how to addmany to db at once in mongoDB
        await testCrudUsers.add(item) //add the user to the DB collection for testing
        
        })
        console.timeEnd("Registration Time:")
        

        res.json({"info": "Operation successful"});
    }
})



app.post('/voterSignUp', async function(req, res){

    allUsers = await crudUsers.get(); //get list of all registered users

    let checkForSignUp = function(userId){
        let signUpFlag = false;

        allUsers.filter(function(user){
            if(user.id == userId){
                signUpFlag = true;
            }
        })

        if(signUpFlag == true) return true //return true if voter has signup before.
        else return false;  //return false if voter has not signup before.
    }



    if(!req.body.id || !req.body.password || !req.body.email|| !req.body.gender || !req.body.phoneNumber){ //check to see if all the fields of the form have been filled.
        res.send('nOK, please fill in all the details');
    }   


    else {

        let newUser = {
            id : req.body.id, 
            name: req.body.name,
            password: req.body.password, 
            email: req.body.email, 
            gender: req.body.gender, 
            phoneNumber: req.body.phoneNumber
        }

        let checkForSignUpFlag = checkForSignUp(req.body.id)
        

        //check if user does not exist already

        if(checkForSignUpFlag == false){
        
        await crudUsers.add(newUser) //adds a user to the database.

        //call the registration confirmation endpoint
        const requestPromises = [];
        let reqLocation  = req.protocol +"://"+req.get('host') 
        console.log(reqLocation)
        const requestOptions = {
            uri : reqLocation + "/registrationConfirm", 
            method : "POST", 
            body : {
                id : req.body.id, 
                name: req.body.name,
                password: req.body.password, 
                email: req.body.email, 
                gender: req.body.gender
            }, 
            json : true
        }

        try {
            requestPromises.push(rp(requestOptions));

            await Promise.all(requestPromises).then(data =>{
                res.send(data);
            }).catch( function(){
                res.send("Promise Rejected");
            })
        }
            catch(error){
                console.log(error);
                res.send('Error occured in the process of sending mail');
            }
        }

        else {
            console.log("user has registered already")
            
            res.send('user has registered already');
        }
            
        }
        
        //res.redirect('/registrationConfirm');
        
});

app.get("/displayRegisteredUsers", async function(req, res){

})


app.get('/updateChain', async function(req, res){
      
    let myCheck =  await bitcoin.checkExist() //you must await.
    if(myCheck == true){
        await bitcoin.setChain();
        //res.send("All systems are ready. Previous campaign continued")
    }

    res.send("All systems are ready")
})

app.get('/voterLogin', function(req,  res){
    //res.sendFile('./block-explorer/voterLogin.html', {root: __dirname});
    
    res.render('voterLogin');
})


app.post('/voterLogin', async function(req, res){

        
    let finalRedirect = true;
    
        //we first of all update the blockchain to reflect what's in the DB.
        //if the chain already exists, it simply sets the blockchain equal to the blockchain.

        let dbVoteFlag = null;
        let lastDbVoteFlag = null; //checks the last value of the dbVoteFlag array returned.
        //we check to see if the campaign has been stopped, if it has been stopped, we prevent the voter from login in.
        try{
             dbVoteFlag = await stopVotingFlag.get(); //retrieves list of all the voting flags
             console.log("list has been retrieved successfully");
             let lastValue = (dbVoteFlag.length) - 1;
             lastDbVoteFlag = dbVoteFlag[lastValue].flag;
             console.log("The last flag is ", lastDbVoteFlag)
        }

        catch(error){
            console.log("The stop vote flag db does not exist")
            console.log(error)
        }
        
        let myCheck =  await bitcoin.checkExist() //you must await to check db if the chain already exists.
        if(myCheck == true){
            await bitcoin.setChain(); //if it exists, then bring it up from the db
            //res.send("All systems are ready. Previous campaign continued")
        }

        //if the db does not exist already, it will create it and set the chain equal to its content.
        else {
            await bitcoin.saveChain(); //if it does not exist, save it to the db
            await bitcoin.setChain(); //then set the chain equal to what you saved in the db.
            //res.send("All systems are ready. New campaign started successfully.")
        }
    
        //Then we can procees to process list of registered voters.
       allUsers = await crudUsers.get(); // retrieves the list of all users from the db
       //console.log('Here is the list of all users \n', allUsers); //Prints the list of all users in records
    
        console.log('................................................................');
        allVotedUsers = await alreadyVoted.get() //retrieves the list of all users who have voted already from the db
        console.log('................................................................');
        console.log("all voted user \n", allVotedUsers); //prints the list of all users who have voted already

    let flag = null;

    let checkForVoted = function(userId){
        let votedFlag = false;

        allVotedUsers.filter(function(user){
            if(user.id == userId){
                votedFlag = true;
            }
        })

        if(votedFlag == true) return true //return true if voter has voted before.
        else return false;  //return false if voter has not voted before.
    }
    console.log(`${checkForVoted(req.body.id)} is the result of the voter check`)
    let invalidVoterFlag = false;
    //let finalElseFlag = false;

    allUsers.filter(function(user){ //we filter the list of registered users to see if such user exists
        if(user.id == req.body.id && user.password == req.body.password){ //if the user exists, we check if the user has voted.

            let voterCheckResult = checkForVoted(req.body.id) //returns true if the voter has voted before.
            

            loggedInVoterId = req.body.id
            
            alreadyVotedFlag = false;

            if(voterCheckResult == true ){ // if it is true means that the voter has voted before.
                 //flag = true; //decides not to allow the voter vote.
                    invalidVoterFlag = true; //means the voter has voted before.
            }

            if(voterCheckResult == false){
                    invalidVoterFlag = false;  //means the voter has not voted before.
            }

            if(lastDbVoteFlag == false) {
                flag = true //flags to prevent the voter from log in due to end of campaign
            }

            if(lastDbVoteFlag == true){
                flag = false; //flags to allow the voter log in due to continue campaign.
            }

            // else {
            //     req.session.user = user ; //ceates a session for the user.
            //     flag = false;
                
            //     //res.redirect('/vote_page');
            // }

            if(invalidVoterFlag == false && flag == false){ //if the login is valid and the voting campaign has not ended.
                try{
                req.session.user = user; //ceates a session for the user.
                finalRedirect = false
                res.redirect('/vote_page');
                }
                catch(error){
                    console.log("An error has occured in the process of login in the voter");
                    console.log(error)
                    res.render('voterLogin');
                }
            }
    
    
            else if(invalidVoterFlag == false && flag == true ) { //if the login is valid but the voting has ended
                finalRedirect = false
                res.render('voterLogin', {message: 'The voting process has ended.'})
            }

            
    
            else if(checkForVoted(req.body.id) == true) {//if the login is valid but the user has voted before.
                finalRedirect = false
                
                res.render('voterLogin', {message: 'Voter has already voted.'})
            }
            
            // else if(invalidVoterFlag== false && flag == false) {
            //     res.render('voterLogin', {message: 'Voter has voted already'} )
            // }

              
        }

        else {
            finalRedirect == true;
        }
        
        
    })



        if(finalRedirect == true){
            res.render('voterLogin', {message: 'Invalid Login Details.'} )
        }

       
        // if(lastDbVoteFlag==false && flag !=false){
        //     console.log("First if for last db vote flag")
        //     console.log(">...,,.,.,.,...........***(**(*(*(*(*(")
        //      res.render('voterLogin', {message: 'The voting process has ended.'})
        //  }

        //  else if(flag == true && invalidVoterFlag == true && flag !=false){
        //     //res.send("User does not exist");
        //     console.log("First elif")
        //     res.render('voterLogin', {message: 'Voter has already voted'})
        // }

        // else if (flag ==true && invalidVoterFlag == false && flag !=false){
        //     console.log("Second elif")
        //     res.render('voterLogin', {message: 'Incorrect Login Details.'})
        // }
      
})

app.use('/vote_page', checkSignIn, function(err, req, res, next){
    res.redirect('/voterLogin'); //redirects the user back to login if credentials are not correct.
})

app.use('/vote', checkSignIn, function(err, req, res, next){
    res.redirect('/voterLogin');
})


app.get('/vote_page', checkSignIn, function(req, res){

    alreadyVotedFlag = false;
    try{
        oneVoteFlag = true;
        res.render('nvote_page', {id: req.session.user.id});
    }
    catch(err){
        console.log(err);
    }
})


// app.post('/vote', checkSignIn, function(req, res){

    
//     let presidentialCandidate = req.body.presidential;
//     let senatorialCandidate = req.body.senatorial;

//     if(req.body == null){
//         res.render('vote_page');
//     }

//     if(presidentialCandidate == 'APC'){
//         presidentialBallot = [1, 0, 0];
//     }
//     if(presidentialCandidate == 'PDP'){
//         presidentialBallot = [0, 1, 0];
//     }
//     if(presidentialCandidate == 'APGA'){
//         presidentialBallot = [0, 0, 1];
//     }
//     //END OF PRESIDENTIAL CANDIDATE CHECK

//     if(senatorialCandidate == 'APC'){
//         senatorialBallot = [1, 0, 0];
//     }
//     else if(senatorialCandidate == 'PDP'){
//         senatorialBallot = [0, 1, 0];
//     }
//     else if(senatorialCandidate == 'APGA'){
//         senatorialBallot = [0, 0, 1];
//     }
//     //END OF SENATORIAL CANDIDATE CHECK.

//     else {
//         res.render('vote_page');
//     }

//     console.log('Ballot for Presidential Candidate ', presidentialBallot);
//     console.log('Ballot for Senatorial Candidate ', senatorialBallot);

//     if( presidentialBallot != null && senatorialBallot != null){
        

//         console.log("#############*************######################")
//         console.log("Encryption Start time: ", newStart);

//         let encryptedPresidentalBallotJSON = paillierEnc.encryptBallots(presidentialBallot);
//         let encryptedSenatorialBallotJSON = paillierEnc.encryptBallots(senatorialBallot);
        
//         const timeInMs = (newEnd[0]*1000000000 + newEnd[1]) / 1000000; //we first convert the time to seconds then to milliseconds

//         console.log("Encryption End Time in ms", timeInMs);
//         console.log("#############*************######################");
    
//         encryptedPresidentialBallot[0] = encryptedPresidentalBallotJSON.ballot1;
//         encryptedPresidentialBallot[1] = encryptedPresidentalBallotJSON.ballot2;
//         encryptedPresidentialBallot[2] = encryptedPresidentalBallotJSON.ballot3;

//         encryptedSenatorialBallot[0] = encryptedSenatorialBallotJSON.ballot1;
//         encryptedSenatorialBallot[1] = encryptedSenatorialBallotJSON.ballot2;
//         encryptedSenatorialBallot[2] = encryptedSenatorialBallotJSON.ballot3;

//         console.log('encrypted presidential ballots are ', encryptedPresidentialBallot);
//         console.log('encrypted senatorial ballots are ', encryptedSenatorialBallot);

//         res.render('confirm_vote', {presidential: req.body.presidential, senatorial: req.body.senatorial, id:req.session.user.id});
//     } 
// })

app.post('/votetest', function(req, res){

    // console.log(req.body.presidentialCandidate)
    // console.log(req.body.senatorialCandidate)
    console.time("Response Time for casting ballot")
    
    let presidentialCandidate = req.body.presidentialCandidate;
    let senatorialCandidate = req.body.senatorialCandidate;

    if(req.body == null){
        res.render('vote_page');
    }

    if(presidentialCandidate == 'Accord Party (AP)'){
        presidentialBallot = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    }
    else if(presidentialCandidate == 'Action Alliance (AA)'){
        presidentialBallot = [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    }
    else if(presidentialCandidate == 'Action Democratic Party (ADP)'){
        presidentialBallot = [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0]
    }
    else if(presidentialCandidate == 'Action Peoples Party (APP)'){
        presidentialBallot = [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0]
    }
    else if(presidentialCandidate == 'All Progressives Congress (APC)'){
        presidentialBallot = [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0]
    }
    else if(presidentialCandidate == 'All Progressives Grand Alliance (APGA)'){
        presidentialBallot = [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0]
    }
    else if(presidentialCandidate == 'Boot Party (BP)'){
        presidentialBallot = [0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0]
    }
    else if(presidentialCandidate == 'KOWA Party (KP)'){
        presidentialBallot = [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0]
    }
    else if(presidentialCandidate == 'Labour Party (LP)'){
        presidentialBallot = [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]
    }
    else if(presidentialCandidate == 'National Rescue Movement (NRM)'){
        presidentialBallot = [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0]
    }

    else if(presidentialCandidate == 'New Nigeria Peoples Party (NNPP)'){
        presidentialBallot = [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0]
    }
    else if(presidentialCandidate == 'Peoples Democratic Party (PDP)'){
        presidentialBallot = [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0]
    }
    else if(presidentialCandidate == 'Peoples Redemption Party (PRP)'){
        presidentialBallot = [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0]
    }
    else if(presidentialCandidate == 'Social Democratic Party (SDP)'){
        presidentialBallot = [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0]
    }
    else if(presidentialCandidate == 'Young Progressive Party (YPP)'){
        presidentialBallot = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0];
    }
    else if (presidentialCandidate == 'Zenith Labour Party (ZLP)'){
        presidentialBallot = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
    }

    //END OF PRESIDENTIAL CANDIDATE CHECK

    if(senatorialCandidate == 'Accord Party (AP)'){
        senatorialBallot = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    }
    else if(senatorialCandidate == 'Action Alliance (AA)'){
        senatorialCandidate = [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    }
    else if(senatorialCandidate == 'Action Democratic Party (ADP)'){
        senatorialBallot = [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0]
    }
    else if(senatorialCandidate == 'Action Peoples Party (APP)'){
        senatorialBallot = [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0]
    }
    else if(senatorialCandidate == 'All Progressives Congress (APC)'){
        senatorialBallot = [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0]
    }
    else if(senatorialCandidate == 'All Progressives Grand Alliance (APGA)'){
        senatorialBallot = [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0]
    }
    else if(senatorialCandidate == 'Boot Party (BP)'){
        senatorialBallot = [0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0]
    }
    else if(senatorialCandidate == 'KOWA Party (KP)'){
        senatorialBallot = [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0]
    }
    else if(senatorialCandidate == 'Labour Party (LP)'){
        senatorialBallot = [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]
    }
    else if(senatorialCandidate == 'National Rescue Movement (NRM)'){
        senatorialBallot = [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0]
    }

    else if(senatorialCandidate == 'New Nigeria Peoples Party (NNPP)'){
        senatorialBallot = [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0]
    }
    else if(senatorialCandidate == 'Peoples Democratic Party (PDP)'){
        senatorialBallot = [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0]
    }
    else if(senatorialCandidate == 'Peoples Redemption Party (PRP)'){
        senatorialBallot = [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0]
    }
    else if(senatorialCandidate == 'Social Democratic Party (SDP)'){
        senatorialBallot = [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0]
    }
    else if(senatorialCandidate == 'Young Progressive Party (YPP)'){
        senatorialBallot = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0];
    }
    else if(senatorialCandidate == 'Zenith Labour Party (ZLP)'){
        senatorialBallot = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
    }
    //END OF SENATORIAL CANDIDATE CHECK.

    else {
        res.render('vote_page');
    }

    // console.log('Ballot for Presidential Candidate ', presidentialBallot);
    // console.log('Ballot for Senatorial Candidate ', senatorialBallot);

  
    
    

    if( presidentialBallot != null && senatorialBallot != null){
        

        // console.log("#############*************######################")
        // console.log("Encryption Start time: ", newStart);

        for(let ax=0; ax < presidentialBallot.length ; ax++){

            let resultsOfEncryption = paillierEnc.encryptSingle(presidentialBallot[ax]);
            encryptedPresidentialBallot[ax] = resultsOfEncryption.ballot;
            

        }

        for(let ax=0; ax < senatorialBallot.length ; ax++){

            let resultsOfEncryption = paillierEnc.encryptSingle(senatorialBallot[ax]);
            encryptedSenatorialBallot[ax] = resultsOfEncryption.ballot;
            

        }

        // let encryptedPresidentalBallotJSON = paillierEnc.encryptBallots(presidentialBallot);
        // let encryptedSenatorialBallotJSON = paillierEnc.encryptBallots(senatorialBallot);
        
        // const timeInMs = (newEnd[0]*1000000000 + newEnd[1]) / 1000000; //we first convert the time to seconds then to milliseconds

        // console.log("Encryption End Time in ms", timeInMs);
        // console.log("#############*************######################");
    
       
       
       for(let dum=0; dum<encryptedPresidentialBallot.length; dum++){
            
            console.log(encryptedPresidentialBallot[dum])
       }
       

        // console.log('encrypted presidential ballots are ', encryptedPresidentialBallot);
        // console.log('encrypted senatorial ballots are ', encryptedSenatorialBallot);
        console.timeEnd("Response Time for casting ballot")

        res.render('confirm_vote', {presidential: req.body.presidentialCandidate, senatorial: req.body.senatorialCandidate, id:req.session.user.id});
    }
})

app.use('/sendToBlockchain', checkSignIn, function(err, req, res, next){
    res.redirect('/voterLogin'); //redirects the user back to login if credentials are not correct.

})

app.post('/sendToBlockchain', checkSignIn, function(req, res){

    
    newCurrentVotedUser = req.session.user.id;
    emailRecipient = req.session.user.email;  // set the email address to receive the ballot receipt
    emailVoterID = req.session.user.id  //sets the ID of the voter that just casted his ballot
    
    console.log("Current Voter is ", newCurrentVotedUser);
    console.log("Previous voter was", formerCurrentVotedUser);
    if(newCurrentVotedUser != formerCurrentVotedUser){
        if(oneVoteFlag){
        oneVoteFlag = false;
        encryptedBallots.push(...encryptedPresidentialBallot);
        encryptedBallots.push(...encryptedSenatorialBallot);
        console.log(`The summary of everything is ${encryptedBallots}`);
        const requestPromises = [];
        const requestMailPromises = [];
        let reqLocation  = req.protocol +"://"+req.get('host') 
        console.log(reqLocation)
        const requestOptions = {
            uri : reqLocation + "/transaction/broadcast", 
            method : "POST", 
            body : {
                "amount" : encryptedBallots, 
                "sender" : req.session.user.id,
                "recipient" : "Admin"
            }, 
            json : true
        };
            encryptedBallots = [];

        const requestMailOptions = {
            uri : reqLocation + "/sendMail", 
            method : "GET", 
            json : true
        }

        req.session.destroy(function(){
                console.log("Voter logged out.")
       });
       

    try {
        requestPromises.push(rp(requestOptions));

        Promise.all(requestPromises).then(data =>{
            ///oneVoteFlag = false;
            res.redirect('/voterLogout');
        })
    }
        catch(error){
            console.log(error);
        }
        
    //make request promise to hi the send mail API 
    try{
        requestMailPromises.push(rp(requestMailOptions));

        Promise.all(requestMailPromises).then(data =>{
            //res.redirect('/')
        })
    }
    catch(error){
        console.log(`${error} occured in the process of try to make request promise to the sendMail API`);
    }

    }
    else {
        res.redirect('/voterLogout');
    }
}
    else {
        res.redirect('/voterLogout');

    }

})


//beginning of admin functionality


// app.get('/adminLogin', function(req, res){
//     res.render('admin_login');

// })

app.get('/adminLogin', function(req,res){
    //res.sendFile('./block-explorer/adminLogin.html', {root: __dirname});
    res.render('adminLogin');
})


app.post('/adminLogin', async function(req, res){
        let admin = await adminDB.get();
        let adminId = admin[0].id;
        let adminpwd = admin[0].password;

        if(req.body.id == null || req.body.password == null){
            res.redirect('/adminLogin');
        }

        else if(req.body.id == adminId && req.body.password == adminpwd){
            req.session.user = admin[0];
            res.redirect('/adminPage');
        } 

        else {
            res.render('adminLogin', {message: "Incorrect Login Details"});
        }
})


app.use('/adminPage', checkSignIn, function(err, req, res, next){
    res.redirect('/adminLogin'); //redirects the user back to login if credentials are not correct.

})

app.get('/adminPage', checkSignIn, function(req, res){
    res.render('admin', {'admin': req.session.user.id});
})


app.use('/tallyVote', checkSignIn, function(err, req, res, next){
    res.redirect('/adminLogin'); //redirects the user back to login if credentials are not correct.
})



app.get('/display', function(req, res){
    res.send(bitcoin.chain);
})

app.get('/tallyVote', checkSignIn, async function(req, res){

    console.time("Response Time for Tally Action");
    let allPresidentialBallots = [];
    let allSenatorialBallots = [];

    if(bitcoin.chain.length == 1){
        //res.send("Please start a new campaign before going on to tally the votes");

        //this is a simple check
        res.render('tallyError',{id:req.session.user.id});
    }
//    bitcoin.chain.forEach(function(block, index){
    
//     block.transactions[0].forEach(function(transaction, index){
        
//          console.log(transaction)
//          console.log(block.transactions, 'is transactions');
//          data = {
//              ballot1 : transaction.amount[0], 
//              ballot2 : transaction.amount[1], 
//              ballot3 : transaction.amount[2]
//          }

//          allBallots.push(data);
        
//     })
    
 //  })

 bitcoin.chain.forEach(function(block, index){
    
    if(block.index == 1){
        console.log(block);
    }
    
    else {
    block.transactions.forEach(function(transaction, index){
    
         //console.log(transaction)
         //console.log(block.transactions, 'is transactions');
         presidentialData = {
            ballot1 : transaction.amount[0], 
            ballot2 : transaction.amount[1], 
            ballot3 : transaction.amount[2],
            ballot4 : transaction.amount[3],
            ballot5 : transaction.amount[4],
            ballot6 : transaction.amount[5],
            ballot7 : transaction.amount[6],
            ballot8 : transaction.amount[7],
            ballot9 : transaction.amount[8],
            ballot10 : transaction.amount[9],
            ballot11 : transaction.amount[10],
            ballot12 : transaction.amount[11],
            ballot13 : transaction.amount[12],
            ballot14 : transaction.amount[13],
            ballot15 : transaction.amount[14],
            ballot16 : transaction.amount[15],
        }

        senatorialData = {
            ballot1 : transaction.amount[16], 
            ballot2 : transaction.amount[17], 
            ballot3 : transaction.amount[18],
            ballot4 : transaction.amount[19],
            ballot5 : transaction.amount[20],
            ballot6 : transaction.amount[21],
            ballot7 : transaction.amount[22],
            ballot8 : transaction.amount[23],
            ballot9 : transaction.amount[24],
            ballot10 : transaction.amount[25],
            ballot11 : transaction.amount[26],
            ballot12 : transaction.amount[27],
            ballot13 : transaction.amount[28],
            ballot14 : transaction.amount[29],
            ballot15 : transaction.amount[30],
            ballot16 : transaction.amount[31],
        }

        allPresidentialBallots.push(presidentialData);
        allSenatorialBallots.push(senatorialData);
    })
    }
})
   //bitcoin.chain.forEach(block=>{
       
    //    block.transactions.forEach(transaction =>{
    //     data = {
    //         ballot1 : transaction.amount[0], 
    //         ballot2 : transaction.amount[1], 
    //         ballot3 : transaction.amount[2]
    //     }
    //     allBallots.push(data);
           
    //    })
   //})

   console.log(allPresidentialBallots);
   console.log(allSenatorialBallots);
   finalResult1 = paillierEnc.getCount(allPresidentialBallots);  

   finalResult2 = paillierEnc.getCount(allSenatorialBallots);

   console.log(finalResult1);
   console.log(finalResult2);

    // let totalFinalResult = {
    //     presidential: finalResult1, 
    //     senatorial: finalResult2
    // }

    let tallyResult = {
        id: req.session.user.id, 

        presidentialA: finalResult1.A,
        presidentialAA: finalResult1.AA,
        presidentialADP: finalResult1.ADP,
        presidentialAPP: finalResult1.APP,
        presidentialAPC: finalResult1.APC,
        presidentialAPGA: finalResult1.APGA,
        presidentialBP: finalResult1.BP,
        presidentialKP: finalResult1.KP,
        presidentialLP: finalResult1.LP,
        presidentialNRM: finalResult1.NRM,
        presidentialNNPP : finalResult1.NNPP, 
        presidentialPDP : finalResult1.PDP, 
        presidentialPRP : finalResult1.PRP, 
        presidentialSDP : finalResult1.SDP, 
        presidentialYPP : finalResult1.YPP, 
        presidentialZLP : finalResult1.ZLP,

        senatorialA: finalResult2.A,
        senatorialAA: finalResult2.AA,
        senatorialADP: finalResult2.ADP,
        senatorialAPP: finalResult2.APP,
        senatorialAPC: finalResult2.APC,
        senatorialAPGA: finalResult2.APGA,
        senatorialBP: finalResult2.BP,
        senatorialKP: finalResult2.KP,
        senatorialLP: finalResult2.LP,
        senatorialNRM: finalResult2.NRM,
        senatorialNNPP : finalResult2.NNPP, 
        senatorialPDP : finalResult2.PDP, 
        senatorialPRP : finalResult2.PRP, 
        senatorialSDP : finalResult2.SDP, 
        senatorialYPP : finalResult2.YPP, 
        senatorialZLP : finalResult2.ZLP,
        

    }

    globalTallyResult = tallyResult

    //res.render('tallyVotePage', tallyResult)
    console.timeEnd("Response Time for Tally Action")
    res.render('tallyVoteTableExpanded', tallyResult);

})


app.use('/adminLogout', checkSignIn, function(err, req, res, next){
    res.redirect('/adminLogin'); //redirects the user back to adminlogin if credentials are not correct.

})

app.get('/adminLogout', checkSignIn, async function(req, res){
    
    console.log(req.session.user)
    
   req.session.destroy(function(){
      console.log("admin logged out.")
   });
   res.redirect('/adminLogin');
});


app.get('/voterLogout', async function(req, res){

    emailRecipient = null  // set the email address to receive the ballot receipt
    emailVoterID = null  //sets the ID of the voter that just casted his ballot

    
    //console.log(req.session.user)
   //await bitcoin.saveChain();
    await bitcoin.updateSavedChain()
    ///this is where we put the new one.

//    req.session.destroy(function(){
//       console.log("Voter logged out.")
//    });
   //res.redirect('/voterLogin');
   res.redirect('/voterLogin');
});

//provides a means for a voter who does not want to vote to logout.
 app.use('/noVoteLogout', checkSignIn, function(err, req, res, next){
     res.redirect('/voterLogin'); //redirects the user back to login if credentials are not correct.
 })

 app.get('/noVoteLogout', checkSignIn, async function(req, res){
     req.session.destroy(function(){
         console.log("Voter logged out without voting.")
      });
      res.redirect('/voterLogin');
})



//Beginning of the mail sending functionality.


// app.use('/sendMail', checkSignIn, function(err, req, res, next){
//     res.redirect('/voterLogin'); //redirects the user back to adminlogin if credentials are not correct.
// })

app.get('/sendMail', async function(req, res){


    //uncomment all of this to send the user simply text

//     let ledgerLink = "https://sample.com"

    
    
//     emailn1 = "Thanks for exercising your civic duty.\n"
//     emailnn = "\nYou are receiving this mail because you just casted your vote using the CPE Machines e-Voting system."
//     emailnnn = "\nBelow is a receipt containing your Voter ID and a ciphered(encrypted) form of your vote."
//     var emailVoterID = "<p style='font-weight:bold;'>Testing mail</p>";
//     //emailVoterID = "\n\nVoter ID: "+req.session.user.id;
//     emailPresidentialBallot = "\nPresidential: \n"+ encryptedPresidentialBallot;
//     emailSenatorialBallot = '\nSenatorial: \n'+ encryptedSenatorialBallot;

//     email2 = "\nPlease note that your vote will count and be tallied appropriately even if you do not take any action specified in this mail."

//     email3 = "\n\nOtherwise, please follow the instructions below carefully."
//     email4 = "\n* Visit "+ledgerLink+ " using a browser, preferrably a chromium-based one. The link takes you to a web page which is a ledger of the e-voting system. This ledger contains the ciphered(encrypted) votes of all voters, including yourself."
//     email5 = "\n* Once the page has loaded, type in your voter ID into the search bar."
//     email6 = "\n* Your voter ID is unique to you as such the search will return only one result. The result contains the encrypted copy of your ballot. Check to see if the values in this mail are the same with the values registered against your voter ID on the blockchain."
//     email7 = "\n* As expected the values will be the same, which means your vote is secure and will be tallied appropriately."
//     email8 = "\n\n* Why do we do this?"
//     email9 = "\nWe do this to ensure that all votes can be verified securely without compromising the privacy of any voter."
//     email10= "\nThanks for using the CPE Machines e-Voting system."

//     //emailText = emailPresidentialBallot+ "\n"+ emailSenatorialBallot;
//     emailText = emailn1 + emailnn + emailnnn + emailVoterID + emailPresidentialBallot +  emailSenatorialBallot + email2 + email3 + email4 + email5 + email6 + email7 + email8 + email9 + email10;
//     emailSubject = 'e-Voting Ballot receipt for '+ req.session.user.id;
//     emailRecipient = req.session.user.email;    
    
//     let adb = "<p style='font-weight:bold;>"+req.session.user.id+"</p>"

//     var transporter = nodemailer.createTransport({
//         service: 'gmail', 
//         auth : {
//             user: "mcwilliamsanthonia@gmail.com", 
//             pass : "icswpddfijineivq"
//         }
//     });

//    var mailOptions  = {
//        from: 'mcwilliamsanthonia@gmail.com', 
//        to : ""+emailRecipient, 
//        subject: emailSubject,
//        html: adb, 
       
//    }

let ledgerLink = "https://cpemachines.onrender.com/blockledger"

    
    emailn1 = "Thanks for exercising your civic duty.\n"
    

    emailnn = "You are receiving this mail because you just casted your vote using the CPE Machines e-Voting system."
    //let hemailnn = "<p>"+emailnn+"<br/></p>"

    emailnnn = "Below is a receipt containing your Voter ID and a ciphered(encrypted) form of your vote."

    //let hemailnnn = "<p>"+emailnnn+"</p>"

    let hemailn1 = "<p>"+emailn1+"<br/>"+ emailnn + emailnnn +"<br/>"+"</p>" //1

    //emailVoterID = req.session.user.id;
    let hemailVoterID = "<p>Voter ID: "+"<b style='font-weight:bold; color:#708CB2'>"+emailVoterID+"</b></p>" //2

    
    emailPresidentialBallot =  encryptedPresidentialBallot;  //previously encrypedPresidentailBallot
    let hemailPresidentialBallot = "<p>Presidential Ballot: "+"<b style='font-weight:bold; color:#708CB2'>"+ emailPresidentialBallot + "</b></p>" //3
    
    emailSenatorialBallot =  encryptedSenatorialBallot;
    let hemailSenatorialBallot = "<p>Senatorial Ballot: "+"<b style='font-weight:bold; color:#708CB2'>"+ emailSenatorialBallot +"</b></p>"; //4
    
    email2 = "Please note that your vote will count and be tallied appropriately even if you do not take any action specified in this mail."
    let hemail2 = "<p>"+email2+ "</p>"; //5

    email3 = "Otherwise, please follow the instructions below carefully."
    let hemail3 = "<p>"+email3+"</p>" //6

    email4 = "* Visit "+"<b style='font-weight:bold; color:#708CB2'>"+ledgerLink+"</b>"+ " using a browser, preferrably a chromium-based one. The link takes you to a web page which is a ledger of the e-voting system. This ledger contains the ciphered(encrypted) votes of all voters, including yourself.<br/>"
    

    email5 = "* Once the page has loaded, type in your voter ID into the search bar.<br/>"

    email6 = "* Your voter ID is unique to you as such the search will return only one result. The result contains the encrypted copy of your ballot. Check to see if the values in this mail are the same with the values registered against your voter ID on the blockchain.<br/>"
    

    

    email7 = "* As expected the values will be the same, which means your vote is secure and will be tallied appropriately.<br/>"
    

    let hemail4 = "<p>"+email4+ email5 + email6+ email7+ "</p>" //7

    email8 = ">> Why do we do this?<br/>"
    

    email9 = "We do this to ensure that all votes can be verified securely without compromising the privacy of any voter."
    //let hemail9 = "<p>"+email9+ "</p>" //12

    let hemail8 = "<p>"+email8+email9+"</p>" //11

    email10= "Thanks for using the CPE Machines e-Voting system."
    let hemail10 = "<p style='font-weight:bold; color:#708CB2' >"+email10 + "</p>"  //13

    //emailText = emailPresidentialBallot+ "\n"+ emailSenatorialBallot;
    //emailText = emailn1 + emailnn + emailnnn + emailVoterID + emailPresidentialBallot +  emailSenatorialBallot + email2 + email3 + email4 + email5 + email6 + email7 + email8 + email9 + email10;
    hemailhtml = hemailn1 + hemailVoterID + hemailPresidentialBallot +  hemailSenatorialBallot + hemail2 + hemail3 + hemail4 + hemail8 + hemail10;
    emailSubject = 'e-Voting Ballot receipt for '+ emailVoterID;
    //emailRecipient = req.session.user.email;    
    //let designedEmail = "<body style='background-image: linear-gradient(green, white);'>"+hemailhtml +"</body>"
    
    let adb = "<p style='font-weight:bold;>"+emailVoterID+"</p>"
    console.log("Trying the new password")
    //pass : "fuyhkuuxxeuwvmqh"
    var transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth : {
            user: "cpemachines@gmail.com", 
            pass : "VYNEaTaRdmVt_9-"
        }
    });

   var mailOptions  = {
       from: 'cpemachines@gmail.com', 
       to : ""+emailRecipient, 
       subject: emailSubject,
       html: hemailhtml
   }

   await transporter.sendMail(mailOptions, function(error, info){
    if(error) console.log(error," has occured");
    else {
        console.log("Email sent: "+info.response)
    }
    })
    //end of email sending 

    //then to add the voter to the list of voters that have voted already

    let votedUser = {
        id : loggedInVoterId

    }
    console.log(votedUser);

    
    
    await alreadyVoted.add(votedUser) /*adds the voted user to the database for referrence to prevent multiple log in of a single voter */

   
   //res.redirect('/voterLogin');
   res.json({"message":"Email sent successfully"})

})



//beginning of endpoints for the bitTest blockchain
app.get('/bitTest', function(req, res){
    res.send(bitTest);
})


app.get('/bitTestLogin', function(req, res){

    res.render('bitTestLogin');
})


app.get("/bitTestLedger", function(req, res){
  
    res.render('bitBlockLedger');
})


app.post('/bitTestCreateLogin', async function(req, res){

    if(!req.body.id || !req.body.password || !req.body.email){
        res.send('nOK');
    }

    else {

        let newBitTestUser = {
            id : req.body.id, 
            name: req.body.name, 
            password: req.body.password,
            email: req.body.email
        }


        try{
        await bitTestDB.add(newBitTestUser);
        }
        catch(error){
            console.log(error)
            console.log("An error occured in the process of adding the new bit test user");
        }

        res.send("Bit Test User added successfully");
    }

})


app.post('/bitTestLogin', async function(req, res){


        console.log("Inside the bit test login endpoint")

        //let admin = await adminDB.get();
        let bitAdmin = await bitTestDB.get();

        let bitAdminId = bitAdmin[0].id;
        let bitAdminPwd = bitAdmin[0].password;

        if(req.body.id == null || req.body.password == null){
            res.redirect('/bitTestLogin');
        }

        else if(req.body.id == bitAdminId && req.body.password == bitAdminPwd){

            //first let's clear the exisiting chain
            //bitTest.emptyChain();

            //then we can log the admin in
            req.session.user = bitAdmin[0];
            res.redirect('/bitTestPage');
        } 

        else {
            res.render('bitTestLogin', {message: "Incorrect Login Details"});
        }
})



app.use('/bitTestClear', checkSignIn, function(err, req, res, next){
    res.redirect('/bitTestLogin');
})

app.get('/bitTestClear', checkSignIn, async function(req, res){

    //we clear the bitTest chain of previously generated data;
    bitTest.emptyChain();
    res.render('bitTestPageClear', {user: req.session.user.id, message:"Previously Generated Ballots Have Been Cleared Successfully"});
    //res.redirect('/bitTestPage');

})


app.use('/bitTestPage', checkSignIn, function(err, req, res, next){
    res.redirect('/bitTestLogin');
})

app.use('/bitGenerateBallots', checkSignIn, function(err, req, res, next){
    res.redirect('/bitTestLogin');
})

app.use('/bitSendToBlockchain', checkSignIn, function(err, req, res, next){
    res.redirect('/bitTestLogin'); //redirects the user back to login if credentials are not correct.

})

app.get('/bitTestPage', checkSignIn, function(req, res){
    res.render('bitTestPage', {user: req.session.user.id});
})


app.post('/bitGenerateBallots', checkSignIn, async function(req, res){

    

    let generatedPresRandNumber = [];
    let generatedSenRandNumber = [];

    let finalGeneratedPresBallotStore = [];
    let finalGeneratedSenBallotStore = [];

    let encryptedGeneratedPresBallot = [];
    let encryptedGeneratedSenBallot = [];

    let bitPresA = 0;
    let bitPresB = 0;
    let bitPresC = 0;

    let bitSenA = 0;
    let bitSenB = 0;
    let bitSenC = 0;

    let bitTestVoters = null;
    bitTestVoters = req.body.numberofvoters;  //stores the value of Number of voters passed in from form on bitTestPage

    let generateRandomPairs = function(noOfTimes){

    finalGeneratedPresBallotStore = [];
    finalGeneratedSenBallotStore = [];

    for(let x=0;x<noOfTimes;x++){

       let  b = 0;

        for(let a=0; a<6;a++){
            if(a<3){
                generatedPresRandNumber[a] = Math.round(Math.random()*1);
            }

            else if(a>=3 && a<6){

                generatedSenRandNumber[b] = Math.round(Math.random()*1);
                b += 1
            }
        }

        // console.log("Here is the list of the generated random numbers");
        // console.log(generatedPresRandNumber);
        // console.log(generatedSenRandNumber); //prints out the six random numbers;

    //then I check if each of them have a 1;

    function checkForOneInArray(item){
        if(item == 1){
            return true
        }
        else {
            return false;
        }
    }

    
    if(generatedPresRandNumber.indexOf(1) !=-1){

        generatedPresRandNumber.forEach((item, index)=>{
        
        if(item == 1){
            generatedPresRandNumber = [0,0,0];
            generatedPresRandNumber[index]= item;
        }
   
    })
    }

    else {
        generatedPresRandNumber = [1,0,0]
    }

    
     if(generatedSenRandNumber.indexOf(1) != -1){

        generatedSenRandNumber.forEach((item, index)=>{
        
        if(item == 1){
            generatedSenRandNumber = [0,0,0];
            generatedSenRandNumber[index]= item;
        }
   
    })
    }

    else {
        generatedSenRandNumber = [1,0,0]
    }


    // console.log("Here are the list of the presidential and the senatorial ballots");
    // console.log(`Presidential: ${generatedPresRandNumber} and \nSenatorial: ${generatedSenRandNumber} \n`);

    finalGeneratedPresBallotStore.push(generatedPresRandNumber);
    finalGeneratedSenBallotStore.push(generatedSenRandNumber);

    generatedPresRandNumber = [];
    generatedSenRandNumber = [];
    }   //end of generation of  single array pairs.
    

}

if(bitTestVoters != null && bitTestVoters> 0){

   await generateRandomPairs(bitTestVoters);

//    console.log(`Here is the final store of all generated ballot`);
//    console.log(`Presidential: ${finalGeneratedPresBallotStore}`)
//    console.log(`Senatorial: ${finalGeneratedSenBallotStore}`)


   let breakDownAndEncryptPresidentialBallot = async function(item){
    //it receives the array containing 3votes times no entered by user.

    let finalGeneratedPresBallotStore = [];
    
//     console.log(`The sent in ballots are....`)
//     console.log(`..............NNNNNNNNNNNNNNNNNNNNNNAAAAAAAAAAAAAAAAAAAAMMMMMMMMMMMMEEEEEE................`)
//     console.log(`${item} is the results`)
//    // we first of all break the long chunk of generated ballots into groups of three
    let runFunction1 = async function(){
    for(let ag=0;ag<item.length;ag+=3){

        // console.log(item[ag],'is first')
        // console.log(item[ag+1], ' is second')
        let generatedBallotA = item[ag]
        let generatedBallotB = item[ag+1]
        let generatedBallotC = item[ag+2]

        let returnA = paillierEncTest.encryptBallots(generatedBallotA)
        encryptedGeneratedPresBallot.push(returnA)
        let returnB;
        let returnC;
    if(typeof generatedBallotB != 'undefined' && generatedBallotB != null)
    {
         returnB = paillierEncTest.encryptBallots(generatedBallotB)
         
         encryptedGeneratedPresBallot.push(returnB)
        
    }

    if(typeof generatedBallotC != 'undefined' && generatedBallotC != null)
    {
        
         returnC = paillierEncTest.encryptBallots(generatedBallotC)
        
         encryptedGeneratedPresBallot.push(returnC)
    }

            returnA = null;
            returnB = null;
            returnC = null;
    }
}

await runFunction1();
    
       
   }

   let breakDownAndEncryptSenatorialBallot = async function(item){

    let finalGeneratedSenBallotStore = [];

    //we first of all break the long chunk of generated ballots into groups of three
    let finalGeneratedPresBallotStore = [];
    
    // console.log(`The sent in ballots are....`)
    // console.log(`..............NNNNNNNNNNNNNNNNNNNNNNAAAAAAAAAAAAAAAAAAAAMMMMMMMMMMMMEEEEEE................`)
    // console.log(`${item} is the results`)
   // we first of all break the long chunk of generated ballots into groups of three
    
   let runFunction = async function(){
    for(let ag=0;ag<item.length;ag+=3){

        // console.log(item[ag],'is first')
        // console.log(item[ag+1], ' is second')
        let generatedBallotA = item[ag]
        let generatedBallotB = item[ag+1]
        let generatedBallotC = item[ag+2]

        let returnA = paillierEncTest.encryptBallots(generatedBallotA)
        encryptedGeneratedSenBallot.push(returnA)
        let returnB;
        let returnC;
    if(typeof generatedBallotB != 'undefined' && generatedBallotB != null)
    {
         returnB = paillierEncTest.encryptBallots(generatedBallotB)
         encryptedGeneratedSenBallot.push(returnB)
        
    }

    if(typeof generatedBallotC != 'undefined' && generatedBallotC != null)
    {
         
         returnC = paillierEncTest.encryptBallots(generatedBallotC)
         encryptedGeneratedSenBallot.push(returnC)
    }
            returnA = null;
            returnB = null;
            returnC = null;
        }
    }

    await runFunction();
    // for(let ag=0;ag<item.length;ag+=3){

    //     let generatedBallotA = item[ag]
    //     let generatedBallotB = null;

    //     if((ag+1)<item.length){
    //         generatedBallotB = item[ag+1];
    //     }
    //     else {
    //         ballotOverflowFlag = true;
    //         ballotOverflowNumber = 1;
    //         generatedBallotB = 0;
    //     }

    //     let generatedBallotC = null;

    //     if(ag+2 < item.length){
    //      ballotOverflowNumber = 2;
    //      generatedBallotC = item[ag+2]
    //     }

    //     else {
    //      generatedBallotC = 0;
    //     }


    //     let returnA = paillierEncTest.encryptBallots(generatedBallotA)
    //     let returnB = paillierEncTest.encryptBallots(generatedBallotB)
    //     let returnC = paillierEncTest.encryptBallots(generatedBallotC)

    //     encryptedGeneratedSenBallot.push(returnA)
    //     encryptedGeneratedSenBallot.push(returnB)
    //     encryptedGeneratedSenBallot.push(returnC)
    // }
       
   }

   function printEncryptedBallots(item){
       for(let a=0;a<item.length;a++){
           //console.log(item[a])
       }
   }

   console.log("\n")
   
   console.time("Encryption Time:"); //this is to measure time
   await breakDownAndEncryptPresidentialBallot(finalGeneratedPresBallotStore)
   await breakDownAndEncryptSenatorialBallot(finalGeneratedSenBallotStore)
   console.timeEnd("Encryption Time:");

   //Then we set the results equal to a global variable to be able to work on it from different API endpoints
   encryptedTestPresidentialBallot = encryptedGeneratedPresBallot;
   encryptedTestSenatorialBallot = encryptedGeneratedSenBallot;


   //printEncryptedBallots(encryptedGeneratedPresBallot);

//    console.log(`Encrypted Presidential Ballots: ${encryptedGeneratedPresBallot}`)
//    console.log(`Encrypted Senatorial Ballots: ${encryptedGeneratedSenBallot}`)

   nextGeneratedBallotMineFlag==true; //to allow for mining of several ballots on one click.
   

    res.render("bitGenerateConfirm", {user:req.session.user.id})

}

else {
    res.send("Operation failed");
}
})


app.get('/bitSendToBlockchain', checkSignIn, async function(req, res){


    //console.log("Inside the Bit Send to Blockchain endpoint");
    console.time("Time to vote: ")
    let testingUpload = []

    encryptedTestBallots = [];
    encryptedJsonFinal = [];

    //first of all add all the ballots in json inside an array for each campaign

    for(let bts=0; bts<encryptedTestPresidentialBallot.length; bts++){


        encryptedTestBallots[0] = encryptedTestPresidentialBallot[bts].ballot1;
        encryptedTestBallots[1] = encryptedTestPresidentialBallot[bts].ballot2;
        encryptedTestBallots[2] = encryptedTestPresidentialBallot[bts].ballot3;
        encryptedTestBallots[3] = encryptedTestSenatorialBallot[bts].ballot1;
        encryptedTestBallots[4] = encryptedTestSenatorialBallot[bts].ballot2;
        encryptedTestBallots[5] = encryptedTestSenatorialBallot[bts].ballot3;

        
        //uncomment this section to one by one mine the ballots, instead of minning them all at once.
        // const requestPromises = [];
        //     let reqLocation  = req.protocol +"://"+req.get('host')
        //     console.log(reqLocation);

        //     const requestOptions = {
        //         uri : reqLocation + '/bitTestTransaction/broadcast', 
        //         method : 'POST', 
        //         body : {
        //             'amount' : encryptedTestBallots, 
        //             'sender' : req.session.user.id,
        //             'recipient' : "Admin"
        //         }, 
        //         json : true
        // };

        //     try {

        //         requestPromises.push(rp(requestOptions)); //execute the promise.

        //         await Promise.all(requestPromises).then(data =>{
        //             console.log("Execution of the bitTestTransaction/broadcast");
        //             encryptedTestBallots = []; //we clear the encryptedballots again.
        //             console.log(data); 
        //         })
        //     }

        //     catch(error){
        //         console.log(error);
        //         console.log("Hitting bitTestTransaction/broadcast failed");
        //     } 

            noOfGeneratedTestBallotMined = bts;
            noOfGeneratedTestBallotMined += 1;
}

                    let presidentialArrayUpload = {
                        presidentalTotal : encryptedTestPresidentialBallot
                    }

                    let senatorialArrayUpload = {
                        senatorialTotal: encryptedTestSenatorialBallot
                    }

                    testingUpload.push(presidentialArrayUpload);
                    testingUpload.push(senatorialArrayUpload);
                    
                    const requestPromises = [];
                    let reqLocation  = req.protocol +"://"+req.get('host')
                    //console.log(reqLocation);

                    const requestOptions = {
                        uri : reqLocation + '/bitTestTransaction/broadcast', 
                        method : 'POST', 
                        body : {
                            'amount' : testingUpload, 
                            'sender' : req.session.user.id,
                            'recipient' : "Admin"
                        }, 
                        json : true
                };

                    try {

                        requestPromises.push(rp(requestOptions)); //execute the promise.

                        await Promise.all(requestPromises).then(data =>{
                            //console.log("Final Execution of the bitTestTransaction/broadcast");
                            encryptedTestBallots = []; //we clear the encryptedballots again.
                            //console.log(data); 
                        })
                    }

                    catch(error){
                        console.log(error);
                        console.log("Final Hitting bitTestTransaction/broadcast failed");
                    } 


console.timeEnd("Time to vote: ")


//console.log({"info": "Finished mining "+noOfGeneratedTestBallotMined});

 res.render('bitTestTallyPage');
//res.redirect('/bitTestTally') // use this to skip the second page
//res.redirect('/bitAdminLogout');

})


app.use('/bitadminLogout', checkSignIn, function(err, req, res, next){
    res.redirect('/bitTestLogin'); 
})

app.get('/bitAdminLogout', checkSignIn, async function(req, res){
    //console.log("Inside the Bit Admin logout");
    req.session.destroy(function(){
        console.log("admin logged out.")
     });

    res.redirect('/bitTestLogin'); 
})


app.post('/bitAdminLogout', checkSignIn, async function(req, res){
    //console.log("Inside the Bit Admin logout");
    req.session.destroy(function(){
        console.log("admin logged out.")
     });

    res.redirect('/bitTestLogin'); 
})


//BitTest endpoint to tally the encrypted generated ballots

app.use('/bitTallyVote', checkSignIn, function(err, req, res, next){
    res.redirect('/bitTestLogin'); //redirects the user back to login if credentials are not correct.
})

app.use('/bitTestTally', checkSignIn, function(err, req, res, next){
    res.redirect('/bitTestLogin'); //redirects the user back to login if credentials are not correct.
})

app.get('/bitTestTally', checkSignIn, function(req,  res){


    let allTestPresidentialBallots = [];
    let allTestSenatorialBallots = [];

    if(bitTest.chain.length == 1){
       
        res.render('tallyError', {id: req.session.user.id});
    }


 bitTest.chain.forEach(function(block, index){
    
    if(block.index == 1){
        //console.log(block);
    }
    
    else {
    // block.transactions.forEach(function(transaction, index){
    
    //      testpresidentialData = {
    //         ballot1 : transaction.amount[0], 
    //         ballot2 : transaction.amount[1], 
    //         ballot3 : transaction.amount[2]
    //     }

    //     testsenatorialData = {
    //         ballot1 : transaction.amount[3], 
    //         ballot2 : transaction.amount[4], 
    //         ballot3 : transaction.amount[5]
    //     }

    //     // allTestPresidentialBallots.push(testpresidentialData);
        
    //     // allTestSenatorialBallots.push(testsenatorialData);
    // })

        block.transactions.forEach(function(transaction, index){

            allTestPresidentialBallots.push(...(transaction.amount[0].presidentalTotal))   //spreads out all ballots inside the presidential array inside the other array
            allTestSenatorialBallots.push(...(transaction.amount[1].senatorialTotal))


        })
    }
})
 

//    console.log("Lets print the log of presidential data")
//    console.log(allTestPresidentialBallots);
//    console.log(allTestSenatorialBallots);
   
   
   
   let returnValue = paillierEncTest.getCount(allTestPresidentialBallots, allTestSenatorialBallots);  

   finalTestResult1 = returnValue.result1;
   finalTestResult2 = returnValue.result2;

//    console.log(finalTestResult1);
//    console.log(finalTestResult2);


    let tallyTestResult = {
        id: req.session.user.id, 

        presidentialAPC: finalTestResult1.APC, 
        presidentialPDP: finalTestResult1.PDP, 
        presidentialAPGA: finalTestResult1.APGA, 

        senatorialAPC:finalTestResult2.APC, 
        senatorialPDP:finalTestResult2.PDP, 
        senatorialAPGA:finalTestResult2.APGA
    }

    //let globalTestTallyResult = tallyTestResult

    res.render('bitTestTallyVotePageTable', tallyTestResult);
    
})



app.post('/bitTestTransaction/broadcast', function( req, res){


    //console.log("Inside the bitTestTransaction/broadcast endpoint")

    const newTransaction = bitTest.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);

    

        let reqLocation = req.protocol + "://"+req.get('host');  //this captures the url making the request

        const requestPromises = [];
        const requestOptions = {
            uri : reqLocation + '/bitTransaction',
            method : 'POST', 
            body: newTransaction,
            json: true
        };

        requestPromises.push(rp(requestOptions));

        try{
        Promise.all(requestPromises).then(data=>{
            //console.log("Hitting the bitTransaction endpoint now");
            res.json(data);
        })
    }

    catch(error){
        // console.log(error);
        // console.log("Unable hit the bitTransaction Endpoint");
    }

})  



app.post('/bitTransaction', function(req, res){

    const newTransaction = req.body;
    const blockIndex = bitTest.addTransactionToPendingTransactions(newTransaction);

    let reqLocation  = req.protocol +"://"+req.get('host')
    const requestPromises = [];
    const requestOptions = {
        uri : reqLocation + "/bitMine", 
        method: 'GET', 
        json : true
    }

    requestPromises.push(rp(requestOptions));

    try{
    Promise.all(requestPromises).then(data =>{
        //console.log("Hitting the Mine Endpoint");
        res.send(data);
    })}
    catch (error){
        console.log(error, 'occured when trying to hit the bitMine endpoint')
        res.json({note:`Transaction will be added in block ${blockIndex}`});
    }

})

app.get('/bitMine', function(req, res){

    const lastBlock = bitTest.getLastBlock();
    const previousBlockHash  = lastBlock['hash']
    const currentBlockData = {
        transactions: bitTest.pendingTransactions,
        index: lastBlock['index'] + 1, 

    };

    console.log("///////////////////////////////")
    console.time("Minning Time:")
    
    const nonce = bitTest.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = bitTest.hashBlock(previousBlockHash, currentBlockData, nonce)
    let newBlock = 0;
    if(bitTest.pendingTransactions.length != 0)  {  //checks if there are pendingtransactions, if there are, 
                                                    //it will mine if there are no transactions, it will not mine
         newBlock = bitTest.createNewBlock(nonce, previousBlockHash, blockHash)
    }

    const requestPromises = [];
    bitTest.networkNodes.forEach(networkNodeUrl =>{
        const requestOptions = {
            uri: networkNodeUrl + "/bit-receive-new-block", 
            method: "POST", 
            body: {newBlock: newBlock}, 
            json: true
        };

        requestPromises.push(rp(requestOptions))
    });


    try{

    Promise.all(requestPromises).then(data =>{

            //console.log("Hitting the bit-receive-new-block endpoint");
            res.json({dataMine: "sample", data});
    })

        console.timeEnd("Minning Time:")
        console.log("///////////////////////////////")
        
    }
    

    catch(error){
        res.json({error:" occured while trying to hit the receie-new-block endpoint"});
    }

});

app.post('/bit-receive-new-block', function(req, res){

    //console.log("inside the bit receive new block endpoint");
    const newBlock = req.body.newBlock;
    const lastBlock = bitTest.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1  === newBlock ['index'];

    if(correctHash && correctIndex) {
        bitTest.chain.push(newBlock);
        bitTest.pendingTransactions = [];
        res.json({"data":"Bit receive completed"});
     
    } else {
        console.log("Error occured in here");
        res.json({"error":"Error occured in the bit-receive-new block endpoint"});
    }
        
})



// code to manually hit all the nodes one after the other to synchronize the networkNodes
app.post('/permitNodesBulk', async function(req, res){

    let allBlockchainNodes = req.body.allBlockchainNodes; //holds the nodes passed in
    
    let bulkHitNodeUrl = req.protocol + '://' + req.get('host');  //check for the url of the node hit.
     //console.log(`The hit node is ${bulkHitNodeUrl}`);


    allBlockchainNodes.forEach((item)=>{
        if((bitcoin.networkNodes.indexOf(item)) == -1){ //if the node is not already present in the network
         bitcoin.networkNodes.push(item); //push the node unto the network nodes array
     }
     })

   const requestPromises  = [];  //holds all the request promises.

    bitcoin.networkNodes.forEach((item)=>{

         const requestOptions = {
             uri: item + '/permissionEachNode', 
             method: "POST", 
             body: {"allBlockchainNodes": bitcoin.networkNodes, "firstHitNodeUrl":bulkHitNodeUrl}, 
             json: true
         }

         requestPromises.push(rp(requestOptions));
    })

    Promise.all(requestPromises).then(data =>{
         //then we need to send the hit node to all the nodes in the network.

         res.json({data:data});
      })
    //res.json({"info": "Nodes have been added to the networkNodes array"});
 })


 app.post('/permissionEachNode', async function(req, res){

     let allBlockchainNodes = req.body.allBlockchainNodes;
     console.log(allBlockchainNodes);
     
     let firstHitNodeUrl = req.body.firstHitNodeUrl;
     console.log(firstHitNodeUrl);

     let bulkHitNodeUrl = req.protocol + '://' + req.get('host');  //check for the url of the node hit.
     console.log(`The import node url is  ${bulkHitNodeUrl}`);
     allBlockchainNodes.forEach((item)=>{
         if((bitcoin.networkNodes.indexOf(item)) == -1 && item !== bulkHitNodeUrl){ //if the node is not already present in the network
          bitcoin.networkNodes.push(item); //push the node unto the network nodes array
          if(bitcoin.networkNodes.indexOf(firstHitNodeUrl) == -1){
              bitcoin.networkNodes.push(firstHitNodeUrl);
          }
      }
     
 })
 res.json({"info": "Nodes have been added to the networkNodes array"});

 })


app.listen(port, function(){
    console.log(`Listening on port ${port}...`)
}).timeout = 1200000


