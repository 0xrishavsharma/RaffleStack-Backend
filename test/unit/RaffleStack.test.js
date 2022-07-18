const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helpful-hardhat-config.js");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RaffleStack", async () => {
        let raffleStack, vrfCoordinatorV2Mock, entranceFee, deployer
        const chainId = network.config.chainId;

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["all"]);
            raffleStack = await ethers.getContract("RaffleStack", deployer);
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
            entranceFee = await raffleStack.getEntranceFee();
        })
        
        describe("constructor", async () => {
            it("Initializes the RaffleStack correctly", async () => {
                // Ideally we'll only have one assert per "it"
                const raffleStackState = await raffleStack.getRaffleStackState();
                const interval = await raffleStack.getTimeInterval();
                const entranceFee = await raffleStack.getEntranceFee();
                assert.equal(raffleStackState.toString(), "0");
                assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
                assert.equal(entranceFee.toString(), ethers.utils.parseEther("0.01").toString());
            })
        })

        describe("Enter Raffle", async () => {
            it("Reverts when user doesn't pay enough", async () => {
                await expect(raffleStack.enterRaffleStack()).to.be.revertedWith("RAFFLESTACK__NOTENOUGHETHTOENTER")
            }),
            
            it("Record players when they enter", async () => {
                raffleStack.enterRaffleStack({ "value": entranceFee });
                const firstRafflePlayer = await raffleStack.getPlayer(0);
                assert.equal(firstRafflePlayer, deployer);
            }),
                
                it("Reverts the transaction when the raffle isn't open", async () => {
                raffleStack.enterRaffleStack()
            })
        })

    })