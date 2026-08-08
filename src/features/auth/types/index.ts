export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
}

export interface Session {
  access_token: string;
}
