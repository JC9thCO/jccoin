// get the hash library
const sha256 = require('sha256');

const { v1: uuid } = require('uuid');

// get this node's URL
const currentNodeURL = process.argv[3];

function Blockchain() {
    // construct the empty arrays
    this.chain = [];
    this.pendingTransactions = [];

    this.currentNodeURL = currentNodeURL;
    this.networkNodes = [];

    // create genesis block with arbitrary values
    this.createNewBlock(100, '0', '0');
}

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
    // add a new block to the chain
    const newBlock = {
        // add 1 to the latest index    
        index: this.chain.length + 1,
        timestamp: Date.now(),
        
        // get whatever transactions are in the pending array
        transactions: this.pendingTransactions,
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash
    };
    
    // clear the pending transactions now that they'll be saved to a block
    this.pendingTransactions = [];
    // push it into the blockchain
    this.chain.push(newBlock);
    
    return newBlock;
}

Blockchain.prototype.getLastBlock = function() {
    return this.chain[this.chain.length - 1];
}

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
    // new Object
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuid().split('-').join('') 
    };
    
    return  newTransaction;
}

Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj) {
    // add to pending transactions
    this.pendingTransactions.push(transactionObj);
    
    // number of block this will be added to 
    return this.getLastBlock()['index'] + 1;
};

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce) {
    // convert all parameters into a single string
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    
    return hash;
}

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData) {
    let nonce = 0;
    // get the first hash
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

    // get hashes until the hash starts with 0000
    while (hash.substring(0, 4) !== '0000') {
        // increment indefinitely until we get the right nonce (lots of calculations & energy)
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }

    return nonce;
}

Blockchain.prototype.chainIsValid = function(blockchain) {
    // set the flag to be true by default
    let validChain = true;

    // iterate through all blocks and ensure previous hash and data is correct
    // start at 1 to skip genesis block
    for(var i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i - 1];
        
        // get a hash of this current block
        const blockHash = this.hashBlock(prevBlock['hash'], {transactions: currentBlock['transactions'], index: currentBlock['index']}, currentBlock['nonce']);

        // check if hash starts with our key (0000)
        if(blockHash.substring(0, 4) !== '0000') validChain = false;

        // check if the previous hash and node hash are the same
        if(currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false;
    };
    //return validChain;
    // check our genesis block for valid details
    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 100;
    const correctPrevBlockHash = genesisBlock['previousBlockHash'] === "0";
    const correctHash = genesisBlock['hash'] === "0";
    const correctTransactions = genesisBlock['transactions'].length === 0;

    if(!correctNonce || !correctPrevBlockHash || !correctHash || !correctTransactions) validChain = false;

    return validChain;
    //return correctPrevBlockHash;
};

module.exports = Blockchain;