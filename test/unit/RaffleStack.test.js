const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helpful-hardhat-config.js");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RaffleStack", () => {
        let raffleStack, vrfCoordinatorV2Mock, entranceFee, deployer, interval
        const chainId = network.config.chainId;

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["all"]); //Deploys or run all scripts with an "all" tag 
            raffleStack = await ethers.getContract("RaffleStack", deployer);
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
            RaffleStackEntranceFee = await raffleStack.getEntranceFee();
            interval = await raffleStack.getTimeInterval();
        })
        
        describe("constructor",  () => {
            it("Initializes the RaffleStack correctly", async () => {
                // Ideally we'll only have one assert per "it"
                const raffleStackState = await raffleStack.getRaffleStackState();
                const entranceFee = await raffleStack.getEntranceFee();
                assert.equal(raffleStackState.toString(), "0");
                assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
                assert.equal(entranceFee.toString(), ethers.utils.parseEther("0.01").toString());
            })
        })

        describe("Enter Raffle", () => {
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
            
            describe("CheckUpKeep", () => {
                it("returns false if people haven't send any Eth", async () => {
                    await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                    await network.provider.send("evm_mine", []);
                    const { upkeepNeeded } = await raffleStack.callStatic.checkUpkeep([]);
                    assert(!upkeepNeeded)
                }),
                it("returns false if raffle isn't open", async () => {
                    await raffleStack.enterRaffleStack({value: RaffleStackEntranceFee})
                    await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                    await network.provider.request({method: "evm_mine", params: []});
                    await raffleStack.performUpkeep([]);  //changes the state to calculating
                    const raffleStackState = await raffleStack.getRaffleStackState();
                    const { upkeepNeeded } = await raffleStack.callStatic.checkUpkeep([]);
                    assert.equal(raffleStackState.toString(), "1");
                    assert.equal(upkeepNeeded, false); 
                }),
                it("returns false if enough time hasn't passed", async () => {
                    await raffleStack.enterRaffleStack({value: RaffleStackEntranceFee});
                    await network.provider.send("evm_increaseTime", [interval.toNumber() - 1]);
                    await network.provider.request({method: "evm_mine", params: []});
                    const { upkeepNeeded } = await raffleStack.callStatic.checkUpkeep([]);
                    assert.equal(upkeepNeeded, false);
                }),
                it("returns true if enough time has passed, has eth, has one player and is open", async () => {
                    await raffleStack.enterRaffleStack({ value: RaffleStackEntranceFee });
                    await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                    await network.provider.request({ method: "evm_mine", params: [] });
                    const { upkeepNeeded } = await raffleStack.callStatic.checkUpkeep([]);
                    assert.equal(upkeepNeeded, true);
                })
            }),
                
            describe("performUpkeep", () => {
                it("can only run if checkUpkeep is true", async () => {
                    await raffleStack.enterRaffleStack({ value: RaffleStackEntranceFee });
                    await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                    await network.provider.request({ method: "evm_mine", params: [] });
                    const upkeepNeeded  = await raffleStack.performUpkeep("0x");
                    assert(upkeepNeeded);
                }),
                it("reverts with a custom error if upKeep isn't needed", async () => {
                    await expect(raffleStack.performUpkeep("0x")).to.be.revertedWith("RAFFLESTACK__CHECKUPKEEPNOTTRUE");
                })
                it("state changes to calculating,an event is emitted and calls the vrf Coordinator after calling performUpkeep", async () => {
                    await raffleStack.enterRaffleStack({ value: RaffleStackEntranceFee });
                    await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                    await network.provider.request({ method: "evm_mine", params: [] });
                    const txResponse = await raffleStack.performUpkeep([]);
                    const txReceipt = await txResponse.wait(1);
                    const requestId = await txReceipt.events[1].args.requestId;
                    const raffleStackState = await raffleStack.getRaffleStackState();
                    assert.equal(raffleStackState.toString(), "1");
                    assert(requestId.toNumber() > 0)
                })
            }),
                
            describe("fulfillRandomWords returns a random number, selects the winner, sends the money to winner and emits an event", () => {
                beforeEach(async () => {
                    await raffleStack.enterRaffleStack({ value: RaffleStackEntranceFee });
                    await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                    await network.provider.request({ method: "evm_mine", params: []});
                })
                
                it("can only be called after performUpkeep ", async () => {
                    await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, raffleStack.address)).to.be.revertedWith("nonexistent request");
                })

                // The largest promise test so far
                // Doing all the above things in a single test
                it("picks a winner, resets the lottery and sends money to winner", async () => {
                    const additionalEntrants = 3;
                    const startingAccountIndex = 1; //As 0 goes to the deployer
                    const accounts = await ethers.getSigners();
                    for (i = startingAccountIndex; i < startingAccountIndex + additionalEntrants; i++){
                        const accountConnectedToRaffleStack = await raffleStack.connect(accounts[i]);
                        await raffleStack.enterRaffleStack({ value: RaffleStackEntranceFee });
                    }
                    const startingTimeStamp = raffleStack.getLastTimeStamp();

                    // Now what we want to do is a little tricky
                    // 1. Run performUpKeep ( means mock being Chainlink keepers)
                    // 2. Which will call fulfillRandomWords (mock being a Chainlink VRF)
                    // 3. Waiting for the fulfillRandomWords to be called
                    //  Now, for us to wait for this to be called we need to set up a Listener. We don't want 
                    // this test to be finished before the listener has finished listening.
                    await new Promise(async (resolve, reject) => {
                        raffleStack.once("WinnerPicked", async () => { 
                            console.log("Found the event!")
                            try {
                                // Here we'll insert all of our assert statements
                                const recentWinner = await raffleStack.getRecentWinner();
                                console.log("Recent winner is:", recentWinner);
                                console.log("Player 1 is:", accounts[0].address);
                                console.log("Player 2 is:", accounts[1].address);
                                console.log("Player 3 is:", accounts[2].address);
                                console.log("Player 4 is:", accounts[3].address);
                                const winnerEndingBalance = await accounts[0].getBalance();
                                const raffleStackState = await raffleStack.getRaffleStackState();
                                const numPlayers = await raffleStack.getNumberOfPlayers();
                                const lastTimeStamp = await raffleStack.getLastTimeStamp();

                                assert.equal(numPlayers.toString(), "0");
                                assert.equal(raffleStackState.toString(), "0");
                                assert(lastTimeStamp < startingTimeStamp);

                                assert.equal( winnerEndingBalance.toString(), winnerStartingBalance.add(RaffleStackEntranceFee.mul(additionalEntrants).add(RaffleStackEntranceFee)).toString())
                            } catch (e) {
                                console.log("The promise got rejected with the following error:", e)
                                reject()
                            }
                            resolve()    //But what if the this never get resolved and their is an issue we have to reject this
                                         //to do that we will define a timeout in our config file and this will run reject() the promise after that timeout.
                        });
                        // Below we'll fire the event and listener will pick it up and resolve
                        const tx = await raffleStack.performUpkeep([]);
                        const txReceipt = await tx.wait(1);
                        const winnerStartingBalance = await accounts[0].getBalance();
                        await vrfCoordinatorV2Mock.fulfillRandomWords(txReceipt.events[1].args.requestId, raffleStack.address)
                    })
                })
            })

                
        })


    })