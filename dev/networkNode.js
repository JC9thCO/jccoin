const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
//const uuid = require('uuid/v1');

// unique ID for this node
const { v1: uuid } = require('uuid');
const nodeAddress = uuid().split('-').join(''); 
//const nodeAddress = "KJHOFIHEOIFOEIWJFOIWJOEWIJOFIJWOEIFJIOWEJ"; 

// get the port supplied in starting up the scripts as a node
const port = process.argv[2];

// get the request library
const rp = require('request-promise');
const { all } = require('express/lib/application');
const { Tunnel } = require('request/lib/tunnel');


const jccoin = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function(req, res){
    //res.render('index.html');
    res.send("This is /")
});

app.get('/blockchain', function(req, res) {
    //res.send('Hello baby')
    res.send(jccoin);
});


app.post('/transaction', function(req, res) {
    //const blockIndex = jccoin.createNewTransaction( req.body.amount, req.body.sender, req.body.recipient);

    // get the request, as this is being broadcast to all nodes
    const newTransaction = req.body;

    // add transaction to pending array on this node
    const blockIndex = jccoin.addTransactionToPendingTransactions(newTransaction);

    res.json({ note: 'Transaction to be added in block ' + blockIndex});
});


app.post('/transaction/broadcast', function(req, res) {
    // create a new transaaction
    const newTransaction = jccoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    
    // add to pending transactions on this node
    jccoin.addTransactionToPendingTransactions(newTransaction);

    // need to broadcast to all nodes in network
    const requestPromises = [];
    jccoin.networkNodes.forEach(networkNodeURL => {
        const requestOptions = {
            uri: networkNodeURL + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };

        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
    .then(data => {
        res.json({ note: 'Transaction created & broadcasted. Ok??'});
    });
});

app.get('/mine', function(req, res) {
    //retrieve the last block from the chain
    const lastBlock = jccoin.getLastBlock();
    // get its hash
    const previousBlockHash = lastBlock['hash'];

    // make block from pending transactions
    const currentBlockData = {
        transactions: jccoin.pendingTransactions,
        index: lastBlock['index'] + 1
    }

    // mine for the nonce (this is the Proof of Work)
    const nonce = jccoin.proofOfWork(previousBlockHash, currentBlockData)

    // make the hash
    const blockHash = jccoin.hashBlock(previousBlockHash, currentBlockData, nonce);

    // make the new block
    const newBlock = jccoin.createNewBlock(nonce, previousBlockHash, blockHash);

    // empty array to hold the block data to send to all nodes
    const requestPromises = [];
    // send the new block to all nodes
    jccoin.networkNodes.forEach(networkNodeURL => {
        // create the body of the request containing the block, hitting the receive endpoint
        const requestOptions = {
            uri: networkNodeURL + '/receive-new-block',
            method: 'POST',
            body: {newBlock: newBlock},
            json: true
        };
        // add to the array
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
    .then(data => {
        // this node gets a reward. Send the reward transaction to all nodes
        // best practice dictates to place reward into next block (via pending transactions)
        const requestOptions = {
            uri: jccoin.currentNodeURL + '/transaction/broadcast',
            method: 'POST',
            body: {
                amount: 5,
                sender: "00",
                recipient: nodeAddress
            },
            json: true
        };

        return rp(requestOptions);
    })
    .then(data => {
        res.json({
            note: "New block mined and broadcasted, dude.",
            block: newBlock
        });
    });
});


app.post('/receive-new-block', function(req, res) {
    const newBlock = req.body.newBlock;

    // need to check new block for legitimacy by confirming it indicates the correct previous block and has the right index
    const lastBlock = jccoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

    if (correctHash && correctIndex) {
        // new block is legit, push it
        jccoin.chain.push(newBlock);
        // clear the pending transactions
        jccoin.pendingTransactions = [];

        res.json({
            note: 'New block received and minted, homie.',
            newBlock: newBlock
        });
    } else {
        // It's not legit!
        
        res.json({
            note: 'New block rejected - take a hike!',
            newBlock: newBlock
        });
    }
});

// register new node, broadcast it
app.post('/register-and-broadcast-node', function(req, res) {
    // get the new node URL from the request body
    const newNodeURL = req.body.newNodeURL;
    
    // add to the array object in the jccoin if this is actually a new node
    if(jccoin.networkNodes.indexOf(newNodeURL)==-1) jccoin.networkNodes.push(newNodeURL);
    
    //create empty array
    const regNodesPromises = [];

    // build out options for all nodes
    jccoin.networkNodes.forEach(networkNodeURL => {
        const requestOptions = {
            uri: networkNodeURL + '/register-node',
            method: 'POST',
            body: { newNodeURL: newNodeURL },
            json: true
        };

        // add to the array
        regNodesPromises.push(rp(requestOptions));
    })
    
    Promise.all(regNodesPromises)
    .then(data =>{
        // register all nodes with the new node
        // ... is a spread operator, breaking out all array items
        const bulkRegisterOptions = {
            uri: newNodeURL + '/register-nodes-bulk',
            method: 'POST',
            body: {allNetworkNodes: [...jccoin.networkNodes, jccoin.currentNodeURL] },
            json: true
        };

        // run the request
        return rp(bulkRegisterOptions);
    })

    // once above is completed
    .then(data => {
        // send response back
        res.json({ note: 'New node registered w. network, honey!' });
    });
});

// register new node with network
app.post('/register-node', function(req, res) {
    const newNodeURL = req.body.newNodeURL;
    
    // make sure it's not already in the array
    const nodeNotAlreadyPresent = jccoin.networkNodes.indexOf(newNodeURL)==-1;

    // make sure it's not self-referencing
    const notCurrentNode = jccoin.currentNodeURL !== newNodeURL;

    // add to the array
    if(nodeNotAlreadyPresent && notCurrentNode) jccoin.networkNodes.push(newNodeURL);

    res.json({ note: 'New node registered w. node, sweetie-pie!' });
});

// register multiple nodes at once
// this endpoint is only ever hit on a new node being added to network
app.post('/register-nodes-bulk', function(req, res) {
    const allNetworkNodes = req.body.allNetworkNodes;

    // put all the node URLs in the networkNodes array
    allNetworkNodes.forEach(networkNodeURL => {
        // make sure it's not already in the array
        const nodeNotAlreadyPresent = jccoin.networkNodes.indexOf(networkNodeURL)==-1;

         // make sure it's not self-referencing
        const notCurrentNode = jccoin.currentNodeURL !== networkNodeURL;

        if (nodeNotAlreadyPresent && notCurrentNode) jccoin.networkNodes.push(networkNodeURL);
    });

    res.json({ note: 'Bulk registration worked, honey-buns!' });
});


// consensus end point
app.get('/consensus', function(req, res) {
    // need to get blockchain from all nodes in network
    const requestPromises = [];
    jccoin.networkNodes.forEach(networkNodeURL => {
        const requestOptions = {
            uri: networkNodeURL + '/blockchain',
            method: 'GET',
            json: true
        };

        requestPromises.push(rp(requestOptions));
    });

    // get the blockchain from each node, which will now be an array of all blockhains on all nodes
    Promise.all(requestPromises)
    .then(blockchains => {
        const currentChainLength = jccoin.chain.length;
        let maxChainLength = currentChainLength; // for now
        let newLongestChain = null;
        let newPendingTransactions = null;

        blockchains.forEach(blockchain => {
            
        });
        
        res.json({ note: 'Transaction created & broadcasted. Ok??'});
    });
});



app.listen(port, function() {
    console.log('Listening baby, on port ' + port);
});