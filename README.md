
# The Chain -  A simple way to integrate a blockchain in your awesome application!

[![DeepScan grade](https://deepscan.io/api/teams/5144/projects/8527/branches/103349/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5144&pid=8527&bid=103349)
![](https://i.imgur.com/3ISskKH.png)


# Features

 - Easy to integrate to existing apps
 - A very customizable chain
 - Custom block time
 - Block verify function
 - Local database

# Incoming Features!

  - Node system - this will let you sync the chain between multiple nodes
  - Multiple extract data features
  - Block confirmation system
  - SocketIO API
  - Documentation


### Tech

The chain uses a number of open source projects to work properly:

* [ExpressJS](expressjs.com) -A Web API for a simple life!
* [Progress](https://www.npmjs.com/package/progress) - Flexible ascii progress bar
* [Better SQLite3](https://www.npmjs.com/package/better-sqlite3) - The fastest SQLite3 library to store your precious blocks
* [MD5](https://www.npmjs.com/package/md5) - A small friend that help you to hash so much hashes
* [Helmet](https://www.npmjs.com/package/helmet) - The best way to secure your blockchain WEB API
* [CORS](https://www.npmjs.com/package/cors) - Only here to help you with data
* [Body Parser](https://www.npmjs.com/package/body-parser) - CORS best friend


And of course The Chain itself is open source with a [public repository](https://github.com/GabrielLeonte/The-Chain)
 on GitHub.

### Installation

The Chain requires [Node.js](https://nodejs.org/) v10 (only tested) to run. 

Install The Chain...
```sh
$ npm install thechain --save
```

A simple demo

```js
const Chain = require("thechain");
const blockchain = new Chain(path, port, blockTime); // or new Chain() for a fast blockchain

const block_one = blockchain.getBlock(1);
console.log(block_one); // this will print the genesis block
```

Default params:

```js
const path = "./chain/chain.db3";
const port = 4444;
const blocktime =  60000; // 1 minute blocktime in ms
```
# Methods


### Verify the Chain 
```js
blockchain.verifyChain(); // No return
```
This method will be initially called to check every block, you can use it whenever you want, but warning, this method will stop your script until every block is checked.

### Create new Block (WARNING! Better to set a block time and never use this method!)
```js
blockchain.createNewBlock(); // No return
```
This method will create a new block when it is called, the block data will be the data contained in the data object at the block time.

### Data push
```js
const Object = ["test1", "test2"];
blockchain.push(Object); // No return
```

### Get last 100 blocks
```js
const last100blocks = blockchain.getLast100();
console.log(last100blocks); // This will print the last 100 blocks
```
This method will push data into the block, and the block will be generated with the pushed data.

### Get x block
```js
const blockNumber = 2; // Block number id
const block = blockchain.getBlock(blockNumber);
console.log(block); // This will print the block data
```

### Development
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/GabrielLeonte/Glaciary.JS/pulls)

Want to contribute? Great! Start by telling us your wishes!


### License

The chain is [MIT](https://github.com/GabrielLeonte/The-Chain/blob/master/LICENSE)

**Free Blockchain Software, DAM Yeah!**

 
