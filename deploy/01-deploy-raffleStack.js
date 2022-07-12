module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const { deployer } = getNamedAccounts;

    const RaffleStack = await deploy("RaffleStack", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 6
    } )
}