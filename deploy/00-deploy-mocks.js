const { ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("./../helpful-hardhat-config.js");


const BASE_FEE = ethers.utils.parseEther("0.25"); //This is the price we are paying coordinators to give us a random number
const GAS_PRICE_LINK = 1e9 // Link per gas //Calculated value based on the gas price on the chain
// Chainlink nodes pays gas for us to give us randomness or any other execution so to compensate them in LINK we need to know
// how much link we need to pay say to compensate them properly, but in LINK

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deployer } = await getNamedAccounts();
    const { deploy, log } = deployments;
    const args = [BASE_FEE, GAS_PRICE_LINK];

    if (deploymentChains.includes(network.name)) {
        console.log("Local network detected! Deploying mocks..");
        // deploy vrfCoordinator mock...
        const vrfCoordinatorV2Mock = await deploy("vrfCoordinatorV2Mock", {
            from: deployer,
            args: args,
            log: true
        });
        console.log("Hooray, Mocks deployed!");
        log("-------------------------------------")
    }
}

module.exports.tags = ["all","mocks"];