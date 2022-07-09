//SPDX-License-Identifier: MIT
pragma solidity^0.8;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
error RAFFLESTACK__NOTENOUGHETHTOENTER();

contract RaffleStack is VRFConsumerBaseV2 {
    // State variables
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    mapping (address => uint) addressToAmountFunded;

    // Events
    event RaffleStackEntered(address indexed player);

    


    constructor(uint256 entranceFee, address vrfCoordinator) VRFConsumerBaseV2(vrfCoordinator){
        i_entranceFee = entranceFee;
    }

    function enterRaffleStack() public payable{
        if(msg.value < i_entranceFee){
            revert RAFFLESTACK__NOTENOUGHETHTOENTER();
        }
        s_players.push(payable(msg.sender));
        emit RaffleStackEntered(msg.sender);
    }
    // Chainlink Keepers will automatically call this function so that their is no human intervention other than deploying the contract
    function requestRandomWinner() external {
        // There are two steps before declaring a random winner
        // 1. Request a random number using VRF
        // Chainlink VRF is actually a two step process. First we have to request a random number then we'll recieve the random winner.
        // 2. Then declare the random selected address as winner
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) 
        internal 
        override 
    {

    }

    // View/Pure functions
    function getEntraceFee() public view returns(uint256){
        return i_entranceFee;
    }
    function getPlayer(uint256 index) public view returns(address){
        return s_players[index];
    }

    
}