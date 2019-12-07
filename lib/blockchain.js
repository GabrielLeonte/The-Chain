import { mkdirSync, existsSync } from "fs";
import md5 from "md5";
import Database from "better-sqlite3";
import { dirname } from "path";

class Blockchain {
  constructor(path, port, blockTime) {
    this.path = path || "./chain/chain.database"; // blockchain database path or default path
    this.port = port || 4444; // the default port or port value
    this.blockTime = blockTime || 60000; // 1 minute blocktime in ms
    this.data = [];
    this.previousHash = md5(this.data);
    this.block = {
      hash: md5(this.data),
      previousHash: this.previousHash,
      timestamp: new Date().getTime(),
      header: this.data
    };
    this.init();
  }

  init() {
    // make sure that the path its a string
    if (!this.path == String(this.path)) throw new Error("The path is invalid!");

    // create the dir for the database if the database does not exists
    if (!existsSync(dirname(this.path))) mkdirSync(dirname(this.path));

    // open the database that contains blocks
    this.chain = new Database(this.path);

    // create blocks table if the table does not exists
    try {
      this.chain.prepare("CREATE TABLE IF NOT EXISTS blocks (block INTEGER PRIMARY KEY,previousHash TEXT, hash TEXT, timestamp TEXT, header TEXT)").run();
    } catch (err) {
      throw new Error("Cannot create the blocks table: " + err);
    }

    // get genesis block
    try {
      this.genesisBlock = this.chain.prepare("SELECT * FROM blocks WHERE block = 1").get();
    } catch (err) {
      throw new Error("Cannot get the genesis block from the database: " + err);
    }

    // create genesis block
    if (!this.genesisBlock)
      try {
        this.chain
          .prepare(`INSERT INTO blocks (previousHash, hash, timestamp, header) VALUES ("${this.block.previousHash}","${this.block.hash}","${this.block.timestamp}", "${this.block.header}")`)
          .run();
      } catch (err) {
        throw new Error("Cannot insert the genesis block into the chain database: " + err);
      }
  }

  getLastBlock() {
    return this.chain.prepare("SELECT * FROM blocks ORDER BY block DESC").get();
  }

  getBlock(id) {
    return new Promise((resolve, reject) => {
      if (id !== Number(id)) {
        reject("Block height has to be a number!");
      } else {
        this.chain.get(`SELECT * FROM blocks ORDER BY block DESC WHERE WHERE id = ${id}`, (err, data) => {
          if (err) {
            reject(err);
            throw new Error("Cannot get the latest block " + err);
          } else {
            resolve(data);
          }
        });
      }
    });
  }

  add(data) {
    this.data.push({ data: data });
  }

  getData() {
    return this.data;
  }

  createNewBlock() {
    // declare block object data
    let previousHash = this.chain.prepare("SELECT hash FROM blocks ORDER BY block DESC").get().hash;
    let timestamp = new Date().getTime();
    let hash = md5(this.data + timestamp);
    let header = JSON.stringify(this.data);

    // create a new block object
    let block = {
      hash: hash,
      previousHash: previousHash,
      timestamp: timestamp,
      header: header
    };

    // insert block into the database
    try {
      this.chain.prepare(`INSERT INTO blocks (hash, previousHash, timestamp, header) VALUES ("${block.hash}","${block.previousHash}","${block.timestamp}", ?)`).run(block.header);
      this.data = [];
      //console.log(`Block # generated`);
    } catch (err) {
      throw new Error("Cannot create a new block: " + err);
    }
  }
}

export default Blockchain;
