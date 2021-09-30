const express = require('express');
const crypto = require('crypto');
const timestamp = require('time-stamp');
const uuid = require('uuid');
const app = express();
const port = 3000;

app.use(express.json()) // for parsing application/json

class Blockchain {
   // Target Kesulitan
   difficulty_target = '0000';

   chain = [];
   current_transactions = [];
   last_block = this.chain.length + 1;

   constructor () {
      const genesis_hash = this.hash_block('genesis_block');
      this.append_block(
         genesis_hash,
         this.proof_of_work(0, genesis_hash, [])
      )
   }

   // Method untuk hash block
   hash_block (block) {
      const block_encoded = JSON.stringify(block)
      return crypto.createHash('sha256').update(block_encoded).digest('hex');
   }

   // Method Proof-Of-Work
   proof_of_work (index, hash_of_previus_block, transactions, nonce){
      nonce = 0;
      while(this.valid_proof(index, hash_of_previus_block, transactions, nonce) === false){
         nonce ++;
      }
      this.valid_proof(index, hash_of_previus_block, transactions, nonce)
      return nonce;

   }

   // Method Valid Proof
   valid_proof (index, hash_of_previus_block, transactions, nonce){
      const content = encodeURI(`${index}${hash_of_previus_block}${transactions}${nonce}`);
      const content_hash = crypto.createHash('sha256').update(content).digest('hex');
      return content_hash.slice(0, 4) === this.difficulty_target;
   }

   append_block(hash_of_previus_block, nonce){
      const block = {
         'index': this.chain.length,
         'timestamp': timestamp(),
         'transaction': this.current_transactions,
         'nonce': nonce,
         'hash_of_previus_block': hash_of_previus_block,
      }
      this.current_transactions = []
      this.chain.push(block)
      return block;
   }

   add_transcation(sender, recipient, amount){
      this.current_transactions.push({
         'amount': amount,
         'recipient': recipient,
         'sender': sender
      })
      return this.chain.length + 1;
   }
}

const myBlockchain = new Blockchain();

const node_identifier = uuid.v4().replace('-', '');

app.get('/blockchain', (req, res) => {
   res.json({
      chain: myBlockchain.chain,
      length: myBlockchain.chain.length,
   }).status(200)
})

app.get('/mine', (req, res) => {
   const sender = '0';
   const amount = '1';
   myBlockchain.add_transcation(sender, node_identifier, amount);
   const last_block_hash = myBlockchain.hash_block(myBlockchain.chain.length - 1);
   const index = myBlockchain.chain.length;
   const nonce = myBlockchain.proof_of_work(index, last_block_hash, myBlockchain.current_transactions);
   const block = myBlockchain.append_block(last_block_hash, nonce);
   res.status(400).json({
      message: "New block is added successfully (Mined).",
      index: block.index,
      hash_of_previus_block: block.hash_of_previus_block,
      nonce: block.nonce,
      transaction: block.transaction
   })
})

app.post('/transactions/new', (req, res) => {
   const { sender, recipient, amount } = req.body;

   // Validation
   !sender && res.json({message: 'Missing field.'}).status(400);
   !recipient && res.json({message: 'Missing field.'}).status(400);
   !amount && res.json({message: 'Missing field.'}).status(400);

   const index = myBlockchain.add_transcation(sender, recipient, amount);
   res.status(201).json({message: `Transaction will be added in block ${index}`});
})

app.listen(port, () => {
   console.log(`Example app listening at http://localhost:${port}`)
})