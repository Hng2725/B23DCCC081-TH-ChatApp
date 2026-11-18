const { initializeApp, deleteApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } = require('firebase/auth');
const { getDatabase, connectDatabaseEmulator, goOffline, get, ref, set, update, increment } = require('firebase/database');

const apps = [];
const databases = [];

async function client(label) {
  const app = initializeApp({
    apiKey: 'demo-key',
    projectId: 'demo-chatapp',
    databaseURL: 'https://demo-chatapp-default-rtdb.firebaseio.com',
  }, label);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const credential = await createUserWithEmailAndPassword(auth, `${label}@example.test`, 'password123');
  const database = getDatabase(app);
  connectDatabaseEmulator(database, '127.0.0.1', 9000);
  databases.push(database);
  return { uid: credential.user.uid, database };
}

async function denied(promise) {
  try {
    await promise;
    throw new Error('Thao tác trái quyền đã được cho phép');
  } catch (error) {
    if (!String(error?.code || error).toLowerCase().includes('permission')) throw error;
  }
}

async function main() {
  try {
    const alice = await client('alice');
    const bob = await client('bob');
    const charlie = await client('charlie');
    const a = alice.uid, b = bob.uid, c = charlie.uid;
    const [memberA, memberB] = [a, b].sort();
    const directId = `${memberA}_${memberB}`;
    await denied(set(ref(charlie.database, `conversations/${directId}`), {
      members: { [a]: true, [b]: true, [c]: true },
      metadata: { kind: 'direct', memberA, memberB },
    }));
    await denied(set(ref(charlie.database, `conversations/${directId}/members`), { [a]: true, [b]: true, [c]: true }));
    await denied(set(ref(alice.database, `conversations/${directId}`), {
      members: { [a]: true, [b]: true, [c]: true },
      metadata: { kind: 'direct', memberA, memberB },
    }));
    await set(ref(alice.database, `conversations/${directId}`), {
      members: { [a]: true, [b]: true }, metadata: { kind: 'direct', memberA, memberB },
    });
    await denied(update(ref(alice.database, `conversations/${directId}/members`), { [c]: true }));
    await set(ref(alice.database, `conversations/${directId}/messages/m1`), {
      senderId: a, type: 'text', text: 'Xin chào', createdAt: 100,
    });
    await denied(set(ref(alice.database, `notifications/${b}/forged-message`), {
      type: 'message', chatId: directId, actorId: a, messageId: 'missing', createdAt: 101,
    }));
    await denied(set(ref(bob.database, `notifications/${a}/forged-reaction`), {
      type: 'reaction', chatId: directId, actorId: b, messageId: 'm1', createdAt: 102,
    }));
    await update(ref(alice.database), {
      [`conversations/${directId}/messages/m2`]: { senderId: a, type: 'text', text: 'Tin mới', createdAt: 110 },
      [`userConversations/${b}/${directId}/kind`]: 'direct',
      [`userConversations/${b}/${directId}/partnerId`]: a,
      [`userConversations/${b}/${directId}/lastMessageId`]: 'm2',
      [`userConversations/${b}/${directId}/lastMessage`]: 'Tin mới',
      [`userConversations/${b}/${directId}/lastMessageType`]: 'text',
      [`userConversations/${b}/${directId}/lastMessageAt`]: 110,
      [`userConversations/${b}/${directId}/unreadCount`]: increment(1),
    });
    await update(ref(alice.database), {
      [`conversations/${directId}/messages/mImage`]: { senderId: a, type: 'image', text: '', imageUrl: 'https://res.cloudinary.com/demo/image/upload/a.jpg', createdAt: 115 },
      [`userConversations/${a}/${directId}/kind`]: 'direct',
      [`userConversations/${a}/${directId}/partnerId`]: b,
      [`userConversations/${a}/${directId}/lastMessageId`]: 'mImage',
      [`userConversations/${a}/${directId}/lastMessage`]: '📷 Hình ảnh',
      [`userConversations/${a}/${directId}/lastMessageType`]: 'image',
      [`userConversations/${a}/${directId}/lastMessageAt`]: 115,
      [`userConversations/${a}/${directId}/unreadCount`]: 0,
      [`userConversations/${b}/${directId}/lastMessageId`]: 'mImage',
      [`userConversations/${b}/${directId}/lastMessage`]: '📷 Hình ảnh',
      [`userConversations/${b}/${directId}/lastMessageType`]: 'image',
      [`userConversations/${b}/${directId}/lastMessageAt`]: 115,
      [`userConversations/${b}/${directId}/unreadCount`]: increment(1),
    });
    if ((await get(ref(bob.database, `conversations/${directId}/messages/mImage`))).val()?.type !== 'image') {
      throw new Error('Tin ảnh trong chat 1-1 không đọc được');
    }
    await set(ref(alice.database, `notifications/${b}/${directId}_m2`), { type: 'message', chatId: directId, actorId: a, messageId: 'm2', createdAt: 110 });
    await denied(update(ref(alice.database, `userConversations/${b}/${directId}`), { unreadCount: 0 }));
    await update(ref(bob.database, `userConversations/${b}/${directId}`), { unreadCount: 0 });
    await denied(get(ref(charlie.database, `conversations/${directId}/messages/m1`)));
    await update(ref(bob.database), {
      [`conversations/${directId}/messages/m1/reactions/${b}`]: '👍',
    });
    await set(ref(bob.database, `notifications/${a}/${directId}_m1_${b}`), { type: 'reaction', chatId: directId, actorId: b, messageId: 'm1', createdAt: 120 });
    await set(ref(bob.database, `conversations/${directId}/readAt/${b}`), 200);
    await denied(update(ref(bob.database, `conversations/${directId}/messages/m1`), { recalled: true }));
    await update(ref(alice.database, `conversations/${directId}/messages/m1`), { recalled: true, recalledAt: 210 });
    await denied(set(ref(bob.database, `conversations/${directId}/messages/m1/reactions/${b}`), '❤️'));
    await set(ref(alice.database, `notifications/${b}/${directId}_m1`), {
      type: 'message', chatId: directId, actorId: a, messageId: 'm1', createdAt: 220,
    });
    await denied(update(ref(alice.database, `notifications/${b}/${directId}_m1`), { readAt: 230 }));
    await update(ref(bob.database, `notifications/${b}/${directId}_m1`), { readAt: 230 });
    await set(ref(alice.database, 'conversations/group-one'), {
      members: { [a]: true, [b]: true, [c]: true },
      metadata: { kind: 'group', name: 'Nhóm học', createdBy: a, createdAt: 300 },
    });
    await update(ref(alice.database), {
      'conversations/group-one/messages/m3': { senderId: a, type: 'image', text: '', imageUrl: 'https://res.cloudinary.com/demo/a.jpg', createdAt: 310 },
      [`userConversations/${b}/group-one/kind`]: 'group',
      [`userConversations/${b}/group-one/groupName`]: 'Nhóm học',
      [`userConversations/${b}/group-one/unreadCount`]: increment(1),
      [`userConversations/${b}/group-one/lastMessageId`]: 'm3',
      [`userConversations/${b}/group-one/lastMessage`]: '📷 Hình ảnh',
      [`userConversations/${b}/group-one/lastMessageType`]: 'image',
      [`userConversations/${b}/group-one/lastMessageAt`]: 310,
      [`notifications/${b}/group-one_invite`]: { type: 'group_invite', chatId: 'group-one', actorId: a, createdAt: 310 },
    });
    console.log('Firebase Rules emulator: chat, nhóm, ảnh, thu hồi, cảm xúc và thông báo đạt.');
  } finally {
    databases.forEach(goOffline);
    await Promise.allSettled(apps.map(deleteApp));
  }
}

main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
