import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import axios from "axios";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { User, JobSwapProfile } from "./src/types";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "jobswap-secret-key";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

// Mock Database
const users: Map<string, JobSwapProfile> = new Map();

// Seed some initial data for demo
const seedUsers: JobSwapProfile[] = [
  {
    id: "1",
    name: "Alex Rivera",
    role: "Senior Software Engineer",
    homeCity: "San Francisco",
    workCity: "San Jose",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    bio: "Love building scalable systems. Tired of the 101 commute. Looking to swap my SF-based role for something in SJ!",
    likes: [],
    dislikes: [],
    matches: [],
  },
  {
    id: "2",
    name: "Jordan Smith",
    role: "Senior Software Engineer",
    homeCity: "San Jose",
    workCity: "San Francisco",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
    bio: "SJ native, working in the city. The Caltrain life is getting old. Anyone in SF want to swap for a great role in SJ?",
    likes: [],
    dislikes: [],
    matches: [],
  },
  {
    id: "3",
    name: "Taylor Chen",
    role: "Product Manager",
    homeCity: "Oakland",
    workCity: "Palo Alto",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor",
    bio: "PM at a Series B startup. Love the mission, hate the bridge traffic.",
    likes: [],
    dislikes: [],
    matches: [],
  },
  {
    id: "4",
    name: "Casey Morgan",
    role: "Product Manager",
    homeCity: "Palo Alto",
    workCity: "Oakland",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Casey",
    bio: "Living in the peninsula, working in the east bay. Let's make our lives easier!",
    likes: [],
    dislikes: [],
    matches: [],
  },
];

seedUsers.forEach(u => users.set(u.id, u));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Helper to get current user from token
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

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "JobSwap API is active" });
  });

  app.get("/api/me", (req, res) => {
    const user = getCurrentUser(req);
    res.json(user);
  });

  // Fetch potential matches
  app.get("/api/discovery", (req, res) => {
    const currentUser = getCurrentUser(req);
    const allUsers = Array.from(users.values());
    
    // If not logged in, show all seed data for demo
    if (!currentUser) {
      return res.json(allUsers.filter(u => u.id !== "1")); 
    }

    // Filter out seen users and self
    const seen = new Set([...currentUser.likes, ...currentUser.dislikes, currentUser.id]);
    const discovery = allUsers.filter(u => !seen.has(u.id));
    
    res.json(discovery);
  });

  app.post("/api/swipe", (req, res) => {
    const currentUser = getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const { targetId, direction } = req.body;
    const targetUser = users.get(targetId);
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    if (direction === "right") {
      currentUser.likes.push(targetId);
      // Check for match
      if (targetUser.likes.includes(currentUser.id)) {
        currentUser.matches.push(targetId);
        targetUser.matches.push(currentUser.id);
        return res.json({ match: true, user: targetUser });
      }
    } else {
      currentUser.dislikes.push(targetId);
    }

    res.json({ match: false });
  });

  // LinkedIn OAuth Routes
  app.post("/api/auth/mock", (req, res) => {
    const mockId = "mock_" + Math.random().toString(36).substring(7);
    const newUser: JobSwapProfile = {
      id: mockId,
      name: "Demo Professional",
      email: "demo@example.com",
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${mockId}`,
      role: "Senior Software Engineer",
      homeCity: "San Francisco",
      workCity: "San Jose",
      bio: "Software developer looking to reduce my carbon footprint by working closer to home in SF!",
      likes: [],
      dislikes: [],
      matches: [],
    };

    // Make the seed users like the mock user so matches are possible
    seedUsers.forEach(u => {
      if (!u.likes.includes(mockId)) u.likes.push(mockId);
    });

    users.set(newUser.id, newUser);

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET);
    res.cookie("token", token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: "none" 
    });

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

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    res.json({ url: authUrl });
  });

  app.get("/auth/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    try {
      // In a real app with real credentials:
      /*
      const tokenResponse = await axios.post("https://www.linkedin.com/oauth/v2/accessToken", 
        new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          redirect_uri: `${APP_URL}/auth/callback`,
        }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const { access_token } = tokenResponse.data;
      const userResponse = await axios.get("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const linkedinUser = userResponse.data;
      */

      // Simulated user for demo purposes if credentials are placeholders
      const mockId = "linkedin_" + Math.random().toString(36).substring(7);
      const newUser: JobSwapProfile = {
        id: mockId,
        name: "New User", // would come from linkedinUser.name
        email: "user@example.com",
        picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=New",
        role: "Software Engineer",
        homeCity: "San Francisco",
        workCity: "San Jose",
        bio: "Just joined JobSwap! Looking for a change.",
        likes: [],
        dislikes: [],
        matches: [],
      };

      if (!users.has(newUser.id)) {
        users.set(newUser.id, newUser);
      }

      const token = jwt.sign({ id: newUser.id }, JWT_SECRET);
      res.cookie("token", token, { 
        httpOnly: true, 
        secure: true, 
        sameSite: "none" 
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("LinkedIn Auth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.post("/api/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/users/:id", (req, res) => {
    const user = users.get(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JobSwap server running on http://localhost:${PORT}`);
  });
}

startServer();
