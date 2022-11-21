//if the chain already exists, it simply sets the blockchain equal to the blockchain.
let myCheck =  await bitcoin.checkExist() //you must await.
if(myCheck == true){
    await bitcoin.setChain();
    //res.send("All systems are ready. Previous campaign continued")
}

//if the db does not exist already, it will create it and set the chain equal to its content.
else {
    await bitcoin.saveChain();
    await bitcoin.setChain();
    //res.send("All systems are ready. New campaign started successfully.")
}