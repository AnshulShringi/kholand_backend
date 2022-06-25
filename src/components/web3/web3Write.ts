import Web3 from "web3";

import HDWalletProvider from "@truffle/hdwallet-provider";

const provider = new HDWalletProvider({
  mnemonic: process.env.MNEMONIC as string,
  providerOrUrl: process.env.INFURA_ADDRESS as string,
  addressIndex: 0
});

const web3Write = new Web3(provider);

export default web3Write;
