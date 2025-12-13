import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    doc, 
    setDoc, 
    updateDoc, 
    serverTimestamp, 
    getDocs,
    limit,
    Timestamp 
  } from 'firebase/firestore';
  import { db } from '@/config/firebase';
  import { Chat, ChatMessage } from '@/types/chat';
  import { UserProfile } from '@/types/user';
  import { incrementPatientCount, updateUserProfile } from './user';
  
  // Create or Get a Chat between two users
  export const createOrGetChat = async (currentUser: UserProfile, otherUser: UserProfile): Promise<string> => {
    try {
      // 1. Check if chat already exists
      const chatsRef = collection(db, 'chats');
      // Note: Firestore doesn't support array-contains-all for multiple values in a single query efficiently without specific indexing.
      // A common workaround for 1:1 chats is to store a unique "chatId" constructed from sorted UIDs, 
      // OR query for chats where user is a participant and then filter client-side (or use a composite key if possible).
      
      // Simpler approach for now: Query chats where currentUser is a participant
      const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const existingChat = querySnapshot.docs.find(doc => {
          const data = doc.data();
          return data.participants.includes(otherUser.uid);
      });
  
      if (existingChat) {
        return existingChat.id;
      }
  
      // 2. Create new chat
      const newChatData = {
        participants: [currentUser.uid, otherUser.uid],
        participantInfo: [
          { uid: currentUser.uid, displayName: currentUser.displayName, photoURL: currentUser.photoURL || null },
          { uid: otherUser.uid, displayName: otherUser.displayName, photoURL: otherUser.photoURL || null }
        ],
        updatedAt: Date.now(),
        createdAt: Date.now(),
      };
  
      const docRef = await addDoc(chatsRef, newChatData);
      
      // 3. New Connection Logic
      // If we are connecting to a doctor, increment their patient count and link them
      if (otherUser.role === 'doctor' && currentUser.role === 'patient') {
          await incrementPatientCount(otherUser.uid);
          // Link patient to doctor for reporting
          await updateUserProfile(currentUser.uid, { linkedDoctorId: otherUser.uid });
      }

      return docRef.id;
  
    } catch (error) {
      console.error('Error creating/getting chat:', error);
      throw error;
    }
  };
  

  
  // Subscribe to list of chats for a user
  export const subscribeToChats = (uid: string, callback: (chats: Chat[]) => void) => {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef, 
      where('participants', 'array-contains', uid),
      orderBy('updatedAt', 'desc')
    );
  
    return onSnapshot(q, (snapshot) => {
      const chats: Chat[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Chat));
      callback(chats);
    });
  };
  
  // Subscribe to messages in a specific chat
  export const subscribeToMessages = (chatId: string, callback: (messages: ChatMessage[]) => void, onError?: (error: Error) => void) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));
  
    return onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      } as ChatMessage));
      callback(messages);
    }, (error) => {
      console.error("Error subscribing to messages:", error);
      if (onError) onError(error);
    });
  };
  
  // Send a message
  export const sendMessage = async (chatId: string, payload: { text: string; type: 'text' | 'file'; file?: any }, sender: UserProfile) => {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const chatRef = doc(db, 'chats', chatId);
      const timestamp = Date.now();
  
      const newMessage: any = {
        text: payload.text,
        type: payload.type || 'text',
        createdAt: timestamp,
        user: {
          _id: sender.uid,
          name: sender.displayName,
          avatar: sender.photoURL || null,
        }
      };

      if (payload.type === 'file' && payload.file) {
          newMessage.file = payload.file;
      }
  
      // 1. Add message to subcollection
      await addDoc(messagesRef, newMessage);
  
      // 2. Update parent chat with last message
      // Don't store full file content in lastMessage to save bandwidth on list view
      const lastMessageData = { ...newMessage };
      if (lastMessageData.type === 'file') {
          delete lastMessageData.file; // Remove heavy content
          lastMessageData.text = '📎 Medical Report'; // Placeholder text
      }

      await updateDoc(chatRef, {
        lastMessage: lastMessageData,
        updatedAt: timestamp
      });
  
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
