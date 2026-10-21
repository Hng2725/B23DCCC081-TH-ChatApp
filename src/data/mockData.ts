export const currentUser = {
  id: '0',
  name: 'Nguyễn Hưng',
  email: 'nguyenhung@example.com',
  avatarColor: '#1890ff',
};

export const conversations = [
  {
    id: '1',
    name: 'Nguyễn Văn An',
    lastMessage: 'Tối nay rảnh đi cafe không?',
    time: '10:30',
    unread: 2,
    avatarColor: '#f56a00',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Trần Thị Bình',
    lastMessage: 'Ok bạn, hẹn 8h nhé!',
    time: '09:15',
    unread: 0,
    avatarColor: '#7265e6',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Lê Hoàng Cường',
    lastMessage: 'Bài tập hôm nay khó quá bạn ơi',
    time: 'Hôm qua',
    unread: 5,
    avatarColor: '#00a2ae',
    isOnline: false,
  },
  {
    id: '4',
    name: 'Phạm Thị Dung',
    lastMessage: 'Cảm ơn bạn nhiều nha!',
    time: 'Hôm qua',
    unread: 0,
    avatarColor: '#87d068',
    isOnline: true,
  },
  {
    id: '5',
    name: 'Hoàng Minh Em',
    lastMessage: 'Hẹn gặp lại bạn nhé',
    time: 'T2',
    unread: 0,
    avatarColor: '#e6b800',
    isOnline: false,
  },
  {
    id: '6',
    name: 'Vũ Thị Phương',
    lastMessage: 'Mình đang trên đường rồi!',
    time: 'T2',
    unread: 1,
    avatarColor: '#d46b08',
    isOnline: true,
  },
];

export const contacts = [
  { id: '1', name: 'Nguyễn Văn An', avatarColor: '#f56a00', isOnline: true },
  { id: '2', name: 'Trần Thị Bình', avatarColor: '#7265e6', isOnline: true },
  { id: '3', name: 'Lê Hoàng Cường', avatarColor: '#00a2ae', isOnline: false },
  { id: '4', name: 'Phạm Thị Dung', avatarColor: '#87d068', isOnline: true },
  { id: '5', name: 'Hoàng Minh Em', avatarColor: '#e6b800', isOnline: false },
  { id: '6', name: 'Vũ Thị Phương', avatarColor: '#d46b08', isOnline: true },
  { id: '7', name: 'Đặng Quốc Hùng', avatarColor: '#096dd9', isOnline: false },
  { id: '8', name: 'Bùi Thị Lan', avatarColor: '#389e0d', isOnline: false },
  { id: '9', name: 'Ngô Văn Minh', avatarColor: '#c41d7f', isOnline: true },
  { id: '10', name: 'Đinh Thị Ngọc', avatarColor: '#d4380d', isOnline: false },
];

export const notifications = [
  {
    id: '1',
    content: 'Nguyễn Văn An đã gửi cho bạn một tin nhắn mới.',
    time: '10:30',
    isRead: false,
  },
  {
    id: '2',
    content: 'Trần Thị Bình đã phản hồi tin nhắn của bạn.',
    time: '09:15',
    isRead: false,
  },
  {
    id: '3',
    content: 'Lê Hoàng Cường đã gửi cho bạn 5 tin nhắn.',
    time: 'Hôm qua',
    isRead: true,
  },
  {
    id: '4',
    content: 'Vũ Thị Phương đã đề cập đến bạn trong nhóm chat.',
    time: 'Hôm qua',
    isRead: false,
  },
  {
    id: '5',
    content: 'Phạm Thị Dung vừa tham gia ứng dụng.',
    time: 'T2',
    isRead: true,
  },
  {
    id: '6',
    content: 'Hoàng Minh Em đã gửi cho bạn một tin nhắn.',
    time: 'T2',
    isRead: true,
  },
];

export const sampleMessages = [
  { id: '1', text: 'Xin chào! Bạn có khỏe không?', isMine: false, time: '09:00' },
  { id: '2', text: 'Mình khỏe, cảm ơn bạn! Bạn thế nào?', isMine: true, time: '09:01' },
  { id: '3', text: 'Mình cũng ổn nha. Tối nay rảnh đi cafe không?', isMine: false, time: '09:05' },
  { id: '4', text: 'Được nè, hẹn 8h tối nhé!', isMine: true, time: '09:06' },
  { id: '5', text: 'Oke bạn! Mình chờ bạn nhé 😊', isMine: false, time: '09:07' },
];
