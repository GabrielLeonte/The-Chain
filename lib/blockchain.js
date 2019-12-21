import { mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import express from "express";
import bodyparser from "body-parser";
import helmet from "helmet";
import cors from "cors";
import md5 from "md5";
import Bar from "progress";
import Database from "better-sqlite3";

class Blockchain {
  constructor(path, port, blockTime) {
    this.express = new express();
    this.path = path || "./chain/chain.db3"; // blockchain database path or default path
    this.port = port || 4444; // the default port or port value
    this.blockTime = blockTime || 60000; // 1 minute blocktime in ms
    this.nodeStatus = "unsynced"; // database status
    this.verify = true;
    this.generate = true; // enable block generating script
    this.jsAPI = false;
    this.data = []; // block data
    this.seeds = []; // seeds data
    this.seedStatus = []; // seeds status
    this.genesisBlock = []; // genesis block
    this.blockHeight = 0; // block height
    this.express.use(bodyparser.json());
    this.express.use(bodyparser.urlencoded({ extended: true }));
    this.express.use(helmet());
    this.express.use(cors());
    this.express.listen(this.port);
    this.init();
    this.load();
    this.expressapi();
  }

  async init() {
    // make sure that the path its a string
    if (this.path !== String(this.path)) throw new Error("The path is invalid!");

    // create the dir for the database if the database does not exists
    if (!existsSync(dirname(this.path))) mkdirSync(dirname(this.path));

    // open the database that contains blocks
    this.chain = new Database(this.path);

    // generating script
    setInterval(() => {
      if (this.generate) this.createNewBlock(); // create a new block if this.generate is active
    }, this.blockTime);
  }

  async load() {
    // create blocks table if the table does not exists
    try {
      this.chain.prepare("CREATE TABLE IF NOT EXISTS blocks (block INTEGER PRIMARY KEY,previousHash TEXT, hash TEXT, timestamp TEXT, header TEXT)").run();
    } catch (err) {
      throw new Error("Cannot create the blocks table: " + err);
    }

    // get the genesis block object or generate a new one
    try {
      this.genesisBlock = this.chain.prepare("SELECT * FROM blocks WHERE block = 1").get();
      if (!this.genesisBlock) this.createNewChain();
    } catch (err) {
      throw new Error("Cannot get the genesis block: " + err);
    }

    // get the blockHeight
    try {
      this.blockHeight = this.chain.prepare("SELECT block FROM blocks ORDER BY block DESC").get().block;
    } catch (err) {
      throw new Error("Cannot get the block height: " + err);
    }

    this.verifyChain();
  }

  async expressapi() {
    // api last 100 blocks http route
    this.express.get("/last100blocks", (req, res) => {
      let blocks = this.chain.prepare("SELECT * FROM blocks ORDER BY block DESC LIMIT 100").all();
      res.status(200).json(blocks);
    });

    // api get node status
    this.express.get("/getStatus", (req, res) => {
      res.json({ status: this.nodeStatus, genesisBlock: this.genesisBlock, blockHeight: this.blockHeight });
    });

    // get block
    this.express.get("/getBlock/:id", (req, res) => {
      let block = this.chain.prepare("SELECT * FROM blocks WHERE block = ? ").get(req.params.id);
      if (block) res.status(200).json(block);
      else res.status(404).json({ status: "error", message: "block not found" });
    });
  }

  async verifyChain() {
    let blocks = this.chain.prepare("SELECT COUNT(block) FROM blocks").get()["COUNT(block)"];
    var bar = new Bar("Verifying [:bar] :percent ETA: :etas", { total: blocks });
    let index1 = 1;
    let index2 = 2;

    // verify every block previous hash with the previous block hash
    for (index1; index1 < this.blockHeight; index1++) {
      try {
        let block1 = this.chain.prepare("SELECT * FROM blocks WHERE block = ?").get(index1);
        let block2 = this.chain.prepare("SELECT * FROM blocks WHERE block = ?").get(index2);

        if (block1.hash !== block2.previousHash)
          throw new Error(
            "The blockchain database is corrupted, error path: " +
              "block: " +
              block1.block +
              " --> hash: " +
              block1.hash +
              " !== " +
              "block" +
              block2.block +
              " --> previousHash: " +
              block2.previousHash
          );

        index2++;
        bar.tick();
      } catch (err) {
        throw new Error("verifyChain: " + err);
      }
    }

    // allow blocks to be generated again
    this.generate = true;
  }

  createNewBlock() {
    // declare block object data
    let previousHash = this.chain.prepare("SELECT hash FROM blocks ORDER BY block DESC").get().hash;
    let blockHeight = Math.floor(this.blockHeight + 1);

    // create a new block object
    let block = {
      hash: md5(this.data + new Date().getTime()),
      previousHash: previousHash,
      timestamp: new Date().getTime(),
      header: JSON.stringify(this.data)
    };

    // insert block into the database
    try {
      this.chain.prepare(`INSERT INTO blocks (hash, previousHash, timestamp, header) VALUES ("${block.hash}","${block.previousHash}","${block.timestamp}", ?)`).run(block.header);
      this.data = [];
      this.blockHeight += 1;
      console.log(`Incoming block #${blockHeight} generated successfully at ${new Date()}`);
    } catch (err) {
      throw new Error("Cannot create a new block: " + err);
    }
  }

  createNewChain() {
    let genesisBlock = this.chain.prepare("SELECT * FROM blocks WHERE block = 1").get();
    let block = {
      hash: md5(this.data),
      previousHash: md5(this.data),
      timestamp: new Date().getTime(),
      header: this.data
    };

    // avoid method abuse
    if (genesisBlock) return console.log("This method cannot be called if the chain exists");

    // print a beautifull welcome message
    console.log("//////////////////////////////////" + "\n//  The Chain - New blockchain  //" + "\n//          Welcome             //" + "\n//////////////////////////////////");

    // insert genesis block into the database
    try {
      this.chain.prepare(`INSERT INTO blocks (hash, previousHash, timestamp, header) VALUES ("${block.hash}", "${block.previousHash}", "${block.timestamp}"," ${block.header}")`).run();
      this.blockHeight = 1;
      this.generate = true;
      console.log(`Incoming block #${this.blockHeight} generated successfully at ${new Date()}`);
    } catch (err) {
      throw new Error("Cannot insert the genesis block into the database: " + err);
    }

    // get the new genesis block
    try {
      this.genesisBlock = this.chain.prepare("SELECT * FROM blocks WHERE block = 1").get();
    } catch (err) {
      throw new Error("Cannot get the new generated genesis block: " + err);
    }
  }

  getBlock(block) {
    if (block !== Number(block)) return "The block value is not a number!";
    try {
      return this.chain.prepare("SELECT * FROM blocks WHERE block = ? ").get(block);
    } catch (err) {
      throw new Error("Cannot get the block " + block + " :" + err);
    }
  }

  getLast100() {
    try {
      return this.chain.prepare("SELECT * FROM blocks ORDER BY block").get();
    } catch (err) {
      throw new Error("Error inside getLast100 method: " + err);
    }
  }

  push(data) {
    if (typeof data !== "object") return console.warn("The data pushed must be an object!");
    this.data.push(data);
  }
}

export default Blockchain;

/*
WIP


  sync() {
    // define initial sync module variables and constants
    let path = resolve(process.cwd(), "nodes.json");

    // read nodes.json file
    try {
      this.seeds = JSON.parse(readFileSync(path).toString());
    } catch (err) {
      this.nodeStatus = "synced";
      return console.log("Warning: The block chain can be affected in absence of " + path);
    }

    // get nodes status
    this.seeds.forEach(seed => {
      try {
        let data = JSON.parse(request("GET", seed + "/getStatus").body.toString());
        if (data.genesisBlock.hash === this.genesisBlock.hash) this.seedStatus.push({ seed: seed, blockHeight: data.blockHeight, status: data.status });
      } catch (err) {
        throw new Error("Seed " + seed + " cannot be reached: " + err);
      }
    });

    // sync with each synced node
    this.seedStatus.forEach(node => {
      if (this.blockHeight < node.blockHeight && node.status === "synced") {
        this.generate = false;
        console.log("Seed " + node.seed + " has +" + Math.floor(node.blockHeight - this.blockHeight) + " more blocks");
      }
    });
    console.log(this.seedStatus);
  }
  
    */
