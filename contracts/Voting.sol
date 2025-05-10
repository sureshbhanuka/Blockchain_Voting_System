// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    address public owner;
    mapping(address => bool) public allowList;
    mapping(address => bool) public voters;
    Candidate[] public candidates;

    uint256 public votingStart;
    uint256 public votingEnd;

    event VotingTimeSet(uint256 startTime, uint256 endTime);
    event Voted(address voter, uint256 candidateIndex);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only admin can call this function.");
        _;
    }

    modifier onlyAllowListed() {
        require(allowList[msg.sender], "You are not an allowlisted voter.");
        _;
    }

    constructor(string[] memory _candidateNames) {
        owner = msg.sender;
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate(_candidateNames[i], 0));
        }
    }

    function addCandidate(string memory _name) public onlyOwner {
        candidates.push(Candidate(_name, 0));
    }

    function addAllowList(address _voter) public onlyOwner {
        allowList[_voter] = true;
    }

    // Updated function: set future start time and end time
    function setVotingTime(uint256 _startTimestamp, uint256 _durationInMinutes) public onlyOwner {
    require(_startTimestamp > block.timestamp, "Start time must be in the future.");

    uint256 _endTimestamp = _startTimestamp + (_durationInMinutes * 1 minutes);
    require(_endTimestamp > _startTimestamp, "End time must be after the start time.");

    votingStart = _startTimestamp;
    votingEnd = _endTimestamp;

    emit VotingTimeSet(votingStart, votingEnd);
}



    function vote(uint256 _candidateIndex) public onlyAllowListed {
        require(!voters[msg.sender], "You have already voted.");
        require(_candidateIndex < candidates.length, "Invalid candidate index.");
        require(block.timestamp >= votingStart, "Voting has not started yet.");
        require(block.timestamp < votingEnd, "Voting period has ended.");

        candidates[_candidateIndex].voteCount++;
        voters[msg.sender] = true;
        emit Voted(msg.sender, _candidateIndex);
    }

    function getAllVotesOfCandidates() public view returns (string[] memory, uint256[] memory) {
        string[] memory names = new string[](candidates.length);
        uint256[] memory votes = new uint256[](candidates.length);

        for (uint256 i = 0; i < candidates.length; i++) {
            names[i] = candidates[i].name;
            votes[i] = candidates[i].voteCount;
        }

        return (names, votes);
    }

    // Updated to give detailed status message
    function getVotingStatus() public view returns (string memory) {
        if (block.timestamp < votingStart) {
            return "Voting has not started yet.";
        } else if (block.timestamp >= votingStart && block.timestamp < votingEnd) {
            return "Voting is in progress.";
        } else {
            return "Voting has ended.";
        }
    }

    function getRemainingTime() public view returns (uint256) {
        if (block.timestamp >= votingEnd) {
            return 0;
        } else if (block.timestamp < votingStart) {
            return (votingEnd - votingStart) / 60; // In minutes
        } else {
            return (votingEnd - block.timestamp) / 60; // In minutes
        }
    }

    function getVotingDuration() public view returns (uint256) {
        if (votingStart == 0 || votingEnd == 0 || votingEnd <= votingStart) {
            return 0;
        }
        return (votingEnd - votingStart) / 60; // Duration in minutes
    }

    function isVotingStarted() public view returns (bool) {
        return block.timestamp >= votingStart;
    }

    function isVotingEnded() public view returns (bool) {
        return block.timestamp >= votingEnd;
    }

    function isAdmin(address _user) public view returns (bool) {
        return _user == owner;
    }
}
