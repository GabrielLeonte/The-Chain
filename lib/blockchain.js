import { mkdirSync, existsSync } from "fs";
import hash from "md5";
import sqlite3 from "sqlite3";
import { dirname } from "path";

class Blockchain {
  constructor(path, port, blockTime) {
    this.path = path || "./chain/chain.database"; // blockchain database path or default path
    this.port = port || 4444; // the default port or port value
    this.blockTime = blockTime || 60000; // 1 minute blocktime in ms
    this.data = [];
    this.previousHash = hash(this.data);
    this.block = {
      hash: this.previousHash,
      timestamp: new Date().getTime(),
      header: []
    };
    this.init();
  }

  init() {
    // make sure that the path its a string
    if (!this.path == String(this.path)) throw new Error("The path is invalid!");

    // create the dir for the database if the database does not exists
    if (!existsSync(dirname(this.path))) mkdirSync(dirname(this.path));

    // open the database that contains blocks
    this.chain = new sqlite3.Database(this.path);

    // setup a new database
    this.chain.serialize(() => {
      // create blocks table if that table does not exists
      this.chain.run("CREATE TABLE IF NOT EXISTS blocks (block INTEGER PRIMARY KEY, hash TEXT, timestamp TEXT, header TEXT)", err => {
        if (err) throw new Error("Cannot create blocks table " + err);
      });

      // check if the genesis block does not exists and create it
      this.chain.get(`SELECT * FROM blocks WHERE block = 1`, (err, data) => {
        if (err) throw new Error("Cannot get the genesis block from the blockchain " + err);
        if (!data)
          this.chain.run(
            `INSERT INTO blocks (hash, timestamp, header) VALUES ("${this.block.hash}","${this.block.timestamp}", "${this.block.header}")`,
            err => {
              if (err) throw new Error("Cannot insert the genesis block into the blockchain " + err);
            }
          );
      });
    });
  }

  getLastBlock() {
    return new Promise((resolve, reject) => {
      this.chain.get("SELECT * FROM blocks ORDER BY block DESC", (err, data) => {
        if (err) {
          reject(err);
          throw new Error("Cannot get the latest block " + err);
        }
        if (data != undefined) {
          resolve(data);
        } else {
          reject("Cannot call getLastBlock promise on a *cold start*");
        }
      });
    });
  }

  getBlock(id) {
    return new Promise((resolve, reject) => {
      if (id !== Number(id)) {
        reject("Block height has to be a number!");
      } else {
        this.chain.get("SELECT * FROM blocks ORDER BY block DESC WHERE WHERE ", (err, data) => {
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
    this.data.push({ data: data, timestamp: new Date().getTime() });
  }

  getData() {
    return this.data;
  }
}

export default Blockchain;
