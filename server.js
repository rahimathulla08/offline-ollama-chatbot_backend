// server.js

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Ollama } from "ollama";

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create Ollama client
const ollama = new Ollama({ host: "http://localhost:11434" });

// Endpoint: Chat with streaming
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Invalid message" });
  }

  // Set headers for Server-Sent Events (SSE)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Send headers immediately

  try {
    const response = await ollama.chat({
      model: "llama3",
      messages: [{ role: "user", content: message }],
      stream: true,
    });

    for await (const chunk of response) {
      if (chunk?.message?.content) {
        const data = JSON.stringify(chunk.message.content);
        res.write(`data: ${data}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Ollama Error:", error);
    res.write(`data: {"error": "Ollama failed"}\n\n`);
    res.end();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
