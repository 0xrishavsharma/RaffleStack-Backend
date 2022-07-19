const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helpful-hardhat-config.js");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RaffleStack", async () => {
        let raffleStack, vrfCoordinatorV2Mock, entranceFee, deployer, interval
        const chainId = network.config.chainId;

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["all"]);
            raffleStack = await ethers.getContract("RaffleStack", deployer);
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
            RaffleStackEntranceFee = await raffleStack.getEntranceFee();
            interval = await raffleStack.getTimeInterval();
        })
        
        describe("constructor", async () => {
            it("Initializes the RaffleStack correctly", async () => {
                // Ideally we'll only have one assert per "it"
                const raffleStackState = await raffleStack.getRaffleStackState();
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
                await raffleStack.enterRaffleStack({ "value": RaffleStackEntranceFee });
                const firstRafflePlayer = await raffleStack.getPlayer(0);
                assert.equal(firstRafflePlayer, deployer);
            }),
                
            it("Emits an event when someone enters RaffleStack", async () => {
                await expect(raffleStack.enterRaffleStack({value: RaffleStackEntranceFee})).to.emit(raffleStack, "RaffleStackEntered")
            }),
                
            it("It doesn't allow player to enter when Raffle is not open", async () => {
                // We can make this test happen when the RaffleStack is in calculating state and that is 
                // only happening when we are performing the upkeep and that happens when checkupkeep returns true
                
                // So, instead of Chainlink Node performing the checkupkeep function. We'll pretend to be the node here.
                await raffleStack.enterRaffleStack({ value: RaffleStackEntranceFee });
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                // Now that every condition needed for checkupkeep to return true are fulfilled
                // We should be able to act as a Chainlink keeper and call PerformUpkeep function
                await raffleStack.performUpkeep([]);
                await expect(raffleStack.enterRaffleStack({ value: RaffleStackEntranceFee })).to.be.revertedWith("RAFFLESTACK_RAFFLENOTOPEN");
            }),
            
            describe("CheckUpKeep", async () => {
                it("returns false if people haven't send any Eth", async () => {
                    await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                    await network.provider.send("evm_mine", [])
                    await address(raffleStack.address).balance
                })
            })
        })

    })