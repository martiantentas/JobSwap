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
}

export interface JobSwapProfile extends User {
  likes: string[]; // IDs of users this user liked
  dislikes: string[]; // IDs of users this user disliked
  matches: string[]; // IDs of users matched with
}

export interface Match {
  id: string;
  users: [string, string];
  timestamp: number;
}
