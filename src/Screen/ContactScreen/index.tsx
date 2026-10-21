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
import { contacts } from '../../data/mockData';
import Colors from '../../theme/colors';

type Contact = {
  id: string;
  name: string;
  avatarColor: string;
  isOnline: boolean;
};

function ContactScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const renderItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('Chatbox', { name: item.name, avatarColor: item.avatarColor })}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        <View style={[styles.statusDot, { backgroundColor: item.isOnline ? Colors.online : Colors.offline }]} />
      </View>

      {/* Thông tin */}
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.statusRow}>
          <AntDesign
            name={item.isOnline ? 'checkcircle' : 'minuscircle'}
            size={12}
            color={item.isOnline ? Colors.online : Colors.offline}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.status, { color: item.isOnline ? Colors.online : Colors.textSecondary }]}>
            {item.isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
          </Text>
        </View>
      </View>

      {/* Nút nhắn tin */}
      <TouchableOpacity
        style={styles.chatBtn}
        onPress={() => navigation.navigate('Chatbox', { name: item.name, avatarColor: item.avatarColor })}
      >
        <AntDesign name="message1" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <AntDesign name="team" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
        <Text style={styles.headerTitle}>Danh bạ</Text>
        <Text style={styles.headerCount}>{contacts.length} người</Text>
      </View>

      {/* Tìm kiếm */}
      <View style={styles.searchContainer}>
        <AntDesign name="search1" size={16} color={Colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm danh bạ..."
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
            <AntDesign name="userdeleteo" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>Không tìm thấy người dùng</Text>
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
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, flex: 1 },
  headerCount: { fontSize: 14, color: Colors.textSecondary },
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
  statusDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.white,
  },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  status: { fontSize: 13 },
  chatBtn: { padding: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: Colors.textSecondary, marginTop: 12, fontSize: 14 },
});

export default ContactScreen;
