const paill = require('./paillierEnc');
const myPail = new paill();

sample = [0,0,0];
result = myPail.encryptBallots(sample);
console.log(result);

allBallots = [
    {
        ballot1: "1423709422", 
        ballot2: "2443703781",
        ballot3: "2089154909"
    }, 
    {
        ballot1: "1421692668" , 
        ballot2: "769301344",
        ballot3: "2878964581"
    },
    {
        ballot1: "1374873224", 
        ballot2: "397493605",
        ballot3: "162318902"
    },
    {
        ballot1: "1330985061", 
        ballot2: "1929541527",
        ballot3: "333949559"
    }
]

// let results = myPail.getCount(allBallots);

// console.log(results);


// const Blockchain = require('./blockchain')

// const bitcoin = new Blockchain();


// const bc1 = {
//     "chain": [
//     {
//     "index": 1,
//     "timestamp": 1591377368194,
//     "transactions": [],
//     "nonce": 0,
//     "hash": "0",
//     "previousBlockHash": "0"
//     },
//     {
//     "index": 2,
//     "timestamp": 1591377396244,
//     "transactions": [
//     {
//     "amount": "10778",
//     "sender": "0x00424R4RQE",
//     "recipient": "0xGTEWEFEF",
//     "transactionId": "45d32830a75011eaa274255fa06fb1e7"
//     },
//     {
//     "amount": "10778",
//     "sender": "0x00424R4RQE",
//     "recipient": "0xGTEWEFEF",
//     "transactionId": "46c7e870a75011eaa274255fa06fb1e7"
//     }
//     ],
//     "nonce": 4876,
//     "hash": "00036dee2b96c3b499d9c4920b097b7710e4d63c88d6c7aa03c50b79f07086be",
//     "previousBlockHash": "0"
//     },
//     {
//     "index": 3,
//     "timestamp": 1591377437697,
//     "transactions": [
//     {
//     "amount": "2110778",
//     "sender": "000x00424R4RQE",
//     "recipient": "0xGTEWEFEF",
//     "transactionId": "5a682b60a75011eaa274255fa06fb1e7"
//     },
//     {
//     "amount": "2110778",
//     "sender": "000x00424R4RQE",
//     "recipient": "0xGTEWEFEF",
//     "transactionId": "5b39ac30a75011eaa274255fa06fb1e7"
//     },
//     {
//     "amount": "12032110778",
//     "sender": "000x00424R4RQE",
//     "recipient": "0xGTEWEFEF",
//     "transactionId": "5e7d6580a75011eaa274255fa06fb1e7"
//     },
//     {
//     "amount": "091212032110778",
//     "sender": "000x00424R4RQE",
//     "recipient": "0xGTEWEFEF",
//     "transactionId": "6218b4b0a75011eaa274255fa06fb1e7"
//     }
//     ],
//     "nonce": 6380,
//     "hash": "000dbfff2d162bf6fadd3cc805bf9e7f3ffff37653c64d38ba7f34c38d41ad73",
//     "previousBlockHash": "00036dee2b96c3b499d9c4920b097b7710e4d63c88d6c7aa03c50b79f07086be"
//     },
//     {
//     "index": 4,
//     "timestamp": 1591377451133,
//     "transactions": [
//     {
//     "amount": "091212032110778",
//     "sender": "000x00424R4RQE",
//     "recipient": "0xGTEWEFEF",
//     "transactionId": "6e895e20a75011eaa274255fa06fb1e7"
//     }
//     ],
//     "nonce": 2820,
//     "hash": "000ccd1d9e7f387e0bc89fe30e7b7324f342a4491ba57e2ce96bfce033b7de1d",
//     "previousBlockHash": "000dbfff2d162bf6fadd3cc805bf9e7f3ffff37653c64d38ba7f34c38d41ad73"
//     },
//     {
//     "index": 5,
//     "timestamp": 1591377470419,
//     "transactions": [
//     {
//     "amount": "12091212032110778",
//     "sender": "000x00424R4RQE",
//     "recipient": "0xGTEWEFEF",
//     "transactionId": "76570c60a75011eaa274255fa06fb1e7"
//     }
//     ],
//     "nonce": 23483,
//     "hash": "000f4eaa97ed2ab646a6c956dcd80072ea25c5d2ee803ddb60ac81a75f87afc9",
//     "previousBlockHash": "000ccd1d9e7f387e0bc89fe30e7b7324f342a4491ba57e2ce96bfce033b7de1d"
//     }
//     ],
//     "pendingTransactions": [],
//     "currentNodeUrl": "http://localhost:3001",
//     "networkNodes": []
//     }

// console.log(bitcoin.chainIsValid(bc1.chain))
// // bitcoin.createNewTransaction(100, 'ALEXSD89F9WO0', 'JENN0ANTHEA');

// // bitcoin.createNewBlock(122345, '6454A90RHRHRHR', '53430IAAEJHEHRR');

// // const previousBlockHash = '0X44444Q234'
// // const currentBlockData = [
// //     {
// //         amount: 10 , 
// //         sender: "wqefwfef", 
// //         recipient: "efgrgrge" 
// //     }, 
// //     {
// //         amount: 40 , 
// //         sender: "wqefwfef", 
// //         recipient: "efgrgrge" 
// //     }, 
// //     {
// //         amount: 30 , 
// //         sender: "wqefwfef", 
// //         recipient: "efgrgrge" 
// //     }
// // ]; 

// // const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData)

// // console.log(nonce)

// // let result = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce)

// // console.log(result)

