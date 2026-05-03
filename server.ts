import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { JobSwapProfile, Conversation, Message } from "./src/types";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "jobswap-secret-key";
const APP_URL = process.env.APP_URL || "http://localhost:3001";

// In-memory stores
const users: Map<string, JobSwapProfile> = new Map();
const conversations: Map<string, Conversation> = new Map();

const seedUsers: JobSwapProfile[] = [
  {
    id: "1",
    name: "Alex Rivera",
    role: "Senior Software Engineer",
    industry: "HealthTech",
    homeCity: "San Francisco",
    workCity: "San Jose",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    bio: "Love building scalable systems. Tired of the 101 commute. Looking to swap my SF-based role for something in SJ!",
    salaryMin: 140000,
    salaryMax: 180000,
    yearsOfExperience: 7,
    jobDescription: "Leading backend infrastructure for a Series C healthtech platform serving 2M+ users. TypeScript, Go, Kubernetes.",
    skills: ["TypeScript", "Go", "Kubernetes", "React", "PostgreSQL"],
    likes: ["2"],
    dislikes: [],
    matches: ["2"],
  },
  {
    id: "2",
    name: "Jordan Smith",
    role: "Senior Software Engineer",
    industry: "FinTech",
    homeCity: "San Jose",
    workCity: "San Francisco",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
    bio: "SJ native, working in the city. The Caltrain life is getting old. Anyone in SF want to swap for a great role in SJ?",
    salaryMin: 145000,
    salaryMax: 185000,
    yearsOfExperience: 8,
    jobDescription: "Senior engineer at a fintech startup, building payment infrastructure. TypeScript + React frontend, Go backend.",
    skills: ["TypeScript", "React", "Go", "AWS", "Redis"],
    likes: ["1"],
    dislikes: [],
    matches: ["1"],
  },
  {
    id: "3",
    name: "Taylor Chen",
    role: "Product Manager",
    industry: "SaaS",
    homeCity: "Oakland",
    workCity: "Palo Alto",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor",
    bio: "PM at a Series B startup. Love the mission, hate the bridge traffic.",
    salaryMin: 130000,
    salaryMax: 160000,
    yearsOfExperience: 5,
    jobDescription: "Owning the core product roadmap for a B2B SaaS platform with 500+ enterprise customers.",
    skills: ["Product Strategy", "SQL", "Figma", "JIRA", "A/B Testing"],
    likes: [],
    dislikes: [],
    matches: [],
  },
  {
    id: "4",
    name: "Casey Morgan",
    role: "Product Manager",
    industry: "E-commerce",
    homeCity: "Palo Alto",
    workCity: "Oakland",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Casey",
    bio: "Living in the peninsula, working in the east bay. Let's make our lives easier!",
    salaryMin: 125000,
    salaryMax: 155000,
    yearsOfExperience: 4,
    jobDescription: "PM for consumer checkout experience at a high-growth e-commerce platform. 2M daily active users.",
    skills: ["Product Strategy", "User Research", "SQL", "Amplitude", "Figma"],
    likes: [],
    dislikes: [],
    matches: [],
  },
];

seedUsers.forEach(u => users.set(u.id, u));

// Seed conversation between users 1 and 2 (they're already matched)
const seedConv: Conversation = {
  id: "conv_1_2",
  participantIds: ["1", "2"],
  messages: [
    {
      id: "m1", conversationId: "conv_1_2", senderId: "2",
      text: "Hey! Looks like we'd be a perfect swap — I'm in SJ but work in SF, exact opposite of you 😄",
      timestamp: Date.now() - 7200000,
    },
    {
      id: "m2", conversationId: "conv_1_2", senderId: "1",
      text: "Ha, I noticed that too! What stack are you on?",
      timestamp: Date.now() - 7100000,
    },
    {
      id: "m3", conversationId: "conv_1_2", senderId: "2",
      text: "TypeScript + React frontend, Go backend. Fintech. You?",
      timestamp: Date.now() - 7000000,
    },
    {
      id: "m4", conversationId: "conv_1_2", senderId: "1",
      text: "Basically the same — healthtech though. Want to hop on a call this week?",
      timestamp: Date.now() - 3600000,
    },
  ],
};
conversations.set(seedConv.id, seedConv);

