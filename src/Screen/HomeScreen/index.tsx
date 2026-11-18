import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Colors from '../../theme/colors';
import {
  subscribeToConversations,
  subscribeToLastMessage,
  subscribeToMessages,
  subscribeToUsers,
} from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import type {
  ChatMessage,
  ConversationSummary,
  UserProfile,
} from '../../types/chat';
import { messagePreview, partnerIdFromChatId } from '../../utils/chat';

const timeLabel = (value: number) =>
  value
    ? new Date(value).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [lastMessages, setLastMessages] = useState<
    Record<string, ChatMessage | null>
  >({});
  useEffect(() => {
    if (!user) return;
    const stopConversations = subscribeToConversations(
      user.uid,
      setConversations,
    );
    const stopUsers = subscribeToUsers(setUsers);
    return () => {
      stopConversations();
      stopUsers();
    };
  }, [user]);
  useEffect(() => {
    const stops = conversations.map(item =>
      item.lastMessageId
        ? subscribeToLastMessage(item.chatId, item.lastMessageId, message =>
            setLastMessages(previous => ({
              ...previous,
              [item.chatId]: message,
            })),
          )
        : subscribeToMessages(item.chatId, messages =>
            setLastMessages(previous => ({
              ...previous,
              [item.chatId]: messages[messages.length - 1] || null,
            })),
          ),
    );
    return () => stops.forEach(stop => stop());
  }, [conversations]);
  const items = useMemo(
    () =>
      conversations
        .map(item => {
          const isGroup =
            item.kind === 'group' || item.chatId.startsWith('group-');
          const partnerId = isGroup
            ? undefined
            : item.partnerId ||
              (user ? partnerIdFromChatId(item.chatId, user.uid) : undefined);
          const partner = users.find(candidate => candidate.uid === partnerId);
          const title = isGroup
            ? item.groupName || 'Nhóm'
            : partner?.displayName || 'Tài khoản không có hồ sơ';
          const latest = lastMessages[item.chatId];
          const preview =
            (latest
              ? messagePreview(latest)
              : messagePreview({
                  type: item.lastMessageType || 'text',
                  text: item.lastMessage || '',
                })) || 'Chưa có tin nhắn';
          return { ...item, partnerId, partner, title, preview, isGroup };
        })
        .filter(
          item =>
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            (item.partnerId || '').toLowerCase().includes(search.toLowerCase()),
        ),
    [conversations, users, lastMessages, search, user],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <AntDesign name="message1" size={20} color={Colors.primary} />
        <Text style={styles.headerTitle}>Đoạn chat</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateGroup')}
          accessibilityLabel="Tạo nhóm"
        >
          <AntDesign name="addusergroup" size={23} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.search}>
        <AntDesign name="search1" size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm cuộc trò chuyện..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={item => item.chatId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Chưa có cuộc trò chuyện nào</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              navigation.navigate('Chatbox', {
                chatId: item.chatId,
                partnerId: item.partnerId,
              })
            }
          >
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor:
                    !item.isGroup && !item.partner
                      ? Colors.offline
                      : item.partner?.avatarColor || Colors.primary,
                },
              ]}
            >
              <Text style={styles.avatarText}>
                {!item.isGroup && !item.partner ? '?' : item.title.charAt(0)}
              </Text>
              {!item.isGroup && (
                <View
                  testID="presence-dot"
                  accessible
                  accessibilityLabel={
                    item.partner?.online ? 'Đang hoạt động' : 'Không hoạt động'
                  }
                  style={[
                    styles.onlineDot,
                    item.partner?.online
                      ? styles.onlineDotActive
                      : styles.onlineDotInactive,
                  ]}
                />
              )}
            </View>
            <View style={styles.info}>
              <View style={styles.row}>
                <Text style={styles.name}>{item.title}</Text>
                <Text style={styles.time}>{timeLabel(item.lastMessageAt)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.preview}
                </Text>
                {item.unreadCount > 0 && (
                  <View
                    testID="unread-dot"
                    accessible
                    accessibilityLabel="Có tin nhắn chưa đọc"
                    style={styles.unreadDot}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  search: {
    margin: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: { flex: 1, marginLeft: 8, color: Colors.textPrimary },
  list: { paddingBottom: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontSize: 20, fontWeight: 'bold' },
  onlineDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  onlineDotActive: { backgroundColor: Colors.online },
  onlineDotInactive: { backgroundColor: Colors.offline },
  info: { flex: 1, marginLeft: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: { flex: 1, fontWeight: '600', fontSize: 15, color: Colors.textPrimary },
  time: { fontSize: 12, color: Colors.textSecondary },
  preview: { flex: 1, fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.unread,
    marginTop: 4,
    marginLeft: 8,
  },
  empty: { textAlign: 'center', color: Colors.textSecondary, marginTop: 60 },
});
