//SPDX-License-Identifier: MIT
pragma solidity^0.8;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error RAFFLESTACK__NOTENOUGHETHTOENTER();
error RAFFLESTACK__MONEYTRANSFERFAILED();

contract RaffleStack is VRFConsumerBaseV2, KeeperCompatibleInterface {
    // State variables
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery winners
    address private s_recentWinner;

    // Events
    event RaffleStackEntered(address indexed player);
    event RequestedRaffleWinner(uint256 requestId);
    event WinnerPicked(address indexed winner);

    constructor(
        uint256 entranceFee, 
        address vrfCoordinator, 
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinator){
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
    }

    function enterRaffleStack() public payable{
        if(msg.value < i_entranceFee){
            revert RAFFLESTACK__NOTENOUGHETHTOENTER();
        }
        s_players.push(payable(msg.sender));
        emit RaffleStackEntered(msg.sender);
    }
    // Chainlink Keepers will automatically call this function so that their is no human intervention other than deploying the contract

    function checkUpkeep() external override{}

    function performUpkeep() external override{}

    function requestRandomWinner() external {
        // There are two steps before declaring a random winner
        // 1. Request a random number using VRF
        // Chainlink VRF is actually a two step process. First we have to request a random number then we'll recieve the random winner.
        // 2. Then declare the random selected address as winner
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane, //Gaslane -  The max amount of link that we are will to pay for a random number
            i_subscriptionId, // Is the needed to pay for the Oracle gas (Link)
            REQUEST_CONFIRMATIONS, // How many blocks should a Chainlink node should wait before responding
            i_callbackGasLimit, // Protects us from requesting random no. when our code becomes gas intensive
            NUM_WORDS // Number of random numbers we want to get
        );
        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(uint256 /*requestId*/, uint256[] memory randomWords) 
        internal 
        override 
    {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if(!success){
            revert RAFFLESTACK__MONEYTRANSFERFAILED();
        }
        emit WinnerPicked(recentWinner);
    }

    // View/Pure functions
    function getEntraceFee() public view returns(uint256){
        return i_entranceFee;
    }
    function getPlayer(uint256 index) public view returns(address){
        return s_players[index];
    }
    function getRecentWinner() public view returns(address){
        return s_recentWinner;
    }

    
}