function getOrCreateConversation(id1: string, id2: string): Conversation {
  for (const conv of conversations.values()) {
    if (conv.participantIds.includes(id1) && conv.participantIds.includes(id2)) {
      return conv;
    }
  }
  const conv: Conversation = {
    id: `conv_${id1}_${id2}_${Date.now()}`,
    participantIds: [id1, id2],
    messages: [],
  };
  conversations.set(conv.id, conv);
  return conv;
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3001");

  app.use(express.json());
  app.use(cookieParser());

  const getCurrentUser = (req: express.Request) => {
    const token = req.cookies.token;
    if (!token) return null;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      return users.get(decoded.id) || null;
    } catch {
      return null;
    }
  };

  // ── Health ──────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "JobSwap API is active" });
  });

  // ── Current user ────────────────────────────────────────────────────────
  app.get("/api/me", (req, res) => {
    res.json(getCurrentUser(req));
  });

  app.put("/api/me", (req, res) => {
    const user = getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const allowed = ["name", "role", "homeCity", "workCity", "bio", "industry",
                     "jobDescription", "yearsOfExperience", "salaryMin", "salaryMax", "skills"] as const;
    for (const key of allowed) {
      if (req.body[key] !== undefined) (user as any)[key] = req.body[key];
    }
    res.json(user);
  });

  // ── Discovery ───────────────────────────────────────────────────────────
  app.get("/api/discovery", (req, res) => {
    const currentUser = getCurrentUser(req);
    const allUsers = Array.from(users.values());
    if (!currentUser) return res.json(allUsers.filter(u => u.id !== "1"));
    const seen = new Set([...currentUser.likes, ...currentUser.dislikes, currentUser.id]);
    res.json(allUsers.filter(u => !seen.has(u.id)));
  });

  // ── Swipe ───────────────────────────────────────────────────────────────
  app.post("/api/swipe", (req, res) => {
    const currentUser = getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const { targetId, direction } = req.body;
    const targetUser = users.get(targetId);
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    if (direction === "right") {
      currentUser.likes.push(targetId);
      if (targetUser.likes.includes(currentUser.id)) {
        currentUser.matches.push(targetId);
        targetUser.matches.push(currentUser.id);
        getOrCreateConversation(currentUser.id, targetId);
        return res.json({ match: true, user: targetUser });
      }
    } else {
      currentUser.dislikes.push(targetId);
    }
    res.json({ match: false });
  });

  // ── Users ────────────────────────────────────────────────────────────────
  app.get("/api/users/:id", (req, res) => {
    const user = users.get(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  // ── Conversations ────────────────────────────────────────────────────────
  app.get("/api/conversations", (req, res) => {
    const user = getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const result = Array.from(conversations.values()).filter(c =>
      c.participantIds.includes(user.id)
    );
    res.json(result);
  });

  app.post("/api/conversations/:id/messages", (req, res) => {
    const user = getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const conv = conversations.get(req.params.id);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });
    if (!conv.participantIds.includes(user.id)) return res.status(403).json({ error: "Forbidden" });

    const msg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      conversationId: conv.id,
      senderId: user.id,
      text: req.body.text,
      timestamp: Date.now(),
    };
    conv.messages.push(msg);
    res.json(msg);
  });

  // ── Auth ─────────────────────────────────────────────────────────────────
  app.post("/api/auth/mock", (req, res) => {
    const mockId = "mock_" + Math.random().toString(36).substring(7);
    const newUser: JobSwapProfile = {
      id: mockId,
      name: "Demo Professional",
      email: "demo@example.com",
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${mockId}`,
      role: "Senior Software Engineer",
      industry: "HealthTech",
      homeCity: "San Francisco",
      workCity: "San Jose",
      bio: "Software developer looking to reduce my carbon footprint by working closer to home!",
      salaryMin: 130000,
      salaryMax: 165000,
      yearsOfExperience: 5,
      jobDescription: "Full-stack engineer building patient-facing products.",
      skills: ["React", "TypeScript", "Node.js"],
      likes: [],
      dislikes: [],
      matches: [],
    };

    // Seed users like the mock user so matches can happen on first swipe
    seedUsers.forEach(u => {
      if (!u.likes.includes(mockId)) u.likes.push(mockId);
    });

    users.set(newUser.id, newUser);

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET);
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ success: true, user: newUser });
  });

  app.get("/api/auth/url", (req, res) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${APP_URL}/auth/callback`;
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId || "placeholder_client_id",
      redirect_uri: redirectUri,
      state: "random_state_string",
      scope: "openid profile email",
    });
    res.json({ url: `https://www.linkedin.com/oauth/v2/authorization?${params}` });
  });

  app.get("/auth/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");
    try {
      const mockId = "linkedin_" + Math.random().toString(36).substring(7);
      const newUser: JobSwapProfile = {
        id: mockId,
        name: "New User",
        email: "user@example.com",
        picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=New",
        role: "Software Engineer",
        homeCity: "San Francisco",
        workCity: "San Jose",
        bio: "Just joined JobSwap!",
        likes: [],
        dislikes: [],
        matches: [],
      };
      if (!users.has(newUser.id)) users.set(newUser.id, newUser);
      const token = jwt.sign({ id: newUser.id }, JWT_SECRET);
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.send(`<html><body><script>
        if (window.opener) { window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*'); window.close(); }
        else { window.location.href = '/'; }
      </script><p>Authentication successful.</p></body></html>`);
    } catch (error) {
      console.error("LinkedIn Auth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.post("/api/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  // ── Vite / Static ─────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JobSwap server running on http://localhost:${PORT}`);
  });
}

startServer();
