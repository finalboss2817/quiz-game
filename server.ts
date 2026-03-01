import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import multer from "multer";
import { PDFParse } from "pdf-parse";

dotenv.config();

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || "https://tggwuedmagyqpjezxxql.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_rC3QwfElJuaXhrChoyD2rA_EyWxb0qm";
const supabase = createClient(supabaseUrl, supabaseKey);

// Smart Parser Algorithm (From Scratch)
function smartParseSyllabus(text: string) {
  // 1. Clean text and split into sentences
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/[.!?]\s+/)
    .filter(s => s.length > 30 && s.length < 300); // Filter for meaningful sentences

  // 2. Look for "Fact" patterns (e.g., "X is Y", "X refers to Y", "X involves Y")
  const patterns = [
    /\b([\w\s]+)\s+(?:is|are|refers to|involves|consists of|means)\s+([\w\s,.-]+)/i,
    /([\w\s]+):\s+([\w\s,.-]+)/i
  ];

  const facts: { term: string, definition: string }[] = [];
  
  for (const sentence of sentences) {
    for (const pattern of patterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2]) {
        const term = match[1].trim();
        const definition = match[2].trim();
        
        // Basic validation: term should be short, definition should be longer
        if (term.split(' ').length <= 5 && definition.split(' ').length >= 3) {
          facts.push({ term, definition });
          break;
        }
      }
    }
  }

  // Remove duplicates
  const uniqueFacts = Array.from(new Map(facts.map(f => [f.term.toLowerCase(), f])).values());

  if (uniqueFacts.length < 4) {
    throw new Error("Could only extract " + uniqueFacts.length + " facts. Syllabus needs more clear 'Term: Definition' or 'X is Y' patterns.");
  }

  return uniqueFacts.map((fact, index) => {
    const otherDefinitions = uniqueFacts
      .filter((_, i) => i !== index)
      .map(f => f.definition);
    
    const distractors = otherDefinitions
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const options = [fact.definition, ...distractors].sort(() => 0.5 - Math.random());
    const correctIndex = options.indexOf(fact.definition);

    return {
      question: `According to the syllabus, what is the correct description of "${fact.term}"?`,
      options,
      correct: correctIndex,
      subject: "Syllabus Mastery"
    };
  });
}

// Custom Syllabus Engine (Algorithm from scratch)
function generateQuestionsFromSyllabus(syllabusText: string, subject: string) {
  const lines = syllabusText.split('\n').filter(line => line.includes(':'));
  const facts = lines.map(line => {
    const [term, definition] = line.split(':').map(s => s.trim());
    return { term, definition };
  });

  if (facts.length < 4) {
    throw new Error("Syllabus must contain at least 4 'Term: Definition' pairs for distractor generation.");
  }

  return facts.map((fact, index) => {
    // Get all other definitions as potential distractors
    const otherDefinitions = facts
      .filter((_, i) => i !== index)
      .map(f => f.definition);
    
    // Randomly pick 3 distractors
    const distractors = otherDefinitions
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // Combine and shuffle options
    const options = [fact.definition, ...distractors].sort(() => 0.5 - Math.random());
    const correctIndex = options.indexOf(fact.definition);

    return {
      question: `What is the correct definition or function of "${fact.term}"?`,
      options,
      correct: correctIndex,
      subject: subject || "General Syllabus"
    };
  });
}

// API Routes
app.get("/api/questions", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order('created_at', { ascending: false })
      .limit(15);
    
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/questions/upload", upload.single('pdf'), async (req: any, res) => {
  const { adminSecret, subject } = req.body;
  
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "HSC_ADMIN_2026") {
    return res.status(403).json({ error: "Unauthorized: Invalid Admin Secret" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded" });
  }

  try {
    const parser = new PDFParse({ data: req.file.buffer });
    const textResult = await parser.getText();
    const questions = smartParseSyllabus(textResult.text);
    
    const { data: savedData, error } = await supabase
      .from("questions")
      .insert(questions.map(q => ({ ...q, subject: subject || "PDF Syllabus" })))
      .select();

    if (error) throw error;
    res.json(savedData);
  } catch (error: any) {
    console.error("PDF Engine Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/questions/generate", async (req, res) => {
  const { syllabus, subject, adminSecret } = req.body;
  
  // Admin Protection
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "HSC_ADMIN_2026") {
    return res.status(403).json({ error: "Unauthorized: Invalid Admin Secret" });
  }

  if (!syllabus) {
    return res.status(400).json({ error: "Syllabus text is required" });
  }

  try {
    const questions = generateQuestionsFromSyllabus(syllabus, subject);
    
    const { data, error } = await supabase
      .from("questions")
      .insert(questions)
      .select();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error("Engine Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/scores", async (req, res) => {
  const { username, score } = req.body;
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .insert([{ username, score }])
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("score", { ascending: false })
      .limit(10);
    
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
