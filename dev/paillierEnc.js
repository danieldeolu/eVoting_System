//'use strict'
const crud = require('./crud')
let myCrud  = new crud()
const paillier = require('paillier-js');
const bigInt = require('big-integer');

const { publicKey, privateKey } = paillier.generateRandomKeys(32);

//Set the values for the public key for the encryption
publicKey.n.value =  2705104397n;
publicKey._n2.value = 7317589798668733609n;
publicKey.g.value = 4470188860474892529n;

//Set the values for the privateKey for the decryption
privateKey.lambda.value =  1352500158n;
privateKey.mu.value = 1620586852n;
privateKey._p.value = 50263n;
privateKey._q.value = 53819n;
privateKey.publicKey = publicKey

    
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
 
//  ballot.forEach(function(item, index){
//      console.log(index+ "value is "+item)
//  })



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


operation.prototype.encryptSingle =  function (ballot){
 
    //  ballot.forEach(function(item, index){
    //      console.log(index+ "value is "+item)
    //  })
     
    let bn1 = bigInt(ballot).mod(publicKey.n);
    while (bn1.lt(0)) bn1 = bn1.add(publicKey.n);

    
    let c1 = publicKey.encrypt(bn1)
   
    
    c1 = c1.toString()
    
    
    data = {
        ballot : c1
    }
        
        return data
    }

//operation.prototype.getCount = function(votes){

    //votes = await myCrud.get()
    

    
//     votes.forEach(function(item, index){

//         rc1 = BigInt(item.ballot1) //converts the stored string object into BigInt
//         rc2 = BigInt(item.ballot2) //converts the stored string object into BigInt
//         rc3 = BigInt(item.ballot3) //converts the stored string object into BigInt

//         oc1 = Object.create(sample) //creates a prototype of the object which will be used in the additive homomorphism from sample declared above
//         oc1.value = rc1 //sets the value of the prototype to the result of BigInt conversion

//         oc2 = Object.create(sample)
//         oc2.value = rc2

//         oc3 = Object.create(sample)
//         oc3.value = rc3

//         ncandid1 = publicKey.addition(ncandid1, oc1)
//         ncandid2 = publicKey.addition(ncandid2, oc2)
//         ncandid3 = publicKey.addition(ncandid3, oc3)

    
//     })

//       let tcandid1 = privateKey.decrypt(ncandid1)
//       let tcandid2 = privateKey.decrypt(ncandid2)
//       let tcandid3 = privateKey.decrypt(ncandid3)
      
//       let result = {
//           APC: Number(tcandid1.toString()), 
//           PDP : Number(tcandid2.toString()),
//           APGA: Number(tcandid3.toString())
//       }

//       return result;  

    
        
// }

// operation.prototype.getCount2 = function(candidate_ballots){
//     console.log(candidate_ballots);
//     let ncandid;
//     candidate_ballots.forEach(function(item){
//         rc1 = BigInt(item);  //converts the string balot to BigInt.

//         oc1 = Object.create(sample) //creates a prototype of the object which will be used in the additive homomorphism from sample declared above
//         oc1.value = rc1 //sets the value of the prototype to the result of BigInt conversion
//         ncandid = publicKey.addition(ncandid, oc1) //continuosly add up the ballots of a candidate
        
//     })

//     let tcandid = privateKey.decrypt(ncandid);

//     return Number(tcandid.toString()); ///returns the total number of ballots for a voter.
// }

