import React, { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';

function AdminUpdate() {
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);

  useEffect(() => {
    axiosClient.get('/problem/getAllProblem')
      .then(res => setProblems(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <h1 className="text-3xl font-bold mb-6">Update Problem</h1>
      {/* your update form here */}
    </div>
  );
}

export default AdminUpdate;