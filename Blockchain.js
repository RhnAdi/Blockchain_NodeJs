const crypto = require('crypto');
const http = require('http');
const sortObject = require('./sortObject');
const timestamp = require('time-stamp');

class Blockchain {
   // Target Kesulitan
   difficulty_target = '0000';

   // Berisi kumpulan block
   chain = [];
   // Berisi transaksi terbaru yang siap dimasukan ke blok
   current_transactions = [];

   nodes = new Set();

   update_chain = false;

   last_block = this.chain.length + 1;

   constructor () {
      const genesis_hash = this.hash_block('genesis_block');
      this.append_block(
         genesis_hash,
         this.proof_of_work(0, genesis_hash, [])
      )
   }
   // Method untuk menambah node
   add_node(address){
      // const urlparser = new URL(address);
      const netloc = address.split('/')[2];
      this.nodes.add(netloc);
      console.log(this.nodes)
   }

   valid_chain(chain){
      let last_block = chain[0];
      let current_index = 1;

      while(current_index < chain.length){
         const block = chain[current_index];
         if(block.hash_of_previus_block !== this.hash_block(last_block)){
            return false
         }
         if(!this.valid_proof(current_index, block.hash_of_previus_block, block.transaction, block.nonce)){
            return false;
         }
         last_block = block;
         current_index += 1;
      }
      return true;
   }

   async update_blockchain(){
      const neighbours = Array.from(this.nodes);
      let max_length = this.chain.length;
      await neighbours.map((node) => {
         const uri = `http://${node}/blockchain`;
         http.get(uri, (response) => {
            if(response.statusCode === 200){
               response.on('data', data => {
                  let new_chain;
                  const Data = JSON.parse(data.toString());
                  const length = Data.length;
                  const chain = Data.chain;
                  const con1 = length > max_length;
                  const con2 = this.valid_chain(chain);
                  if(con1 == con2){
                     max_length = length;
                     new_chain = chain;
                  }

                  if(new_chain){
                     this.chain = new_chain;
                     this.update_chain = true;
                     return true;
                  }
               })
            }
         })
      })
      return this.update_chain;
   }


   // Method untuk hash block
   hash_block (block) {
      const data = sortObject(block);
      const block_encoded = JSON.stringify(data) 
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

   // Method Append Block (Menambahkan blok)
   append_block(hash_of_previus_block, nonce){
      const block = {
         'index': this.chain.length,
         'timestamp': timestamp(),
         'transaction': this.current_transactions,
         'nonce': nonce,
         'hash_of_previus_block': hash_of_previus_block,
      }
      this.current_transactions = []
      this.chain.push(sortObject(block))
      return sortObject(block);
   }

   // Method aadd transactions (Menambahka transaction)
   add_transcation(sender, recipient, amount){
      this.current_transactions.push({
         'amount': amount,
         'recipient': recipient,
         'sender': sender
      })
      return this.chain.length + 1;
   }
}

module.exports = Blockchain;