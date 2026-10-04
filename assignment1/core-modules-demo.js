const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
const systemInfo = {
  Platform: os.platform(),
  CPU: os.cpus(),
  'Total Memory': os.totalmem(),
};
console.log('System Information:', systemInfo);
console.log('Platform:', systemInfo.Platform);
console.log('CPU:', systemInfo.CPU);
console.log('Total Memory:', systemInfo['Total Memory']);

// Path module
const joinedPath = path.join(__dirname, 'sample-files', 'demo.txt');
console.log('Joined path:', joinedPath);


// fs.promises API
const fsPromises = require("fs/promises");

async function PromisesAPI(){
  try {
    await fsPromises.writeFile(joinedPath, "Hello from fs.promises!");
    const content = await fsPromises.readFile(joinedPath, "utf-8");

    console.log('fs.promises read: ', content);

    //Creating a loops to write file in largefile.txt

    let fileContent = "";

    for (let i = 1; i <= 100; i++) {
      fileContent += `This is a line in a large file ${i}\n`;
    }

    await fsPromises.writeFile(path.join(__dirname, 'sample-files', 'largefile.txt'), fileContent);
    
    
    // Streams for large files- log first 40 chars of each chunk

    const readStream = fs.createReadStream(path.join(__dirname, 'sample-files', 'largefile.txt'), {
      encoding: "utf-8",
      highWaterMark: 1024,
    });

    readStream.on("data", (chunk) => {
      console.log ("Read chunk:", chunk.length, "First 40 chars:", chunk.slice(0, 40));
    });

    readStream.on("end", () => {
      console.log("Finished reading large file with streams.");
    });

    readStream.on("error", (err) => {
      console.log("Error reading file:", err.message);
    });


  } catch (err) {
    console.log("File operation failed:", err);
  }
}
PromisesAPI();



