import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Linking, Modal, PermissionsAndroid, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { launchCamera, launchImageLibrary, type Asset } from 'react-native-image-picker';
import Clipboard from '@react-native-clipboard/clipboard';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Colors from '../../theme/colors';
import { markConversationAsRead, openDirectConversation, reactToMessage, recallMessage, sendChatImageMessage, sendChatLocationMessage, sendChatTextMessage, subscribeToConversation, subscribeToConversations, subscribeToMessages, subscribeToReadState, subscribeToUser, subscribeToUsers } from '../../services/chatService';
import { clearTyping, enterChat, setTyping, watchTyping, watchUserPresence, type Presence } from '../../services/presenceService';
import { uploadImage } from '../../services/imageUploadService';
import { cloudinaryConfig } from '../../config/cloudinary';
import { useAuth } from '../../context/AuthContext';
import type { ChatMessage, Conversation, UserProfile } from '../../types/chat';
import { createChatId, reactionCounts, receiptForMessage } from '../../utils/chat';

const emojis = ['👍', '❤️', '😂', '😮', '😢'];
const imageUploadAvailable = Boolean(cloudinaryConfig.cloudName.trim() && cloudinaryConfig.preset.trim());
const timeLabel = (value: number) => value ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
type Pending = { asset: Asset; url?: string; uploading: boolean; error: boolean };

