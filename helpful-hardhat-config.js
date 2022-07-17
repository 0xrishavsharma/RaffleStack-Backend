const { ethers, network } = require("hardhat");
const networkConfig = {
    default: {
        name: "hardhat",
        interval: "30",
    },
    31337: {
        name: "localhost",
        entranceFee: "10000000000000000",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", 
        callbackGasLimit: "500000",
        interval: "30"
    },
    4: {
        name: "rinkeby",
        vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        entranceFee: "10000000000000000",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        subscriptionId: "0",
        callbackGasLimit: "500000",
        interval: "30"
    },
}
const developmentChains = ["hardhat", "localhost"];

module.exports = {
    networkConfig,
    developmentChains
}