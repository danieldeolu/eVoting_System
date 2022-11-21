const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const uuid = require('uuid/v1');

var crd = require('./crud');
var crud = new crd("MyDB", "sampleChain");  //set the collection name for the chain here.

var myCrud = require('./chaincrud');
var crudChain = new myCrud();  //specify the name of the db and collection inside the chaincrud.js file

var myCrud2 = require('./chaincrud2');
var crudChain2 = new myCrud2(); 

var retrievedId;

function Blockchain(name, age){
    this.chain = [];   //holds all the mined blocks of the bchain
    this.pendingTransactions = [];  //holds all the new transactions before placing them in the blockchain
    this.createNewBlock(0, '0', '0'); //creates the genesis block

    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
}


Blockchain.prototype.checkExist = async function(){
    
    let dbFlag = false;
    let result =  await crud.check();
    if (result == null){
        console.log("Inside the if statement.")
        dbFlag = false;
    }

    
    if(result != null){
     result.forEach((item)=>{
        console.log(item.name);
        if(item.name == 'sampleChain'){ //specify the name of the collection that will hold the chain data here.
            console.log('The db exists, no need to create');
            dbFlag = true;
        }
       
    })
    }

   
    return dbFlag;
}

Blockchain.prototype.saveChain = async function(){

    data  = {
        "chain" : this.chain
    }
    let result = await crudChain.createSync(data);
    if(result != null) console.log('Operation was successfully included in the database')
    else console.log('Operation was not successful')
}

Blockchain.prototype.updateSavedChain = async function(){

    data = {
        "chain": this.chain
    }
    console.log(retrievedId, ' is the update chain id');
    let result  = await crudChain.updateOneSync(retrievedId, data);
    //then we distribute it to other nodes as well.
    try {
        let result2  = await crudChain2.updateOneSync(retrievedId, data);
    console.log("///////......Printing out result 2......///////")
    console.log(result2);
    }
    catch (error){
        console.log(error)
        console.log("Occured in the process of trying to update the chain");
    }

    if(result != null) console.log('Update Operation was successfully included in the database')
    else console.log('Operation was not successful')

}

Blockchain.prototype.setChain = async function(){
  
    let result = await crud.get();    
    retrievedId = result[0]._id.toString();
    
    //console.log(a, 'is ', typeof(a));

    console.log(result);
    if(this.chain.length <= result[0].chain.length){
    this.chain = result[0].chain;
    }
    else {
        console.log("Operation was unsuccessful.")
    }
    return result;

}


Blockchain.prototype.emptyChain = async function(){
    
    this.chain.splice(1,(this.chain.length)-1);   //deletes all elements of the chain except the genesis block
    return true;
}

Blockchain.prototype.createNewBlock  = function(nonce, previousBlockHash, hash) {
    const newBlock = {
        index : this.chain.length + 1,
        timestamp: Date.now(), 
        transactions: this.pendingTransactions, 
        nonce: nonce,  //nonce is a number which comes from a proof of work
        hash : hash, 
        previousBlockHash: previousBlockHash
    };    

    this.pendingTransactions = [];
    this.chain.push(newBlock); //pushes the block to the chain

    return newBlock;
}

Blockchain.prototype.getLastBlock = function(){
    return this.chain[this.chain.length - 1];
}

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient){
    const newTransaction = {
        amount : amount, 
        sender : sender, 
        recipient: recipient,
        transactionId: uuid().split('-').join('')
};

    //this.pendingTransactions.push(newTransaction);

    //return this.getLastBlock()['index'] + 1;
    return newTransaction;
}

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce){

    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData)
    const hash = sha256(dataAsString);
    return hash; 

}

Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj){
    this.pendingTransactions.push(transactionObj)
    return this.getLastBlock()['index'] + 1;
};

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData){
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while(hash.substring(0, 2) !== '00'){
        nonce ++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        
    }

    return nonce;
};

Blockchain.prototype.chainIsValid = function(blockchain){
    let validChain = true;

    for(var i =1; i < blockchain.length; i++){
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i-1];
        const blockHash = this.hashBlock(prevBlock['hash'], {transactions: currentBlock['transactions'], index: currentBlock['index'] } , currentBlock['nonce'])

        if(blockHash.substring(0, 2) !== '00') validChain =false;

        if(currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false;

        console.log('currentBlockHash => ', prevBlock['hash']);
        console.log("previousBlockHash => ", currentBlock['hash'])
    };

    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 0;
    const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
    const correctHash = genesisBlock['hash'] === '0';
    const correctTransactions = genesisBlock['transactions'].length === 0;

    if(!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) validChain = false;

    return validChain;
}


Blockchain.prototype.getBlock = function(blockHash){
    //iterates through the entire blockchain to get the block with a particular hash

    let correctBlock = null;

    this.chain.forEach(block =>{
        if(block.hash === blockHash) correctBlock = block;
    });

    return correctBlock;

}

Blockchain.prototype.overFlowDeal = function(number){
    this.chain.splice((this.chain.length-2),(this.chain.length)-1)
}

Blockchain.prototype.getTransaction = function(transactionId){

        let correctTransaction = null;
        let correctBlock = null;

        this.chain.forEach(block =>{
            block.transactions.forEach(transaction =>{
                if(transaction.transactionId === transactionId){
                    correctTransaction = transaction;
                    correctBlock = block;
                };
            })
        })

        return {
            transaction: correctTransaction, 
            block: correctBlock
        };
}

Blockchain.prototype.getAddressData = function(address){
    
    const addressTransactions = [];


    this.chain.forEach(block =>{
        block.transactions.forEach(transaction =>{
            if(transaction.sender === address || transaction.recipient === address){
                addressTransactions.push(transaction)
            }
        })
    })

    //this is the beginning of calculations for the balance of the address.
    let balance = 0;
    addressTransactions.forEach(transaction =>{
        if(transaction.recipient === address) balance += transaction.amount;
        else if (transaction.sender === address) balance -= transaction.amount
    })

    return {
        addressTransactions: addressTransactions, 
        addressBalance: balance
    }
}

//Beginning of the sendmail functions




module.exports = Blockchain