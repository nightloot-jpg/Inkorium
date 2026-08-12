export interface FeedPost {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  content: string;
  kind: 'music' | 'text' | 'photo';
  title?: string;
  subtitle?: string;
  duration?: string;
  image?: string;
  likes: number;
  liked: boolean;
  comments: number;
  shares: number;
}

export interface CreateFeedPostInput {
  content: string;
  kind: 'text' | 'photo';
}
