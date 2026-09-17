const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_KEY,
});

const solveDoubt = async (req, res) => {
  try {
    const { messages, title, description, testCases, startCode } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        message: "Invalid messages format",
      });
    }

    const formattedExamples = typeof testCases === 'string' ? testCases : JSON.stringify(testCases || [], null, 2);
    const formattedStartCode = typeof startCode === 'string' ? startCode : JSON.stringify(startCode || [], null, 2);

    // Convert frontend messages to Groq format
    const chatMessages = [
      {
        role: "system",
        content: `
You are an expert Data Structures and Algorithms (DSA) tutor specializing in helping users solve coding problems. Your role is strictly limited to DSA-related assistance only.

## CURRENT PROBLEM CONTEXT:
[PROBLEM_TITLE]: ${title || "DSA Problem"}
[PROBLEM_DESCRIPTION]: ${description || ""}
[EXAMPLES]: 
${formattedExamples}
[startCode]: 
${formattedStartCode}

## YOUR CAPABILITIES:
1. Hint Provider
2. Code Reviewer
3. Solution Guide
4. Complexity Analyzer
5. Approach Suggester
6. Test Case Helper

## INTERACTION GUIDELINES:
- Give hints step-by-step when asked
- Debug code with explanation
- Provide optimal solutions with reasoning
- Compare approaches when needed

## RESPONSE RULES:
- Be clear and structured
- Use code blocks when needed
- Focus ONLY on DSA
- If unrelated: politely refuse

## TEACHING PHILOSOPHY:
- Encourage thinking
- Explain "why"
- Build intuition
`,
      },
      ...messages.map((msg) => ({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.parts?.[0]?.text || msg.content || "",
      })),
    ];

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: chatMessages,
    });

    return res.status(200).json({
      message: response.choices[0].message.content,
    });

  } catch (err) {
    console.error("Groq AI Error:", err.message);
    return res.status(500).json({
      error: err.message,
      message: "Internal server error",
    });
  }
};

module.exports = solveDoubt;