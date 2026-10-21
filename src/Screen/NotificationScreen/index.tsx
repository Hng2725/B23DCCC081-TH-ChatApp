import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { notifications as initialNotifications } from '../../data/mockData';
import Colors from '../../theme/colors';

type Notification = {
  id: string;
  content: string;
  time: string;
  isRead: boolean;
};

function NotificationScreen() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={[styles.item, !item.isRead && styles.itemUnread]}>
      {/* Icon thông báo */}
      <View style={[styles.iconWrap, { backgroundColor: item.isRead ? Colors.border : Colors.primaryLight }]}>
        <AntDesign
          name={item.isRead ? 'bells' : 'notification'}
          size={20}
          color={item.isRead ? Colors.textSecondary : Colors.primary}
        />
      </View>

      {/* Nội dung */}
      <View style={styles.content}>
        <Text style={[styles.contentText, !item.isRead && styles.contentTextBold]}>
          {item.content}
        </Text>
        <View style={styles.timeRow}>
          <AntDesign name="clockcircleo" size={11} color={Colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={styles.timeText}>{item.time}</Text>
        </View>

        {!item.isRead && (
          <TouchableOpacity style={styles.readBtn} onPress={() => markAsRead(item.id)}>
            <AntDesign name="checkcircleo" size={13} color={Colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.readBtnText}>Đánh dấu đã đọc</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chấm chưa đọc */}
      {!item.isRead && <View style={styles.unreadDot} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <AntDesign name="notification" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>{unreadCount} chưa đọc</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <AntDesign name="checksquareo" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.markAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Danh sách */}
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AntDesign name="bells" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>Không có thông báo nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary },
  unreadCount: { fontSize: 13, color: Colors.primary, marginTop: 2 },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: Colors.primaryLight, borderRadius: 6,
  },
  markAllText: { color: Colors.primary, fontSize: 13, fontWeight: '500' },
  list: { paddingBottom: 16 },
  item: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.white,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  itemUnread: { backgroundColor: Colors.primaryLight },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  content: { flex: 1 },
  contentText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  contentTextBold: { fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeText: { fontSize: 12, color: Colors.textSecondary },
  readBtn: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 8, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.primary, borderRadius: 4,
  },
  readBtnText: { color: Colors.primary, fontSize: 12 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary, marginTop: 6, marginLeft: 4,
  },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: Colors.textSecondary, marginTop: 12, fontSize: 14 },
});

export default NotificationScreen;
