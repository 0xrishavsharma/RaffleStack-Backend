const { network, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helpful-hardhat-config");
const { verify } = require("./../utils/verify.js");

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const { deployer } = getNamedAccounts;
    let vrfCoordinatorAddress, subscriptionId;
    const chainId = network.config.chainId;
    const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("6");

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorAddress = vrfCoordinatorV2Mock.address;
        
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
        const transactionReceipt = await transactionResponse.wait(1) // Waiting for 1 block confirmations
        // And inside this transactionReceipt their is an EVENT which is being emitted with our subscription id
        subscriptionId = await transactionReceipt.events[0].args.subId; //usually we need LINK token to fund the subscription but for this iteration of mock we can do it with ether

        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT);
    } else {
        vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinatorV2"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }

    let entranceFee = networkConfig[chainId]["entranceFee"];
    let gasLane = networkConfig[chainId]["gasLane"];
    let callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
    let interval = networkConfig[chainId]["interval"]
    let args = [vrfCoordinatorAddress, entranceFee, gasLane, subscriptionId, callbackGasLimit, interval];
    const RaffleStack = await deploy("RaffleStack", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying...");
        await verify(raffle.address, args);
    }

    log("-------------------------------------");
}

module.exports.tags = ["all", "raffleStack"];