# Node.js Fundamentals

## What is Node.js?
Node.js is a Javascript runtime environment. It uses Google's V8 Javascript engine. This is not a Javascript that is ran in the browser but outside. It can build servers, calls APIs, work with command line tools, and scripts. It works with files, directories, operating systems and more.


## How does Node.js differ from running JavaScript in the browser?
It differs because it can interact files and directories on the user's computer. This means that it can read/delete/update files. Javascript running in the browser has access to browser APIs, such as the DOM, while Node.js runs Javascript outside the browser and provides APIs for things like files, directories, networking, and the operating system.Node.js doesn't give every program unrestricted access to every file. Access is subject to the operating system's permissions.

## What is the V8 engine, and how does Node use it?
V8 is Google's Javascript engine. It executes JavaScript code by converting it into machine code that the computer can run. Node.js uses V8 as its Javascript engine and adds APIs that allow Javascript to interact with things outside the browser, such as files, networking, and the operating system.

## What are some key use cases for Node.js?
Some key use cases are reading and writing files, creating scripts and command line tools, building web servers and APIs, connecting to databases, and building backend applications.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**
```js
userController.js
function logOn() {
  console.log("Logging on user");
}

module.exports = {logOn };

app.js
const { logOn } = require('./userController');

logOn();
```

CommonJS improts code with using syntax require(). Inside the require() tells Node where to look for the file or module. In order to export it needs module.exports to make the function availble. 


**ES Modules (supported in modern Node.js):**
```js
// userController.js
export function logoff() {
  console.log("Logging off user");
}

import { logoff } from './userController.js';

logoff();
``` 
ES Modules use import to bring the code into a file and export to make code available to other files. ES Modules are used by browsers and modern JavaScript tools, including React projects.
