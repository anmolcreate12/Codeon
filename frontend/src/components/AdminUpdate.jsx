import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminUpdate() {
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);

  // fetch problems, let user pick one to edit
  useEffect(() => {
    axios.get('/api/problems').then(res => setProblems(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <h1 className="text-3xl font-bold mb-6">Update Problem</h1>
      {/* your update form here */}
    </div>
  );
}

export default AdminUpdate;