export interface ChatMessage {
  _id: string;
  text: string;
  createdAt: number;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  type?: 'text' | 'file'; // Message type
  file?: {
      content: string; // Base64 content
      name: string;
      mimeType: string;
      size?: number;
  };
}

export interface Chat {
  id: string;
  participants: string[]; // Array of UIDs
  participantInfo: {
    uid: string;
    displayName: string;
    photoURL?: string;
  }[];
  lastMessage?: {
    text: string;
    createdAt: number;
    user: {
        _id: string;
        name: string;
    };
    type?: 'text' | 'file';
  };
  updatedAt: number;
}
