import React, { useState, useEffect } from "react";


const Connected = (props) => {

  const [remainingTime, setRemainingTime] = useState("");

  useEffect(() => {
    if (!props.votingEndTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((props.votingEndTime.getTime() - now.getTime()) / 1000);

      if (diff <= 0) {
        setRemainingTime("Voting has ended");
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        setRemainingTime(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [props.votingEndTime]);

  

  
  return (
    <div className="connected-container">
      <h1 className="connected-header">You are Connected to Metamask</h1>

      <p className="connected-account">
        <strong>Metamask Account:</strong> {props.account}
      </p>

      {/* ✅ Display Start and End Times */}
      {props.votingStartTime && props.votingEndTime && (
        
        <div className="voting-time-info">
          <p><strong>🕒 Voting Starts:</strong> {props.votingStartTime.toLocaleString()}</p>
          <p><strong>🕓 Voting Ends:</strong> {props.votingEndTime.toLocaleString()}</p>
        </div>
      )}
        
      <p className="connected-account">
            <strong>⏳ Remaining Time:</strong> {remainingTime}
      </p>


      {props.showButton ? (
        <p className="voted-message">❌ You have already voted.</p>
      ) : (
        <div className="vote-section">
          <input
            type="number"
            min="1"
            placeholder="Enter Candidate Index"
            value={props.number}
            onChange={props.handleNumberChange}
            className="vote-input"
          />
          <button className="vote-button" onClick={props.voteFunction}>
            Vote
          </button>
        </div>
      )}

      <h2 className="candidates-header">Candidates List</h2>
      <table className="candidates-table">
        <thead>
          <tr>
            <th>Index</th>
            <th>Candidate Name</th>
            <th>Vote Count</th>
          </tr>
        </thead>
        <tbody>
          {props.candidates.map((candidate, idx) => (
            <tr key={idx}>
              <td>{candidate.index}</td>
              <td>{candidate.name}</td>
              <td>{candidate.voteCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Connected;
