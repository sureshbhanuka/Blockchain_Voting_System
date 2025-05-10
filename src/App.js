import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractAbi, contractAddress } from './Constant/constant';
import Login from './Components/Login';
import Finished from './Components/Finished';
import Connected from './Components/Connected';
import AdminPanel from './Components/AdminPanel';
import './App.css';

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [votingStatus, setVotingStatus] = useState(true);
  const [remainingTime, setRemainingTime] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [number, setNumber] = useState('');
  const [canVote, setCanVote] = useState(true);
  const [message, setMessage] = useState('');
  const [votingStartTime, setVotingStartTime] = useState(null);
  const [votingEndTime, setVotingEndTime] = useState(null);
  


  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    getCandidates();
    getCurrentStatus();
    getVotingTimes();
    getRemainingTime();
    fetchVotingTimes();

    const intervalId = setInterval(getRemainingTime, 1000);

    return () => {
      clearInterval(intervalId);
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  async function fetchVotingTimes() {
    if (!window.ethereum) return;
  
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
  
    try {
      const start = await contractInstance.votingStart();
      const end = await contractInstance.votingEnd();
  
      setVotingStartTime(new Date(start.toNumber() * 1000)); // Convert to JS Date
      setVotingEndTime(new Date(end.toNumber() * 1000));     // Convert to JS Date
    } catch (error) {
      console.error("Error fetching voting times:", error);
    }
  }

  

  

  async function getVotingTimes() {
    if (!window.ethereum) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

    try {
      const startTimestamp = await contractInstance.votingStartTime();
      const endTimestamp = await contractInstance.votingEndTime();

      const startDate = new Date(Number(startTimestamp.toString()) * 1000);
      const endDate = new Date(Number(endTimestamp.toString()) * 1000);

      setVotingStartTime(startDate);
      setVotingEndTime(endDate);
    } catch (error) {
      console.error("Error fetching voting times:", error);
    }
  }

  async function getRemainingTime() {
    if (!window.ethereum) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

    try {
      const time = await contractInstance.getRemainingTime();
      const minutes = Math.ceil(time);
      setRemainingTime(minutes);
    } catch (error) {
      console.error("Error fetching remaining time:", error);
      setRemainingTime("Error");
    }
  }

  async function vote() {
    if (!window.ethereum) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

    try {
      const isAllowed = await contractInstance.allowList(await signer.getAddress());
      if (!isAllowed) {
        setMessage("❌ You are not authorized to vote.");
        return;
      }

      const tx = await contractInstance.vote(number - 1);
      await tx.wait();

      setMessage("✅ Vote recorded successfully!");
      getCandidates();
      canVoteStatus();
    } catch (error) {
      console.error("Voting error:", error);
      setMessage("❌ Voting error occurred.");
    }
  }

  async function canVoteStatus() {
    if (!window.ethereum) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

    const voteStatus = await contractInstance.voters(await signer.getAddress());
    setCanVote(voteStatus);
  }

  async function getCandidates() {
    if (!window.ethereum) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

    try {
      const [names, votes] = await contractInstance.getAllVotesOfCandidates();

      const formattedCandidates = names.map((name, idx) => ({
        index: idx + 1,
        name: name,
        voteCount: votes[idx].toNumber(),
      }));

      setCandidates(formattedCandidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  }

  async function getCurrentStatus() {
    if (!window.ethereum) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

    const status = await contractInstance.getVotingStatus();
    setVotingStatus(status);
  }

  async function checkIfAdmin() {
    if (!window.ethereum) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();

    try {
      const address = await signer.getAddress();
      const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
      const owner = await contractInstance.owner();

      setIsAdmin(address.toLowerCase() === owner.toLowerCase());
    } catch (error) {
      console.error("Admin check error:", error);
    }
  }

  function handleAccountsChanged(accounts) {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      canVoteStatus();
      checkIfAdmin();
    } else {
      setIsConnected(false);
      setAccount(null);
      setIsAdmin(false);
    }
  }

  async function connectToMetamask() {
    if (!window.ethereum) {
      console.error("Metamask not detected.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setAccount(address);
      setIsConnected(true);
      canVoteStatus();
      checkIfAdmin();
    } catch (error) {
      console.error("Connection error:", error);
    }
  }

  function handleNumberChange(e) {
    setNumber(e.target.value);
  }

  return (
    <div className="App">
      {message && <p className="message">{message}</p>}
      {!isConnected ? (
        <Login connectWallet={connectToMetamask} />
      ) : (
        <>
          {votingStatus ? (
            <Connected
              account={account}
              candidates={candidates}
              remainingTime={remainingTime}
              number={number}
              handleNumberChange={handleNumberChange}
              voteFunction={vote}
              showButton={canVote}
              votingStartTime={votingStartTime}
              votingEndTime={votingEndTime}
            />
          ) : (
            <Finished />
          )}

          {isAdmin && (
            <AdminPanel
              remainingTime={remainingTime}
              getRemainingTime={getRemainingTime}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