operation.prototype.getCount = function(votes){

    let ncandid1 = ncandid2 = ncandid3 = null ;
    let flag = true;
    
    votes.forEach(function(item){

        rc1 = BigInt(item.ballot1) //converts the stored string object into BigInt
        rc2 = BigInt(item.ballot2) //converts the stored string object into BigInt
        rc3 = BigInt(item.ballot3) //converts the stored string object into BigInt
        rc4 = BigInt(item.ballot4) //converts the stored string object into BigInt
        rc5 = BigInt(item.ballot5) //converts the stored string object into BigInt
        rc6 = BigInt(item.ballot6) //converts the stored string object into BigInt
        rc7 = BigInt(item.ballot7) //converts the stored string object into BigInt
        rc8 = BigInt(item.ballot8) //converts the stored string object into BigInt
        rc9 = BigInt(item.ballot9) //converts the stored string object into BigInt
        rc10 = BigInt(item.ballot10) //converts the stored string object into BigInt
        rc11 = BigInt(item.ballot11) //converts the stored string object into BigInt
        rc12 = BigInt(item.ballot12) //converts the stored string object into BigInt
        rc13 = BigInt(item.ballot13) //converts the stored string object into BigInt
        rc14 = BigInt(item.ballot14) //converts the stored string object into BigInt
        rc15 = BigInt(item.ballot15) //converts the stored string object into BigInt
        rc16 = BigInt(item.ballot16)

        oc1 = Object.create(sample) //creates a prototype of the object which will be used in the additive homomorphism from sample declared above
        oc1.value = rc1 //sets the value of the prototype to the result of BigInt conversion

            
        oc2 = Object.create(sample)
        oc2.value = rc2

        oc3 = Object.create(sample)
        oc3.value = rc3

        oc4 = Object.create(sample)
        oc4.value = rc4

        oc5 = Object.create(sample)
        oc5.value = rc5
        
        oc6 = Object.create(sample)
        oc6.value = rc6
        
        oc7 = Object.create(sample)
        oc7.value = rc7
        
        oc8 = Object.create(sample)
        oc8.value = rc8
        
        oc9 = Object.create(sample)
        oc9.value = rc9

        oc10 = Object.create(sample)
        oc10.value = rc10

        oc11 = Object.create(sample)
        oc11.value = rc11

        oc12 = Object.create(sample)
        oc12.value = rc12

        oc13 = Object.create(sample)
        oc13.value = rc13

        oc14 = Object.create(sample)
        oc14.value = rc14

        oc15 = Object.create(sample)
        oc15.value = rc15

        oc16 = Object.create(sample)
        oc16.value = rc16

        if(flag){
        ncandid1 = publicKey.addition(addC, oc1)
        ncandid2 = publicKey.addition(addC, oc2)
        ncandid3 = publicKey.addition(addC, oc3)
        ncandid4 = publicKey.addition(addC, oc4)
        ncandid5 = publicKey.addition(addC, oc5)
        ncandid6 = publicKey.addition(addC, oc6)
        ncandid7 = publicKey.addition(addC, oc7)
        ncandid8 = publicKey.addition(addC, oc8)
        ncandid9 = publicKey.addition(addC, oc9)
        ncandid10 = publicKey.addition(addC, oc10)
        ncandid11 = publicKey.addition(addC, oc11)
        ncandid12 = publicKey.addition(addC, oc12)
        ncandid13 = publicKey.addition(addC, oc13)
        ncandid14 = publicKey.addition(addC, oc14)
        ncandid15 = publicKey.addition(addC, oc15)
        ncandid16 = publicKey.addition(addC, oc16)

        flag = false;
        }

        else {
            ncandid1 = publicKey.addition(ncandid1, oc1);
            ncandid2 = publicKey.addition(ncandid2, oc2);
            ncandid3 = publicKey.addition(ncandid3, oc3);
            ncandid4 = publicKey.addition(ncandid4, oc4);
            ncandid5 = publicKey.addition(ncandid5, oc5);
            ncandid6 = publicKey.addition(ncandid6, oc6);
            ncandid7 = publicKey.addition(ncandid7, oc7);
            ncandid8 = publicKey.addition(ncandid8, oc8);
            ncandid9 = publicKey.addition(ncandid9, oc9);
            ncandid10 = publicKey.addition(ncandid10, oc10);
            ncandid11 = publicKey.addition(ncandid11, oc11);
            ncandid12 = publicKey.addition(ncandid12, oc12);
            ncandid13 = publicKey.addition(ncandid13, oc13);
            ncandid14 = publicKey.addition(ncandid14, oc14);
            ncandid15 = publicKey.addition(ncandid15, oc15);
            ncandid16 = publicKey.addition(ncandid16, oc16);
            
        }
    
    })

      let tcandid1 = privateKey.decrypt(ncandid1)
      let tcandid2 = privateKey.decrypt(ncandid2)
      let tcandid3 = privateKey.decrypt(ncandid3)
      let tcandid4 = privateKey.decrypt(ncandid4)
      let tcandid5 = privateKey.decrypt(ncandid5)
      let tcandid6 = privateKey.decrypt(ncandid6)
      let tcandid7 = privateKey.decrypt(ncandid7)
      let tcandid8 = privateKey.decrypt(ncandid8)
      let tcandid9 = privateKey.decrypt(ncandid9)
      let tcandid10 = privateKey.decrypt(ncandid10)
      let tcandid11 = privateKey.decrypt(ncandid11)
      let tcandid12 = privateKey.decrypt(ncandid12)
      let tcandid13 = privateKey.decrypt(ncandid13)
      let tcandid14 = privateKey.decrypt(ncandid14)
      let tcandid15 = privateKey.decrypt(ncandid15)
      let tcandid16 = privateKey.decrypt(ncandid16)
      
      let result = {
          
        A: Number(tcandid1.toString()), 
        AA: Number(tcandid2.toString()), 
        ADP: Number(tcandid3.toString()), 
        APP: Number(tcandid4.toString()), 
        APC: Number(tcandid5.toString()), 
        APGA: Number(tcandid6.toString()), 
        BP: Number(tcandid7.toString()), 
        KP: Number(tcandid8.toString()), 
        LP: Number(tcandid9.toString()), 
        NRM: Number(tcandid10.toString()), 
        NNPP: Number(tcandid11.toString()), 
        PDP: Number(tcandid12.toString()), 
        PRP: Number(tcandid13.toString()), 
        SDP: Number(tcandid14.toString()), 
        YPP: Number(tcandid15.toString()), 
        ZLP: Number(tcandid16.toString()), 

      }

      return result;  
    
        
}



module.exports = operation