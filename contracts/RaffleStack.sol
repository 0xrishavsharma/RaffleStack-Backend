//SPDX-License-Identifier: MIT
pragma solidity^0.8;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error RAFFLESTACK__NOTENOUGHETHTOENTER();
error RAFFLESTACK__MONEYTRANSFERFAILED();
error RAFFLESTACK_RAFFLENOTOPEN();

contract RaffleStack is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /* Type Declarations */
    enum RaffleStackState{
        OPEN,
        CALCULATING
    }  //When we create an Enum, we are secretly creating a uint256 where 0 = OPEN and 1 = CALCULATING

    /* State variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;


    /* Lottery winners */
    address private s_recentWinner;
    RaffleStackState private s_raffleStackState;
    uint256 private s_lastTimestamp;
    uint256 private immutable i_timeInterval;

    /* Events */
    event RaffleStackEntered(address indexed player);
    event RequestedRaffleWinner(uint256 requestId);
    event WinnerPicked(address indexed winner);

    constructor(
        uint256 entranceFee, 
        address vrfCoordinator, 
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 timeInterval
    ) VRFConsumerBaseV2(vrfCoordinator){
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleStackState = RaffleStackState.OPEN;
        s_lastTimestamp = block.timestamp;
        i_timeInterval = timeInterval;
    }

    function enterRaffleStack() public payable{
        if(msg.value < i_entranceFee){
            revert RAFFLESTACK__NOTENOUGHETHTOENTER();
        }
        if( s_raffleStackState == RaffleStackState.CALCULATING ){
            revert RAFFLESTACK_RAFFLENOTOPEN();
        }
        s_players.push(payable(msg.sender));
        emit RaffleStackEntered(msg.sender);
    }
    /**
    * @dev Following is the function that Chainlink Keeper node call
    * and the node looks for the `upKeepNeeded` to be returned as true.
    * If true is returned that means it is time to pick a random winner
    * Follwing condition should be true in order to return "true":
    *   1. Our time interval should have passed
    *   2. The lottery should have atleast 1 player
    *   3. Our subscription should have LINK
    *   4. Our lottery should be in "open" state    
    */
    // Chainlink Keepers will automatically call this function so that their is no human intervention other than deploying the contract
    function checkUpkeep( 
        bytes calldata /*checkData*/  //Using bytes as an input parameter we get alot of things that we can do while calling the function
        ) view external override returns(bool upkeepNeeded, bytes memory /* performData */){ // If we write the name of the variable we want to return
        // then if automatically gets returned we don't have to write a return statement inside the function
        // checkUpKeep will return true only if the above/follwing 4 conditons are true.
        bool isOpen =  (RaffleStackState.OPEN == s_raffleStackState); 
        bool timePassed = ((block.timestamp - s_lastTimestamp) > i_timeInterval);
        bool atLeastOnePlayer = (s_players.length >= 1);
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && atLeastOnePlayer && hasBalance); 

    }

    function performUpkeep(bytes calldata /* performDate */) external override{ //Renaming "requestRandomWinner" to "performUpKeep" as we can do both jobs in one function
        // There are two steps before declaring a random winner
        // 1. Request a random number using VRF
        // Chainlink VRF is actually a two step process. First we have to request a random number then we'll recieve the random winner.
        // 2. Then declare the random selected address as winner
        s_raffleStackState = RaffleStackState.CALCULATING;
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
        s_players = new address payable[](0); //Here "(0)" means the size of the array and in this case it is zero.
        s_raffleStackState = RaffleStackState.OPEN;
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