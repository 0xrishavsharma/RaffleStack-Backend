const { developmentChains } = require("../../helpful-hardhat-config.js");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle", async () => {
        
    })