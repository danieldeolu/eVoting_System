let newStart = process.hrtime();
let newEnd = process.hrtime(newStart);

//console.info("Execution time %dms", hrstart);

console.log("Start time: ", newStart);
let a = 0;

for(a=0; a<=100;a++){
    if(a==10)console.log(a);
}

//console.info("Execution time (hr): %d %dms", hrend[0], hrend[1])


const timeInMs = (newEnd[0]*1000000000 + newEnd[1]) / 1000000;

console.log("Time in ms", timeInMs);

//console.log("End time: ", newEnd)


let newStart = process.hrtime();
let newEnd = process.hrtime(newStart);

console.log("Start time: ", newStart);

const timeInMs = (newEnd[0]*1000000000 + newEnd[1]) / 1000000; //we first convert the time to seconds then to milliseconds

console.log("Time in ms", timeInMs);

