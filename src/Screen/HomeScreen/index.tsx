import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { conversations } from '../../data/mockData';
import Colors from '../../theme/colors';

type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatarColor: string;
  isOnline: boolean;
};

function HomeScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('Chatbox', { name: item.name, avatarColor: item.avatarColor })}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>

      {/* Thông tin */}
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Arrow icon */}
      <AntDesign name="right" size={14} color={Colors.textSecondary} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <AntDesign name="message1" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
        <Text style={styles.headerTitle}>Đoạn chat</Text>
      </View>

      {/* Ô tìm kiếm */}
      <View style={styles.searchContainer}>
        <AntDesign name="search1" size={16} color={Colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm cuộc trò chuyện..."
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <AntDesign name="close" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Danh sách */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AntDesign name="inbox" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>Không tìm thấy cuộc trò chuyện</Text>
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
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 12, marginVertical: 8,
    borderRadius: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, height: 40, fontSize: 14, color: Colors.textPrimary },
  list: { paddingBottom: 16 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  avatarText: { color: Colors.white, fontSize: 20, fontWeight: 'bold' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.online, borderWidth: 2, borderColor: Colors.white,
  },
  info: { flex: 1, marginLeft: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flex: 1, marginRight: 8 },
  time: { fontSize: 12, color: Colors.textSecondary },
  lastMsg: { fontSize: 13, color: Colors.textSecondary, flex: 1, marginRight: 8, marginTop: 3 },
  badge: {
    backgroundColor: Colors.unread, borderRadius: 10,
    minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5, marginTop: 3,
  },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: Colors.textSecondary, marginTop: 12, fontSize: 14 },
});

export default HomeScreen;
