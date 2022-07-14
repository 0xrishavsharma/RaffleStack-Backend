const { ethers } = require("hardhat");

const networkConfig = {
    4: {
        name: "rinkeby",
        vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        entranceFee: ethers.utils.formatEther("0.01"),
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        subscriptionId: "0"
    },
    31337: {
        name: "hardhat",
        entranceFee: ethers.utils.formatEther("0.01"),
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc" //Actually mocks doesn't care which gasLane we are working on 
        //because we are going to mock the gasLane anyways.
    }
}

const developmentChains = ["hardhat", "localhost"];

module.exports = {
    networkConfig,
    developmentChains
}