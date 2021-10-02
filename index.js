const express = require('express');
const uuid = require('uuid');
const Blockchain = require('./Blockchain');
const app = express();
const port = process.argv[2];

// for parsing application/json
app.use(express.json()) 
 


// Initialization
const myBlockchain = new Blockchain();

// Node Identifier for User
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
   const last_block_hash = myBlockchain.hash_block(myBlockchain.chain[myBlockchain.chain.length - 1]);
   const index = myBlockchain.chain.length;
   const nonce = myBlockchain.proof_of_work(index, last_block_hash, myBlockchain.current_transactions);
   const block = myBlockchain.append_block(last_block_hash, nonce);
   res.status(200).json({
      message: "New block is added successfully (Mined).",
      index: block.index,
      hash_of_previus_block: block.hash_of_previus_block,
      nonce: block.nonce,
      transaction: block.transaction,
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

app.post('/nodes/add_node', (req, res) => {
   const { nodes } = req.body;

   nodes.map(node => myBlockchain.add_node(node));
   res.status(201).json({message: "Node added successfully.", nodes: Array.from(myBlockchain.nodes)})
})

app.get('/nodes/sync', async(req, res) => {
   const updated = await myBlockchain.update_blockchain();
   if(updated){
      res.status(200).json({message: "Blockchain has updated to latest data.", blockchain: myBlockchain.chain});
   } else {
      res.status(200).json({message: "Blockchain is latest data.", blockchain: myBlockchain.chain});
   }
})

app.listen(port, () => {
   console.log(`Example app listening at http://localhost:${port}`)
})