import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { sampleMessages } from '../../data/mockData';
import Colors from '../../theme/colors';

type Message = {
  id: string;
  text: string;
  isMine: boolean;
  time: string;
};

function Chatbox() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { name = 'Người dùng', avatarColor = Colors.primary } = route.params || {};

  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      text,
      isMine: true,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.isMine ? styles.rowRight : styles.rowLeft]}>
      {!item.isMine && (
        <View style={[styles.miniAvatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.miniAvatarText}>{name.charAt(0)}</Text>
        </View>
      )}
      <View style={[styles.bubble, item.isMine ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, item.isMine ? styles.textMe : styles.textOther]}>
          {item.text}
        </Text>
        <Text style={[styles.timeText, item.isMine ? styles.timeMe : styles.timeOther]}>
          {item.time}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AntDesign name="arrowleft" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={[styles.headerAvatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.headerAvatarText}>{name.charAt(0)}</Text>
        </View>
        <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
        <AntDesign name="phone" size={20} color={Colors.primary} style={{ marginLeft: 8 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Danh sách tin nhắn */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Ô nhập tin nhắn */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={Colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <AntDesign name="arrowright" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  headerAvatarText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
  headerName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  messageList: { padding: 12, paddingBottom: 8 },
  messageRow: { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  miniAvatar: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 6,
  },
  miniAvatarText: { color: Colors.white, fontSize: 12, fontWeight: 'bold' },
  bubble: { maxWidth: '72%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMe: { backgroundColor: Colors.bubbleMe, borderBottomRightRadius: 4 },
  bubbleOther: {
    backgroundColor: Colors.white, borderBottomLeftRadius: 4,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  textMe: { color: Colors.white },
  textOther: { color: Colors.textPrimary },
  timeText: { fontSize: 10, marginTop: 4 },
  timeMe: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  timeOther: { color: Colors.textSecondary },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 10, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  textInput: {
    flex: 1, minHeight: 40, maxHeight: 100,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.inputBg,
  },
  sendBtn: {
    marginLeft: 8, backgroundColor: Colors.primary,
    borderRadius: 20, width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
});

export default Chatbox;
