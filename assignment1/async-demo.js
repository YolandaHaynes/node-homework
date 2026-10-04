const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, './sample-files', 'sample.txt');

// Write a sample file for demonstration

fs.writeFileSync(filePath, "Hello, async world!");

// 1. Callback style
fs.readFile(filePath, "utf8", (err, content) => {
  if(err){
    console.log("File read failed:", err.message);
  } else {
    console.log('callback',content);
  }
})

  // Callback hell example (test and leave it in comments):


  // 2. Promise style

function readTextFile(filePath){
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, content) =>{
      if (err){
        reject(err);
        return;
      }
      resolve(content);
    });
  });
}

readTextFile(filePath).then((content) => {
  console.log('promise', content);
}).catch((err) => {
  console.log("Promise error:", err.message);
});

      // 3. Async/Await style
async function run(){
  try{
    const content = await readTextFile(filePath);
      console.log('async await', content);
    } catch(err){
      console.log("An error occurred:" , err.message);
    }
}
run();