export default function Chatbox() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const focused = useIsFocused();
  const { user } = useAuth();
  const routePartnerId = route.params?.partnerId as string | undefined;
  const [detectedPartnerId, setDetectedPartnerId] = useState<string>();
  const partnerId = routePartnerId || detectedPartnerId;
  const chatId = (route.params?.chatId as string | undefined) || (user && partnerId ? createChatId(user.uid, partnerId) : '');
  const [ready, setReady] = useState(!routePartnerId);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [presence, setPresence] = useState<Record<string, Presence>>({});
  const [typingIds, setTypingIds] = useState<string[]>([]);
  const [readAt, setReadAt] = useState<Record<string, number>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const [menuMessage, setMenuMessage] = useState<ChatMessage | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [, tick] = useState(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!user || !partnerId) return;
    let active = true;
    openDirectConversation(user.uid, partnerId).then(() => { if (active) setReady(true); })
      .catch(() => Alert.alert('Không mở được cuộc trò chuyện', 'Hãy kiểm tra kết nối mạng.'));
    return () => { active = false; };
  }, [user, partnerId]);
  useEffect(() => { if (partnerId) return subscribeToUser(partnerId, setPartner); }, [partnerId]);
  useEffect(() => { if (ready && chatId) return subscribeToConversation(chatId, setConversation); }, [ready, chatId]);
  useEffect(() => {
    if (!routePartnerId && conversation?.kind === 'direct' && user) {
      setDetectedPartnerId(Object.keys(conversation.members).find(id => id !== user.uid));
    }
  }, [routePartnerId, conversation, user]);
  useEffect(() => { if (conversation?.kind === 'group') return subscribeToUsers(setUsers); }, [conversation?.kind]);
  useEffect(() => { if (ready && chatId) return subscribeToReadState(chatId, setReadAt); }, [ready, chatId]);
  useEffect(() => {
    if (!ready || !chatId || !user || !focused) return;
    const leave = enterChat(user.uid, chatId);
    const stopTypingWatch = watchTyping(chatId, setTypingIds);
    const stopMessages = subscribeToMessages(chatId, next => {
      setMessages(next);
      if (next.some(item => item.senderId !== user.uid)) void markConversationAsRead(user.uid, chatId);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    });
    const stopUnread = subscribeToConversations(user.uid, summaries => {
      if (summaries.find(item => item.chatId === chatId)?.unreadCount) void markConversationAsRead(user.uid, chatId);
    });
    void markConversationAsRead(user.uid, chatId);
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      void clearTyping(user.uid, chatId);
      leave(); stopTypingWatch(); stopMessages(); stopUnread();
    };
  }, [ready, chatId, user, focused]);
  const memberIds = useMemo(() => Object.keys(conversation?.members || {}), [conversation]);
  useEffect(() => {
    const ids = partnerId ? [partnerId] : memberIds;
    const stops = ids.map(id => watchUserPresence(id, next => setPresence(previous => ({ ...previous, [id]: next }))));
    return () => stops.forEach(stop => stop());
  }, [partnerId, memberIds]);
  useEffect(() => { const id = setInterval(() => tick(value => value + 1), 60000); return () => clearInterval(id); }, []);

  const isGroup = conversation?.kind === 'group';
  const onlineCount = memberIds.filter(id => presence[id]?.online).length;
  const someoneTyping = typingIds.filter(id => id !== user?.uid);
  const typingName = users.find(item => item.uid === someoneTyping[0])?.displayName || 'Có người';
  const partnerPresence = partnerId ? presence[partnerId] : undefined;
  const lastSeenMinutes = Math.max(0, Math.floor((Date.now() - (partnerPresence?.lastSeen || partner?.lastSeen || Date.now())) / 60000));
  const subtitle = someoneTyping.length ? (isGroup ? `${typingName} đang soạn tin…` : 'đang soạn tin…')
    : isGroup ? `${onlineCount} thành viên đang online`
    : partnerPresence?.online ? 'Đang hoạt động' : `Hoạt động ${lastSeenMinutes} phút trước`;
  const lastMine = [...messages].reverse().find(item => item.senderId === user?.uid);
  const receipt = lastMine ? receiptForMessage(lastMine, memberIds.length ? memberIds : [user?.uid || '', partnerId || ''], readAt) : { seen: false };

  const stopTyping = () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (user && chatId) void clearTyping(user.uid, chatId);
  };
  const changeInput = (value: string) => {
    setInput(value);
    if (!user || !chatId) return;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (!value.trim()) { void clearTyping(user.uid, chatId); return; }
    void setTyping(user.uid, chatId);
    typingTimer.current = setTimeout(() => void clearTyping(user.uid, chatId), 3000);
  };
  const sendText = async () => {
    if (!user || !input.trim()) return;
    try {
      const sent = await sendChatTextMessage(user.uid, chatId, input);
      if (sent) { setInput(''); stopTyping(); }
    } catch { Alert.alert('Không gửi được tin nhắn', 'Hãy kiểm tra kết nối mạng.'); }
  };
  const sendLocation = async () => {
    if (!user) return;
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) { Alert.alert('Chưa có quyền vị trí', 'Hãy cho phép truy cập vị trí.'); return; }
    }
    Geolocation.getCurrentPosition(
      position => { void sendChatLocationMessage(user.uid, chatId, position.coords.latitude, position.coords.longitude).catch(() => Alert.alert('Không gửi được vị trí', 'Hãy thử lại.')); },
      () => Alert.alert('Không lấy được vị trí', 'Hãy bật GPS và thử lại.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };
  const uploadAndSend = async (asset: Asset, existingUrl?: string) => {
    if (!user) return;
    if (!imageUploadAvailable) {
      setPending(null);
      Alert.alert('Chưa thể gửi ảnh', 'Ứng dụng chưa được cấu hình dịch vụ tải ảnh.');
      return;
    }
    setPending({ asset, url: existingUrl, uploading: true, error: false });
    let url = existingUrl;
    try {
      if (!url) url = await uploadImage(asset, cloudinaryConfig);
      setPending({ asset, url, uploading: true, error: false });
      await sendChatImageMessage(user.uid, chatId, url);
      setPending(null);
    } catch (error) {
      setPending({ asset, url, uploading: false, error: true });
      Alert.alert('Không gửi được ảnh', String(error));
    }
  };
  const pickImage = async (source: 'camera' | 'library') => {
    if (source === 'camera' && Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) { Alert.alert('Không có quyền camera', 'Hãy cấp quyền camera để chụp ảnh.'); return; }
    }
    const options = { mediaType: 'photo' as const, maxWidth: 1024, maxHeight: 1024, selectionLimit: 1 };
    const result = source === 'camera' ? await launchCamera(options) : await launchImageLibrary(options);
    if (result.didCancel) return;
    if (result.errorCode === 'permission') { Alert.alert('Không có quyền truy cập ảnh', 'Hãy cấp quyền trong cài đặt.'); return; }
    if (result.errorCode || !result.assets?.[0]?.uri) { Alert.alert('Không chọn được ảnh', result.errorMessage || 'Hãy thử lại.'); return; }
    void uploadAndSend(result.assets[0]);
  };
  const chooseImage = () => {
    if (!imageUploadAvailable) {
      Alert.alert('Chưa thể gửi ảnh', 'Ứng dụng chưa được cấu hình dịch vụ tải ảnh.');
      return;
    }
    Alert.alert('Gửi ảnh', 'Chọn nguồn ảnh', [
      { text: 'Chụp ảnh', onPress: () => void pickImage('camera') },
      { text: 'Thư viện', onPress: () => void pickImage('library') },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };
  const openMap = (item: ChatMessage) => {
    if (item.latitude == null || item.longitude == null) return;
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`)
      .catch(() => Alert.alert('Không mở được bản đồ'));
  };
  const doRecall = async () => {
    if (!user || !menuMessage) return;
    try { await recallMessage(user.uid, chatId, menuMessage); }
    catch { Alert.alert('Không thu hồi được tin nhắn'); }
    setMenuMessage(null);
  };
  const doReact = async (emoji: string) => {
    if (!user || !menuMessage) return;
    try { await reactToMessage(user.uid, chatId, menuMessage, emoji); }
    catch { Alert.alert('Không thả được cảm xúc'); }
    setMenuMessage(null);
  };
  const copyMessage = () => {
    if (!menuMessage || menuMessage.recalled) return;
    const value = menuMessage.type === 'image' ? menuMessage.imageUrl || ''
      : menuMessage.type === 'location' ? `https://www.google.com/maps/search/?api=1&query=${menuMessage.latitude},${menuMessage.longitude}`
      : menuMessage.text;
    Clipboard.setString(value);
    setMenuMessage(null);
  };
  const senderName = (uid: string) => users.find(item => item.uid === uid)?.displayName || partner?.displayName || 'Thành viên';
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const mine = item.senderId === user?.uid;
    const reactions = item.recalled ? [] : reactionCounts(item.reactions);
    return <View style={[styles.messageRow, mine ? styles.right : styles.left]}>
      {!mine && <View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{senderName(item.senderId).charAt(0)}</Text></View>}
      <View style={styles.messageColumn}>
        {isGroup && !mine && <Text style={styles.senderName}>{senderName(item.senderId)}</Text>}
        <TouchableOpacity onLongPress={() => { if (!item.recalled) setMenuMessage(item); }} onPress={() => {
          if (item.recalled) return;
          if (item.type === 'image' && item.imageUrl) setFullImage(item.imageUrl);
          if (item.type === 'location') openMap(item);
        }} style={[styles.bubble, mine ? styles.mineBubble : styles.otherBubble]}>
          {item.recalled ? <Text style={[styles.messageText, mine && styles.mineText]}>Tin nhắn đã được thu hồi</Text>
            : item.type === 'image' && item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} />
            : <Text style={[styles.messageText, mine && styles.mineText]}>{item.type === 'location' ? '📍 Vị trí hiện tại' : item.text}</Text>}
          {!item.recalled && item.type === 'location' && <Text style={[styles.mapLink, mine && styles.mineText]}>Nhấn để mở bản đồ</Text>}
          <Text style={[styles.time, mine && styles.mineTime]}>{timeLabel(item.createdAt)}</Text>
        </TouchableOpacity>
        {!!reactions.length && <View style={styles.reactions}>{reactions.map(([emoji, count]) => <Text key={emoji} style={styles.reaction}>{emoji}{count > 1 ? ` ${count}` : ''}</Text>)}</View>}
        {mine && lastMine?.id === item.id && <Text style={styles.receipt}>{receipt.seen ? `Đã xem · ${timeLabel(receipt.seenAt || 0)}` : 'Đã gửi'}</Text>}
      </View>
    </View>;
  };

  return <SafeAreaView style={styles.page}>
    <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><AntDesign name="arrowleft" size={22} color={Colors.primary} /></TouchableOpacity>
      <View style={styles.avatar}><Text style={styles.avatarText}>{(isGroup ? conversation?.name : partner?.displayName)?.charAt(0) || '?'}</Text></View>
      <View style={styles.headerInfo}><Text style={styles.name}>{isGroup ? conversation?.name : partner?.displayName || 'Đang tải...'}</Text><Text style={styles.status}>{subtitle}</Text></View>
    </View>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList ref={listRef} data={messages} keyExtractor={item => item.id} renderItem={renderMessage} contentContainerStyle={styles.list} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })} />
      {pending && <View style={[styles.messageRow, styles.right]}><View style={[styles.bubble, styles.mineBubble]}>
        {!!pending.asset.uri && <Image source={{ uri: pending.asset.uri }} style={styles.image} />}
        {pending.uploading && <ActivityIndicator color={Colors.white} />}
        {pending.error && <TouchableOpacity onPress={() => void uploadAndSend(pending.asset, pending.url)}><Text style={styles.retry}>Thử lại</Text></TouchableOpacity>}
      </View></View>}
      <View style={styles.inputBar}><TouchableOpacity onPress={sendLocation} style={styles.iconButton}><Text style={styles.iconText}>📍</Text></TouchableOpacity>
        <TouchableOpacity onPress={chooseImage} style={styles.iconButton}><Text style={styles.iconText}>📷</Text></TouchableOpacity>
        <TextInput style={styles.input} placeholder="Nhập tin nhắn..." value={input} onChangeText={changeInput} onBlur={stopTyping} multiline />
        <TouchableOpacity disabled={!input.trim() || !ready} style={[styles.send, (!input.trim() || !ready) && styles.disabled]} onPress={sendText}><AntDesign name="arrowright" size={18} color={Colors.white} /></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    <Modal visible={!!menuMessage} transparent animationType="fade" onRequestClose={() => setMenuMessage(null)}>
      <Pressable style={styles.overlay} onPress={() => setMenuMessage(null)}><View style={styles.menu}>
        {!menuMessage?.recalled && <View style={styles.emojiRow}>{emojis.map(emoji => <TouchableOpacity key={emoji} onPress={() => void doReact(emoji)}><Text style={styles.emoji}>{emoji}</Text></TouchableOpacity>)}</View>}
        {!!menuMessage && !menuMessage.recalled && <TouchableOpacity style={styles.menuAction} onPress={copyMessage}><Text>Sao chép</Text></TouchableOpacity>}
        {menuMessage?.senderId === user?.uid && !menuMessage?.recalled && <TouchableOpacity style={styles.menuAction} onPress={() => void doRecall()}><Text>Thu hồi</Text></TouchableOpacity>}
      </View></Pressable>
    </Modal>
    <Modal visible={!!fullImage} transparent animationType="fade" onRequestClose={() => setFullImage(null)}>
      <View style={styles.fullImageView}><TouchableOpacity style={styles.closeImage} onPress={() => setFullImage(null)}><AntDesign name="close" size={28} color={Colors.white} /></TouchableOpacity>
        {!!fullImage && <Image source={{ uri: fullImage }} style={styles.fullImage} resizeMode="contain" />}
      </View>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, page: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.white, padding: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: Colors.border },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 },
  avatarText: { color: Colors.white, fontWeight: 'bold' }, headerInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary }, status: { color: Colors.textSecondary, fontSize: 12 },
  list: { padding: 12 }, messageRow: { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end' },
  left: { justifyContent: 'flex-start' }, right: { justifyContent: 'flex-end' },
  smallAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  smallAvatarText: { color: Colors.white, fontSize: 12 }, messageColumn: { maxWidth: '78%' }, senderName: { fontSize: 11, color: Colors.textSecondary, marginBottom: 3 },
  bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 }, mineBubble: { backgroundColor: Colors.bubbleMe, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  messageText: { color: Colors.textPrimary, fontSize: 15 }, mineText: { color: Colors.white },
  mapLink: { color: Colors.primary, fontSize: 12, textDecorationLine: 'underline', marginTop: 4 },
  image: { width: 220, height: 180, borderRadius: 10 },
  time: { color: Colors.textSecondary, fontSize: 10, marginTop: 4 }, mineTime: { color: 'rgba(255,255,255,0.75)', textAlign: 'right' },
  reactions: { flexDirection: 'row', marginTop: 3 }, reaction: { backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 5, marginRight: 3, fontSize: 12 },
  receipt: { textAlign: 'right', fontSize: 11, color: Colors.textSecondary, marginTop: 3 },
  inputBar: { backgroundColor: Colors.white, borderTopWidth: 1, borderColor: Colors.border, padding: 8, flexDirection: 'row', alignItems: 'flex-end' },
  iconButton: { padding: 5 }, iconText: { fontSize: 22 }, input: { flex: 1, minHeight: 40, maxHeight: 96, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, color: Colors.textPrimary },
  send: { width: 40, height: 40, borderRadius: 20, marginLeft: 7, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }, disabled: { backgroundColor: Colors.border },
  retry: { color: Colors.white, fontWeight: 'bold', textAlign: 'center', marginTop: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  menu: { backgroundColor: Colors.white, minWidth: 210, padding: 14, borderRadius: 12 }, emojiRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }, emoji: { fontSize: 25, marginHorizontal: 3 },
  menuAction: { paddingVertical: 10, borderTopWidth: 1, borderColor: Colors.border },
  fullImageView: { flex: 1, backgroundColor: '#000', justifyContent: 'center' }, fullImage: { width: '100%', height: '85%' },
  closeImage: { position: 'absolute', top: 45, right: 20, zIndex: 2 },
});
