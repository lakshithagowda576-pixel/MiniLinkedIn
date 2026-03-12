/**
 * Groq API Configuration
 * Used for AI-powered features: bio enhancement, caption improvement, skill matching
 */
const Groq = require("groq-sdk");
require("dotenv").config();

// Initialize Groq client with API key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Send a prompt to Groq API and get a response
 * @param {string} systemPrompt - System instruction for the AI
 * @param {string} userPrompt - User's input text
 * @param {number} maxTokens - Maximum tokens in the response
 * @returns {Promise<string>} - AI generated response text
 */
const getGroqResponse = async (
  systemPrompt,
  userPrompt,
  maxTokens = 500
) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq API Error:", error.message);
    throw new Error("AI service is currently unavailable. Please try again later.");
  }
};

module.exports = { groq, getGroqResponse };
