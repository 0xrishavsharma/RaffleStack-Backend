const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helpful-hardhat-config");

    developmentChains.includes(network.name)
    ? describe.skip
    : describe("RaffleStack", () => {
        let deployer, player, raffleStack
        const chainId = network.config.chainId;

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer; // We'll not deploy any fixtures here because ""
            await deployments.fixture(["all"]);
            raffleStack = await ethers.getContract("RaffleStack", deployer);
            const RaffleStackEntranceFee = await raffleStack.getEntranceFee();
        })
        
        describe("fullfilRandomWords", () => {
            it("works with live Chainlink Keepers and Chainlink VRF, we receive a random winner", async () => {
                const initialTimeStamp = await raffleStack.getLastTimeStamp();
            })
        })
    })