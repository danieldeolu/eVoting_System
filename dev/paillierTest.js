//'use strict'
const crud = require('./crud')
let myCrud  = new crud()
const paillier = require('paillier-js');
const bigInt = require('big-integer');

const { publicKey, privateKey } = paillier.generateRandomKeys(32);

//Set the values for the public key for the encryption
publicKey.n.value =  9508684973462260309n;
publicKey._n2.value = 90415089924546986036818957907276775481n;
publicKey.g.value = 6216949196130791810659926803161412868n

//Set the values for the privateKey for the decryption
privateKey.lambda.value =  4754342483631943958n;
privateKey.mu.value = 4322766819720079643n;
privateKey._p.value = 2788911947n;
privateKey._q.value = 3409460447n;
privateKey.publicKey = publicKey


// publicKey.n.value =  2705104397n;
// publicKey._n2.value = 7317589798668733609n;
// publicKey.g.value = 4470188860474892529n;

// //Set the values for the privateKey for the decryption
// privateKey.lambda.value =  1352500158n;
// privateKey.mu.value = 1620586852n;
// privateKey._p.value = 50263n;
// privateKey._q.value = 53819n;
// privateKey.publicKey = publicKey

    
let objsample = bigInt(0).mod(publicKey.n);
while (objsample.lt(0)) objsample = objsample.add(publicKey.n);
let sample = publicKey.encrypt(objsample)
//console.log(sample.value)


let candid1 = bigInt(0).mod(publicKey.n);
while (candid1.lt(0)) candid1 = candid1.add(publicKey.n);
let ncandid1 = publicKey.encrypt(candid1) // is to be used for subsequent addition for candidate 1

let candid2 = bigInt(0).mod(publicKey.n);
while (candid2.lt(0)) candid2 = candid2.add(publicKey.n);
let ncandid2 = publicKey.encrypt(candid2) // is to be used for subsequent addition for candidate 1

let candid3 = bigInt(0).mod(publicKey.n);
while (candid3.lt(0)) candid3 = candid3.add(publicKey.n);
let ncandid3 = publicKey.encrypt(candid3) // is to be used for subsequent addition for candidate 1

//define some objects to allow us tally the cipher texts.
let num1 = 0;
let addSample = bigInt(num1).mod(publicKey.n);
while (addSample.lt(0)) addSample = addSample.add(publicKey.n);

let addC = publicKey.encrypt(addSample);
//end of definition.

function operation(){

    
}


operation.prototype.encryptBallots =  function (ballot){
 

let bn1 = bigInt(ballot[0]).mod(publicKey.n);
while (bn1.lt(0)) bn1 = bn1.add(publicKey.n);

let bn2 = bigInt(ballot[1]).mod(publicKey.n);
while (bn2.lt(0)) bn2 = bn2.add(publicKey.n); 

let bn3 = bigInt(ballot[2]).mod(publicKey.n);
while (bn3.lt(0)) bn3 = bn3.add(publicKey.n);

let c1 = publicKey.encrypt(bn1)
let c2 = publicKey.encrypt(bn2)
let c3 = publicKey.encrypt(bn3)

c1 = c1.toString()
c2 = c2.toString()
c3 = c3.toString()

data = {
    ballot1 : c1,
    ballot2 : c2, 
    ballot3: c3
}
    
    return data
}

operation.prototype.getCount = function(voteA, voteB){


    let ncandid1 = ncandid2 = ncandid3 = ncandid4 = ncandid5 = ncandid6 = null ;
    let flag1 = true;
    let flag2 = true;
    
    console.log("///////////////////////////////")
    console.time("Tallying time:")

    voteA.forEach(function(item){

        rc1 = BigInt(item.ballot1) //converts the stored string object into BigInt
        rc2 = BigInt(item.ballot2) //converts the stored string object into BigInt
        rc3 = BigInt(item.ballot3) //converts the stored string object into BigInt

        oc1 = Object.create(sample) //creates a prototype of the object which will be used in the additive homomorphism from sample declared above
        oc1.value = rc1 //sets the value of the prototype to the result of BigInt conversion

            
        oc2 = Object.create(sample)
        oc2.value = rc2

        oc3 = Object.create(sample)
        oc3.value = rc3

        if(flag1){
        ncandid1 = publicKey.addition(addC, oc1)
        ncandid2 = publicKey.addition(addC, oc2)
        ncandid3 = publicKey.addition(addC, oc3)
        flag1 = false;
        }

        else {
            ncandid1 = publicKey.addition(ncandid1, oc1);
            ncandid2 = publicKey.addition(ncandid2, oc2);
            ncandid3 = publicKey.addition(ncandid3, oc3);
        }
    
    })
    
     voteB.forEach(function(item){

        rc4 = BigInt(item.ballot1) //converts the stored string object into BigInt
        rc5 = BigInt(item.ballot2) //converts the stored string object into BigInt
        rc6 = BigInt(item.ballot3) //converts the stored string object into BigInt

        oc4 = Object.create(sample) //creates a prototype of the object which will be used in the additive homomorphism from sample declared above
        oc4.value = rc4 //sets the value of the prototype to the result of BigInt conversion

            
        oc5 = Object.create(sample)
        oc5.value = rc5

        oc6 = Object.create(sample)
        oc6.value = rc6

        if(flag2){
        ncandid4 = publicKey.addition(addC, oc4)
        ncandid5 = publicKey.addition(addC, oc5)
        ncandid6 = publicKey.addition(addC, oc6)
        flag2 = false;
        }

        else {
            ncandid4 = publicKey.addition(ncandid4, oc4);
            ncandid5 = publicKey.addition(ncandid5, oc5);
            ncandid6 = publicKey.addition(ncandid6, oc6);
        }
    
    })
    
    console.timeEnd("Tallying time:")
    console.log("///////////////////////////////")

      console.time("Decryption Time:")
      let tcandid1 = privateKey.decrypt(ncandid1)
      let tcandid2 = privateKey.decrypt(ncandid2)
      let tcandid3 = privateKey.decrypt(ncandid3)
      let tcandid4 = privateKey.decrypt(ncandid4)
      let tcandid5 = privateKey.decrypt(ncandid5)
      let tcandid6 = privateKey.decrypt(ncandid6)
      console.timeEnd("Decryption Time:")
      console.log("///////////////////////////////")
      
      let result1 = {
          APC: Number(tcandid1.toString()), 
          PDP : Number(tcandid2.toString()),
          APGA: Number(tcandid3.toString()), 
          
      }

      let result2 = {
        APC: Number(tcandid4.toString()), 
        PDP : Number(tcandid5.toString()),
        APGA: Number(tcandid6.toString()), 
        
    }

     let finalResultReturn = {
         result1: result1, 
         result2: result2
     }

      return finalResultReturn;
    
        
}



module.exports = operation