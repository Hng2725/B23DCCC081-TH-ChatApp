import React, { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useAuth } from '../../context/AuthContext';
import { markAllNotificationsRead, markNotificationRead, subscribeToNotifications, subscribeToUsers } from '../../services/chatService';
import type { ChatNotification, UserProfile } from '../../types/chat';
import Colors from '../../theme/colors';

export default function NotificationScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [items, setItems] = useState<ChatNotification[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  useEffect(() => {
    if (!user) return;
    const stopNotifications = subscribeToNotifications(user.uid, setItems);
    const stopUsers = subscribeToUsers(setUsers);
    return () => { stopNotifications(); stopUsers(); };
  }, [user]);
  const unread = items.filter(item => !item.readAt).length;
  const content = (item: ChatNotification) => {
    const actor = users.find(candidate => candidate.uid === item.actorId)?.displayName || 'Một người dùng';
    if (item.type === 'group_invite') return `${actor} đã thêm bạn vào nhóm chat.`;
    if (item.type === 'reaction') return `${actor} đã thả cảm xúc vào tin nhắn của bạn.`;
    return `${actor} đã gửi tin nhắn mới.`;
  };
  const open = async (item: ChatNotification) => {
    if (!user) return;
    try { if (!item.readAt) await markNotificationRead(user.uid, item.id); }
    catch { Alert.alert('Không đánh dấu được thông báo', 'Hãy kiểm tra kết nối mạng.'); }
    navigation.navigate('Chatbox', { chatId: item.chatId });
  };
  const markAll = async () => {
    if (!user) return;
    try { await markAllNotificationsRead(user.uid, items); }
    catch { Alert.alert('Không đánh dấu được thông báo', 'Hãy kiểm tra kết nối mạng.'); }
  };
  return <SafeAreaView style={styles.page}>
    <View style={styles.header}><AntDesign name="notification" size={20} color={Colors.primary} /><View style={styles.headerInfo}><Text style={styles.title}>Thông báo</Text><Text style={styles.count}>{unread} chưa đọc</Text></View>
      {unread > 0 && <TouchableOpacity onPress={markAll}><Text style={styles.markAll}>Đánh dấu tất cả đã đọc</Text></TouchableOpacity>}
    </View>
    <FlatList data={items} keyExtractor={item => item.id} ListEmptyComponent={<Text style={styles.empty}>Không có thông báo nào</Text>}
      renderItem={({ item }) => <TouchableOpacity onPress={() => open(item)} style={[styles.item, !item.readAt && styles.unread]}>
        <AntDesign name={item.type === 'reaction' ? 'hearto' : item.type === 'group_invite' ? 'team' : 'message1'} size={22} color={Colors.primary} />
        <View style={styles.body}><Text style={styles.content}>{content(item)}</Text><Text style={styles.time}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text></View>
        {!item.readAt && <View style={styles.dot} />}
      </TouchableOpacity>} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: Colors.border },
  headerInfo: { flex: 1, marginLeft: 8 },
  title: { fontSize: 21, fontWeight: 'bold', color: Colors.textPrimary },
  count: { color: Colors.textSecondary, fontSize: 12 },
  markAll: { color: Colors.primary, fontSize: 12 },
  item: { backgroundColor: Colors.white, flexDirection: 'row', padding: 14, borderBottomWidth: 1, borderColor: Colors.border },
  unread: { backgroundColor: Colors.primaryLight },
  body: { flex: 1, marginLeft: 12 },
  content: { color: Colors.textPrimary, fontSize: 14 },
  time: { color: Colors.textSecondary, fontSize: 11, marginTop: 5 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.unread },
  empty: { textAlign: 'center', color: Colors.textSecondary, marginTop: 55 },
});
