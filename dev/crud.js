var MongoClient = require('mongodb').MongoClient;
//const { MongoClient, ObjectID } = require('mongodb');
//var url = 'mongodb://localhost:27017';
//var url = 'mongodb+srv://admin:admin123@daniel-d1wwk.mongodb.net'

var url = 'mongodb+srv://admin:admin123@cluster0.uvv2t.mongodb.net' //newer one
var url2 = 'mongodb+srv://admin:admin123@cluster0.1ynwr.mongodb.net' //second node url

//const dbName = "evoting";
//const colName = "users";

let dbName = null;
let colName = null; 

function crud(dbname, colname){
  this.dbName = dbname;
  this.colName = colname;
}


crud.prototype.add = function (item) {
    return new Promise(async (resolve, reject) => {
      
      try {
        var client = new MongoClient(url, {useUnifiedTopology:true});
        await client.connect();
        const db = client.db(this.dbName);
        const col = db.collection(this.colName)
        const addedItem = await col.insertOne(item);

        resolve(1);
        client.close();        
      } catch (error) {
        reject(error);
      }
    });
  }

  crud.prototype.addMany = function(item){
    return new Promise(async (resolve, reject) => {
      
      try {
        var client = new MongoClient(url, {useUnifiedTopology:true});
        await client.connect();
        const db = client.db(this.dbName);
        const col = db.collection(this.colName)
        const addedItem = await col.insertMany(item)
        resolve(1);
        client.close();        
      } catch (error) {
        reject(error);
      }
    });
  }


  crud.prototype.check  = function(){
    //this function checks if a db already exists.
    //returns [] empty array if the collection does not exist
    //returns a filled array if the collection exists
    
    return new Promise(async (resolve, reject) => {
        try {
            var client = new MongoClient(url, {useUnifiedTopology:true});
            await client.connect();
            const db = client.db(this.dbName);
            const listOfCol = await db.listCollections();
            resolve(await listOfCol.toArray());
            client.close();        
          } catch (error) {
            reject(error);
          }
        });
}

  crud.prototype.update = function(id, newItem) {
    return new Promise(async (resolve, reject) => {
        
        try{

          var client = new MongoClient(url, {useUnifiedTopology:true});
          await client.connect();
          const db = client.db(this.dbName);
          const col = db.collection(this.colName);
          const updatedItem = await col.findOneAndReplace({id:id}, newItem, {returnOriginal:false});
          
          resolve(updatedItem.value);
          client.close();
        } catch (error) {
          reject(error);
        }
      });
  }

 crud.prototype.get = function(){
    return new Promise(async (resolve, reject) => {

        try{
            var client = new MongoClient(url, {useUnifiedTopology:true});
            await client.connect();
            var db = client.db(this.dbName);
            var col = db.collection(this.colName);
            var result = await col.find({})


            resolve(await result.toArray());
            client.close();
        }
    
        catch(error){
            console.log("An error has occured.")
            reject(error);
        }
    });
    
}
crud.prototype.getById = function(id){
    return new Promise(async (resolve, reject) => {
        var client = new MongoClient(url, {useUnifiedTopology:true});
        
        try {
          await client.connect();
          const db = client.db(this.dbName);
          const col = db.collection(this.colName);
          const item = await col.findOne({ "matricNo":id });
          await resolve(item);
          client.close();
        } catch (error) {
          reject(error);
        }
      });
}

crud.prototype.deleteData = function(id){
    return new Promise(async (resolve, reject) => {
        var client = new MongoClient(url, {useUnifiedTopology:true});

        try {
          await client.connect();
          const db = client.db(this.dbName);
          const col = db.collection(this.colName);
          const removed = await col.deleteOne({matricNo:id});
          console.log(removed.deletedCount)
          resolve(removed.deletedCount === 1);
          client.close();
        } catch (error) {
          reject(error);
        }
      });
    }


 


module.exports = crud;