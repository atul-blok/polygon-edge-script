const Web3 = require("web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const interface = require("./abi.json");
const dotenv = require("dotenv");
dotenv.config();

const provider = new HDWalletProvider(
  process.env.PRIVATE_KEY,
  process.env.ENDPOINT
);

/* instance for action call */
const web3 = new Web3(provider);

const options2 = {
  clientConfig: {
    keepalive: true,
    keepaliveInterval: 600000,
    // maxReceivedFrameSize: 10000000000,
    // maxReceivedMessageSize: 10000000000,
  },
  reconnect: { auto: true, delay: 1000, maxAttempts: 10, onTimeout: true },
};

/* instance for event listen */
const newweb3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.SOCKET_ENDPOINT),
  options2
);

async function transaction() {
  try {
    const latest = await web3.eth.getBlockNumber();

    console.log("latest block:", latest);

    const options = {
      filter: {
        value: [],
      },
      fromBlock: latest,
    };

    console.log("Number of cards:", parseInt(process.argv[2]));

    if (!parseInt(process.argv[2])) {
      console.log("Number of cards not found!!!! \n");
      return;
    }

    const contractABI = interface;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const contractConnection = new web3.eth.Contract(
      contractABI,
      contractAddress
    );

    const contract = await new newweb3.eth.Contract(interface, contractAddress);

    const account = process.env.ACCOUNT;
    console.log("start Minting:", new Date());

    await contractConnection.methods
      .batchMint(account, parseInt(process.argv[2]))
      .send({
        from: account,
        gas: process.env.GAS_FEE,
      })
      .on("transactionHash", function (hash) {
        console.log(hash);
      })
      .on("confirmation", () => {
        console.log("Transaction confirmed", new Date());
      })
      .on("error", console.error);

    contract.events
      .DataStored(options)
      .on("data", function (event) {
        console.log("event listen:", event); //only single event
        process.exit(0); //exit after listening event
      })
      .on("error", console.error);
  } catch (err) {
    console.log("Error", err.message);
  }
}

transaction();
