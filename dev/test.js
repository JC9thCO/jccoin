const Blockchain = require('./blockchain');
const bitcoin = new Blockchain();

//console.log(bitcoin);

/*
const previousBlockHash = 'test1229034089470';
const currentBlockData = [
    {
        amount: 11,
        sender: 'joe239820398',
        recipient: 'sally3827498729'
    },
    {
        amount: 32,
        sender: 'fred239820398',
        recipient: 'sally3827498729'
    },
    {
        amount: 34,
        sender: 'greg239820398',
        recipient: 'sara3827498r729'
    },
];

bitcoin.createNewBlock(1231, 'n342k3jn4k2j3n4k', 'nelkwj38r2j2lk3');
bitcoin.createNewTransaction(100, 'justin20139u13n', 'lisa2190831j2i');

bitcoin.createNewBlock(231213, 'block2lasdjkalkdj', 'lijhfdod');

bitcoin.createNewTransaction(54, 'jude20139u13n', 'julian2190831j2i');
bitcoin.createNewTransaction(43535, 'joen0139u13n', 'grgrg2190831j2i');
bitcoin.createNewTransaction(3423421, 'sam20139u13n', 'red2190831j2i');

bitcoin.createNewBlock(322, 'block3lasdjkalkdj', 'dfsdlijhfdod');
*/

//;


//console.log(bitcoin.proofOfWork(previousBlockHash, currentBlockData));
//nonce = 4427;
//console.log(bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce));

const jc1 = {
    "chain": [
    {
    "index": 1,
    "timestamp": 1643828873289,
    "transactions": [],
    "nonce": 100,
    "hash": "0",
    "previousBlockHash": "0"
    },
    {
    "index": 2,
    "timestamp": 1643828879300,
    "transactions": [],
    "nonce": 18140,
    "hash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100",
    "previousBlockHash": "0"
    },
    {
    "index": 3,
    "timestamp": 1643828879892,
    "transactions": [
    {
    "amount": 5,
    "sender": "00",
    "recipient": "6c0dd920845b11ec927859793a2a42f3",
    "transactionId": "6fbd2580845b11ec927859793a2a42f3"
    }
    ],
    "nonce": 102860,
    "hash": "0000c8390b169f886c052bfc8931c4da9eef7e7cc7501b509a7a43ffd9345f86",
    "previousBlockHash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100"
    },
    {
    "index": 4,
    "timestamp": 1643828880443,
    "transactions": [
    {
    "amount": 5,
    "sender": "00",
    "recipient": "6c0dd920845b11ec927859793a2a42f3",
    "transactionId": "7015a5c0845b11ec927859793a2a42f3"
    }
    ],
    "nonce": 42354,
    "hash": "000084b689dfb92b749c252aa407a224cba2cd8a66efec022bd2ef60be2eae68",
    "previousBlockHash": "0000c8390b169f886c052bfc8931c4da9eef7e7cc7501b509a7a43ffd9345f86"
    }
    ],
    "pendingTransactions": [
    {
    "amount": 5,
    "sender": "00",
    "recipient": "6c0dd920845b11ec927859793a2a42f3",
    "transactionId": "7068ced0845b11ec927859793a2a42f3"
    }
    ],
    "currentNodeURL": "http://localhost:3001",
    "networkNodes": []
    }

    console.log('VALID: ',  bitcoin.chainIsValid(jc1.chain));