export interface User {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  role: string;
  homeCity: string;
  workCity: string;
  bio?: string;
  linkedinId?: string;
  // Extended profile
  salaryMin?: number;
  salaryMax?: number;
  yearsOfExperience?: number;
  jobDescription?: string;
  skills?: string[];
  industry?: string;
}

export interface JobSwapProfile extends User {
  likes: string[];
  dislikes: string[];
  matches: string[];
}

export interface Match {
  id: string;
  users: [string, string];
  timestamp: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  participantIds: [string, string];
  messages: Message[];
}
