import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Colors from '../../theme/colors';
import { createGroup, subscribeToUsers } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import type { UserProfile } from '../../types/chat';
import { validGroupMembers } from '../../utils/chat';

export default function CreateGroupScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => subscribeToUsers(setUsers), []);
  const contacts = useMemo(() => users.filter(item => item.uid !== user?.uid && item.displayName.toLowerCase().includes(search.toLowerCase())), [users, user, search]);
  const ready = !!user && !!name.trim() && validGroupMembers(user.uid, selected) && !busy;
  const toggle = (uid: string) => setSelected(previous => previous.includes(uid) ? previous.filter(id => id !== uid) : [...previous, uid]);
  const submit = async () => {
    if (!user || !ready) return;
    setBusy(true);
    try {
      const chatId = await createGroup(user.uid, name, selected);
      navigation.replace('Chatbox', { chatId });
    } catch (error) { Alert.alert('Không tạo được nhóm', String(error)); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.page}>
    <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><AntDesign name="arrowleft" size={22} color={Colors.primary} /></TouchableOpacity><Text style={styles.title}>Tạo nhóm</Text></View>
    <TextInput style={styles.input} placeholder="Tên nhóm" value={name} onChangeText={setName} maxLength={80} />
    <TextInput style={styles.input} placeholder="Tìm trong danh bạ" value={search} onChangeText={setSearch} />
    <Text style={styles.hint}>Chọn ít nhất 2 người ({selected.length} đã chọn)</Text>
    <FlatList data={contacts} keyExtractor={item => item.uid} renderItem={({ item }) => <TouchableOpacity style={styles.contact} onPress={() => toggle(item.uid)}>
      <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}><Text style={styles.avatarText}>{item.displayName.charAt(0)}</Text></View>
      <Text style={styles.contactName}>{item.displayName}</Text>
      <AntDesign name={selected.includes(item.uid) ? 'checksquare' : 'checksquareo'} size={22} color={Colors.primary} />
    </TouchableOpacity>} />
    <TouchableOpacity style={[styles.button, !ready && styles.disabled]} disabled={!ready} onPress={submit}><Text style={styles.buttonText}>{busy ? 'Đang tạo...' : 'Tạo nhóm'}</Text></TouchableOpacity>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.white, padding: 16, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginLeft: 16, color: Colors.textPrimary },
  input: { backgroundColor: Colors.white, borderColor: Colors.border, borderWidth: 1, borderRadius: 9, marginHorizontal: 14, marginTop: 12, paddingHorizontal: 12, color: Colors.textPrimary },
  hint: { color: Colors.textSecondary, margin: 14 },
  contact: { backgroundColor: Colors.white, padding: 12, flexDirection: 'row', alignItems: 'center', borderBottomColor: Colors.border, borderBottomWidth: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontWeight: 'bold' },
  contactName: { flex: 1, color: Colors.textPrimary, marginLeft: 12 },
  button: { backgroundColor: Colors.primary, margin: 14, padding: 14, borderRadius: 8, alignItems: 'center' },
  disabled: { opacity: 0.45 },
  buttonText: { color: Colors.white, fontWeight: 'bold' },
});
