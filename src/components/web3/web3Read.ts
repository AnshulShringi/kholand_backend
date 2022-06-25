import Web3 from "web3";




const provider = new Web3.providers.HttpProvider((process.env.INFURA_ADDRESS) as string);
const web3Read = new Web3(provider);

export default web3Read;
