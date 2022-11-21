var mongoose = require('mongoose');
var promise = require('promise')
//var url = 'mongodb://localhost:27017/' 
var url = 'mongodb+srv://admin:admin123@cluster0.uvv2t.mongodb.net/' //newer one
var url2 = 'mongodb+srv://admin:admin123@cluster0.1ynwr.mongodb.net' //second node url
//var url = 'mongodb+srv://admin:admin123@daniel-d1wwk.mongodb.net/'


var dbName = 'MyDB';
var colName = 'sampleChain';

function chaincrud(){
  
}

url = url + dbName 

console.log(url);

const Schema = mongoose.Schema

const wordSchema = new Schema(
    //{"chain": [
    {"chain" : [{
        _id :false,
        index : Number, 
        timestamp : Number, 
        transactions : [{
            _id : false,
            amount : [{
                _id : false,
                type: String 
            }], 
            sender: String, 
            recipient: String, 
            transactionId: String
        }],
        nonce : Number, 
        hash : String, 
        previousBlockHash: String
    }]}
    //]}
)

var Words = mongoose.model('storage', wordSchema, colName);   //note that this.colName specifies the column
                                                                // where the records will get stored.

chaincrud.prototype.create = function(data)
{

    mongoose.connect(url, {useUnifiedTopology:true,  useNewUrlParser: true });
    Words.create([data], function(err){
        mongoose.disconnect()
    })
}


chaincrud.prototype.createSync = function(data){
    return new Promise(async (resolve, reject) =>{
        try{
            await mongoose.connect(url, {useUnifiedTopology:true,  useNewUrlParser: true });
             result = await Words.create([data])
             resolve(result)
             mongoose.disconnect()
             
        }
        catch(error)
        {
            console.error("An error has occured")
            reject(error)
        }
    })

}


chaincrud.prototype.getAll =  function(){
    
    var result = [];
    mongoose.connect(url, {useUnifiedTopology:true,  useNewUrlParser: true });
    var query = Words.find()
     result =  query.exec( function(err, docs){
    mongoose.disconnect()
    console.log("Proceeding to return ")
    
    return docs;
    })
    console.log("Proceeding to final return ")
  return result  
}

chaincrud.prototype.getAllAsync =  function(){
    return new Promise(async (resolve, reject) =>{

        try{
            await mongoose.connect(url, {useUnifiedTopology:true,  useNewUrlParser: true });
            var query = Words.find()
            result = await query.exec()
            
            resolve(result);
        
            mongoose.disconnect();
        }

        catch(error){
            console.log("An error has occured.")
            reject(error)
        }
    });
    
}


chaincrud.prototype.getParticularAll = function(data){
    //this finds and returns all documents which meet up with a particular criteria, 
    //i.e if there are more than one records, which meets up, it returns all the records.
    mongoose.connect(url, {useUnifiedTopology:true,  useNewUrlParser: true });
    var query = Words.find().where('name', data)
    query.exec(function(err, docs){
    return docs
})
}

chaincrud.prototype.getParticularFirst = function(data){
    //this finds and returns the first record which meets up with the selection criteria,
    //i.e regardless of whether other records meet up with the criteria, it will on return the first record which meets up the criteria
    mongoose.connect(url, {useUnifiedTopology:true,  useNewUrlParser: true });
    var query = Words.find().where('matricNo', data)
    query.exec(function(err, docs){
    return docs
})
}

chaincrud.prototype.getParticularFirstSync = function(data){
    return new Promise(async (resolve, reject)=>{
       try{
        await mongoose.connect(url, {useUnifiedTopology:true,  useNewUrlParser: true });
        var query = await Words.find().where('matricNo', data).exec()
        resolve(query)
        mongoose.disconnect()
       }
       catch(error){
           console.log("An error has occured")
           reject(error)
       } 
    })
}

chaincrud.prototype.updateOne = function(candidate, data){
    mongoose.connect(url, {useUnifiedTopology:true,  useNewUrlParser: true });
    var query = Words.findOne().where('matricNo', candidate)
    query.exec(function(err, docs){
    query.updateOne({$set:{fullName:data.fullName, age: data.age, matricNo:data.matricNo}})
    //query.updateOne({$set:{name:'MICHAEL, Phelps Olivia', age: 12, gender: 'M'}}, $push:{arrayName: newValue}) 
    //the commented query above shows how you can update multiple fields of a records including how to update an array
    query.exec(function(err, docs){
        return docs
    })
})

}


chaincrud.prototype.updateOneSync = function(previousChainId, chainData){

    //previousChainId is the _id value of the last chain which is not to be retrieved.

    return new Promise(async (resolve, reject)=>{

        try{
            await mongoose.connect(url, {useUnifiedTopology:true,  useNewUrlParser: true });
            var query = await Words.findOne().where('_id', previousChainId).exec()
            
            if(query != null){
            result = await query.updateOne({$set:{chain:chainData.chain}}).exec()
            resolve(result)
            mongoose.disconnect()
            }
            else 
            console.log("Operation failed due to null id");
        }

        catch(error){
            console.log("An error has occured.")
            reject(error)
        }
    })
}


chaincrud.prototype.deleteOne = function(data){
    //this finds one record which matches the data and returns the no of
    //records removed.
    mongoose.connect(url, {useUnifiedTopology:true,  useNewUrlParser: true });
    var query = Words.findOne().where('matricNo', data)
    query.exec(function(err, docs){
    query.deleteOne(function(err, docs){
        mongoose.disconnect()
    })  
})
}

chaincrud.prototype.deleteOneAsync = function(data){
    return new Promise(async(resolve ,reject) =>{
         await mongoose.connect(url, {useUnifiedTopology:true,  useNewUrlParser: true });      
         var query = await Words.findOne().where('matricNo', data).exec()
         
         result = await query.deleteOne()
       
         resolve(result)
         mongoose.disconnect()
    })
}

module.exports = chaincrud;