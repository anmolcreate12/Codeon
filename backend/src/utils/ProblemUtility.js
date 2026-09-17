require('dotenv').config();
const axios = require('axios');

const getLanguageById = (lang) => {
  if (!lang) return null;
  const language = {
    "c++": 54,
    "cpp": 54,
    "java": 62,
    "javascript": 63,
    "js": 63
  };

  return language[lang.toString().trim().toLowerCase()] || 63;
};

const submitBatch = async (submissions) => {
  const options = {
    method: 'POST',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: {
      base64_encoded: 'false'
    },
    headers: {
      'x-rapidapi-key': process.env.JUDGE0_KEY,
      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    data: {
      submissions
    }
  };

  const response = await axios.request(options);
  return response.data;
};

const waiting = (timer) => new Promise((resolve) => setTimeout(resolve, timer));

const submitToken = async (resultToken) => {
  if (!resultToken || resultToken.length === 0) {
    return [];
  }

  const options = {
    method: 'GET',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: {
      tokens: resultToken.join(","),
      base64_encoded: 'false',
      fields: '*'
    },
    headers: {
      'x-rapidapi-key': process.env.JUDGE0_KEY,
      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
    }
  };

  let maxAttempts = 30; // Max 30 seconds wait
  while (maxAttempts > 0) {
    maxAttempts--;
    try {
      const response = await axios.request(options);
      const result = response.data;

      if (result && Array.isArray(result.submissions)) {
        const isResultObtained = result.submissions.every((r) => r.status_id > 2);
        if (isResultObtained) {
          return result.submissions;
        }
      }
    } catch (error) {
      console.error('Error fetching token status from Judge0:', error.message);
    }

    await waiting(1000);
  }

  throw new Error("Judge0 submission timeout");
};

module.exports = { getLanguageById, submitBatch, submitToken };
