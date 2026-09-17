const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");
const { getLanguageById, submitBatch, submitToken } = require("../utils/ProblemUtility");

const normalizeLanguage = (lang) => {
  if (!lang) return 'javascript';
  const l = lang.toLowerCase();
  if (l === 'cpp' || l === 'c++') return 'c++';
  if (l === 'java') return 'java';
  return 'javascript';
};

const submitCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;

    let { code, language } = req.body;

    if (!userId || !code || !problemId || !language) {
      return res.status(400).json({ error: "Missing required fields", message: "Code and language are required" });
    }

    language = normalizeLanguage(language);

    // Fetch the problem from database
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found", message: "Problem not found" });
    }

    const hiddenCases = problem.hiddenTestCases || [];
    if (hiddenCases.length === 0) {
      return res.status(400).json({ error: "No test cases configured", message: "No hidden test cases for this problem" });
    }

    // Create submission record
    const submittedResult = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status: 'pending',
      testCasesTotal: hiddenCases.length
    });

    const languageId = getLanguageById(language);

    const submissions = hiddenCases.map((testcase) => ({
      source_code: code,
      language_id: languageId,
      stdin: testcase.input,
      expected_output: testcase.output
    }));

    const submitResult = await submitBatch(submissions);
    const resultToken = submitResult.map((value) => value.token);
    const testResult = await submitToken(resultToken);

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = 'accepted';
    let errorMessage = null;

    for (const test of testResult) {
      if (test.status_id === 3) {
        testCasesPassed++;
        runtime += parseFloat(test.time || 0);
        memory = Math.max(memory, test.memory || 0);
      } else {
        if (test.status_id === 4) {
          status = 'error';
          errorMessage = test.stderr || test.compile_output || 'Compilation/Runtime error';
        } else {
          status = 'wrong';
          errorMessage = test.stderr || 'Wrong Answer';
        }
      }
    }

    // Store the result in Submission
    submittedResult.status = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage || '';
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;

    await submittedResult.save();

    // ProblemId ko insert karenge userSchema ke problemSolved mein if it is accepted
    if (status === 'accepted') {
      const alreadySolved = req.result.problemSolved?.some(
        (id) => id.toString() === problemId.toString()
      );
      if (!alreadySolved) {
        req.result.problemSolved = req.result.problemSolved || [];
        req.result.problemSolved.push(problemId);
        await req.result.save();
      }
    }

    const accepted = (status === 'accepted');
    return res.status(201).json({
      accepted,
      totalTestCases: submittedResult.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory,
      errorMessage
    });

  } catch (err) {
    console.error("Submit Error:", err);
    return res.status(500).json({ error: err.message, message: "Internal Server Error" });
  }
};

const runCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;

    let { code, language } = req.body;

    if (!userId || !code || !problemId || !language) {
      return res.status(400).json({ error: "Missing required fields", message: "Code and language are required" });
    }

    language = normalizeLanguage(language);

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found", message: "Problem not found" });
    }

    const visibleCases = problem.visibleTestCases || [];
    const languageId = getLanguageById(language);

    const submissions = visibleCases.map((testcase) => ({
      source_code: code,
      language_id: languageId,
      stdin: testcase.input,
      expected_output: testcase.output
    }));

    const submitResult = await submitBatch(submissions);
    const resultToken = submitResult.map((value) => value.token);
    const testResult = await submitToken(resultToken);

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = true;
    let errorMessage = null;

    for (const test of testResult) {
      if (test.status_id === 3) {
        testCasesPassed++;
        runtime += parseFloat(test.time || 0);
        memory = Math.max(memory, test.memory || 0);
      } else {
        status = false;
        errorMessage = test.stderr || test.compile_output || null;
      }
    }

    return res.status(200).json({
      success: status,
      testCases: testResult,
      passedTestCases: testCasesPassed,
      totalTestCases: visibleCases.length,
      runtime,
      memory,
      errorMessage
    });

  } catch (err) {
    console.error("Run Code Error:", err);
    return res.status(500).json({ error: err.message, message: "Internal Server Error" });
  }
};

module.exports = { submitCode, runCode };