import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, ActivityIndicator, TextInput, Alert, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/auth';
import { subscribeToChats, createOrGetChat } from '@/services/chat';
import { getUserByDoctorCode } from '@/services/user';
import { Chat } from '@/types/chat';

export default function ChatScreen() {
  const { user, userProfile } = useAuth(); // Assuming userProfile is available in AuthContext
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;
  // @ts-ignore
  const primaryColor = Colors[theme].primary;
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Doctor Logic
  const [showAddInput, setShowAddInput] = useState(false);
  const [doctorCode, setDoctorCode] = useState('');
  const [addingDoctor, setAddingDoctor] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToChats(user.uid, (data) => {
      setChats(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddDoctor = async () => {
      if (!doctorCode.trim()) return;
      
      setAddingDoctor(true);
      Keyboard.dismiss();
      try {
          const doctor = await getUserByDoctorCode(doctorCode.trim().toUpperCase());
          if (!doctor) {
              Alert.alert('Not Found', 'No doctor found with this code.');
              setAddingDoctor(false);
              return;
          }
          
          if (!userProfile) { 
              setAddingDoctor(false);
              return; 
          }

          const chatId = await createOrGetChat(userProfile, doctor);
          setDoctorCode('');
          setShowAddInput(false);
          router.push({ pathname: '/chat/[id]', params: { id: chatId } });
      } catch (error) {
          Alert.alert('Error', 'Failed to add doctor.');
      } finally {
          setAddingDoctor(false);
      }
  };

  const getOtherParticipant = (chat: Chat) => {
    return chat.participantInfo.find(p => p.uid !== user?.uid) || chat.participantInfo[0];
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    
    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: Chat }) => {
    const otherParticipant = getOtherParticipant(item);
    
    return (
      <TouchableOpacity 
        style={styles.chatItem} 
        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}>
        <Image 
            source={{ uri: otherParticipant?.photoURL || 'https://i.pravatar.cc/150' }} 
            style={styles.avatar}
            contentFit="cover"
        />
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <ThemedText type="defaultSemiBold" style={styles.name}>
              {otherParticipant?.displayName || 'Unknown User'}
            </ThemedText>
            <ThemedText style={styles.time}>{formatTime(item.lastMessage?.createdAt)}</ThemedText>
          </View>
          <View style={styles.messageContainer}>
            <ThemedText numberOfLines={1} style={styles.message}>
              {item.lastMessage?.text || 'No messages yet'}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
      return (
          <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={Colors[theme].tint} />
          </ThemedView>
      );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Messages</ThemedText>
        {userProfile?.role === 'patient' && (
            <TouchableOpacity onPress={() => setShowAddInput(!showAddInput)}>
                <IconSymbol name={showAddInput ? "minus" : "plus"} size={24} color={iconColor} />
            </TouchableOpacity>
        )}
      </View>
      
      {showAddInput && (
          <View style={styles.addDoctorContainer}>
              <ThemedText style={styles.addDoctorTitle}>Start a new chat</ThemedText>
              <View style={styles.inputRow}>
                  <TextInput
                      style={[styles.input, { color: Colors[theme].text, borderColor: Colors[theme].icon + '40' }]}
                      placeholder="Enter Doctor Code"
                      placeholderTextColor={Colors[theme].icon + '80'}
                      value={doctorCode}
                      onChangeText={setDoctorCode}
                      autoCapitalize="characters"
                  />
                  <TouchableOpacity 
                    style={[styles.addButton, { backgroundColor: primaryColor }]}
                    onPress={handleAddDoctor}
                    disabled={addingDoctor}>
                      {addingDoctor ? (
                          <ActivityIndicator size="small" color="white" />
                      ) : (
                          <ThemedText style={styles.addButtonText}>Chat</ThemedText>
                      )}
                  </TouchableOpacity>
              </View>
          </View>
      )}
      
      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
            <IconSymbol name="message.fill" size={48} color={Colors[theme].icon + '40'} />
            <ThemedText style={styles.emptyText}>No conversations yet.</ThemedText>
            <ThemedText style={styles.emptySubText}>
                {userProfile?.role === 'patient' 
                    ? 'Tap + to add a doctor by their code.' 
                    : 'Share your code with patients.'}
            </ThemedText>
        </View>
      ) : (
        <FlatList
            data={chats}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: Colors[theme].icon + '20' }]} />}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60, // Adjust for status bar
    paddingBottom: 20,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#ccc',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
  },
  time: {
    fontSize: 12,
    opacity: 0.6,
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
    opacity: 0.7,
    marginRight: 10,
  },
  separator: {
    height: 1,
    marginLeft: 65, // Offset by avatar width + margin
  },
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: -50, // Visual balance
      gap: 10
  },
  emptyText: {
      fontSize: 18,
      fontWeight: '600',
      opacity: 0.7
  },
  emptySubText: {
      fontSize: 14,
      opacity: 0.5
  },
  addDoctorContainer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(150,150,150,0.1)'
  },
  addDoctorTitle: {
      fontSize: 14,
      marginBottom: 8,
      opacity: 0.7
  },
  inputRow: {
      flexDirection: 'row',
      gap: 10,
      height: 44
  },
  input: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 16
  },
  addButton: {
      paddingHorizontal: 20,
      justifyContent: 'center',
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center'
  },
  addButtonText: {
      color: 'white',
      fontWeight: 'bold'
  }
});
