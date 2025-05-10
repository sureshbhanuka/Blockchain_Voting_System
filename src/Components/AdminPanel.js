import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractAbi, contractAddress } from "../Constant/constant";
import "./AdminPanel.css";

function AdminPanel() {
    const [candidateName, setCandidateName] = useState("");
    const [voterAddress, setVoterAddress] = useState("");
    const [startDateTime, setStartDateTime] = useState("");
    const [endDateTime, setEndDateTime] = useState("");
    const [remainingTime, setRemainingTime] = useState("");
    const [message, setMessage] = useState("");

    async function getContractWithSigner() {
        if (!window.ethereum) {
            setMessage("Metamask is not installed.");
            return null;
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        return new ethers.Contract(contractAddress, contractAbi, signer);
    }

    async function addCandidate() {
        try {
            const contract = await getContractWithSigner();
            if (!contract) return;
            
            const tx = await contract.addCandidate(candidateName);
            await tx.wait();

            setMessage(`✅ Candidate "${candidateName}" added successfully!`);
            setCandidateName("");
        } catch (error) {
            setMessage("❌ Error adding candidate: " + error.message);
        }
    }

    async function addAllowlistVoter() {
        try {
            const contract = await getContractWithSigner();
            if (!contract) return;
            
            const tx = await contract.addAllowList(voterAddress);
            await tx.wait();

            setMessage(`✅ Voter ${voterAddress} added to allowlist successfully!`);
            setVoterAddress("");
        } catch (error) {
            setMessage("❌ Error adding voter: " + error.message);
        }
    }

    async function setElectionTime() {
    try {
        const contract = await getContractWithSigner();
        if (!contract) return;

        const startTimestamp = Math.floor(new Date(startDateTime).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endDateTime).getTime() / 1000);

        if (startTimestamp >= endTimestamp) {
            setMessage("❌ Start time must be before end time.");
            return;
        }

        const durationInMinutes = Math.floor((endTimestamp - startTimestamp) / 60);

        const tx = await contract.setVotingTime(startTimestamp, durationInMinutes); // ✅ Fixed here
        await tx.wait();

        setMessage("✅ Election time set successfully!");
        fetchRemainingTime();
    } catch (error) {
        setMessage("❌ Error setting election time: " + error.message);
    }
}


    async function fetchRemainingTime() {
        try {
            const contract = await getContractWithSigner();
            if (!contract) return;

            const timeLeft = await contract.getRemainingTime();
            setRemainingTime(`${timeLeft.toString()} minutes`);
        } catch (error) {
            console.error("Error fetching remaining time:", error);
            setRemainingTime("Error fetching remaining time.");
        }
    }

    useEffect(() => {
        fetchRemainingTime();
        const interval = setInterval(fetchRemainingTime, 1000); // Refresh every 1 second
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(""), 5000); // Clear message after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div className="admin-panel">
            <h2>Admin Panel</h2>
            {message && <p className="message">{message}</p>}

            <div>
                <input
                    type="text"
                    placeholder="Candidate Name"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                />
                <button onClick={addCandidate}>Add Candidate</button>
            </div>

            <div>
                <input
                    type="text"
                    placeholder="Voter Address"
                    value={voterAddress}
                    onChange={(e) => setVoterAddress(e.target.value)}
                />
                <button onClick={addAllowlistVoter}>Add Voter</button>
            </div>

            <div>
                <h3>Set Election Time</h3>
                <input
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                />
                <input
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                />
                <button onClick={setElectionTime}>Set Election Time</button>
            </div>

            <div>
                <h3>Remaining Time: {remainingTime}</h3>
                <button onClick={fetchRemainingTime}>Refresh Time</button>
            </div>
        </div>
    );
}

export default AdminPanel;
