const databaseRules = require('../firebase-database.rules.json');

describe('Firebase Realtime Database rules', () => {
  test('allows conversation owners to reset unread and members to update the recipient summary', () => {
    const writeRule =
      databaseRules.rules.userConversations.$uid.$chatId['.write'];

    expect(writeRule).toContain('auth.uid === $uid');
    expect(writeRule).toContain(
      "newData.child('partnerId').val() === auth.uid",
    );
  });

  test('declares separate permissions for owner recall, own reaction and own receipt', () => {
    const chat = databaseRules.rules.conversations.$chatId;
    expect(chat.messages.$messageId.recalled['.write']).toContain('senderId');
    expect(chat.messages.$messageId.reactions.$uid['.write']).toContain('auth.uid === $uid');
    expect(chat.readAt.$uid['.write']).toContain('auth.uid === $uid');
  });

  test('restricts notification read state to its recipient', () => {
    const notifications = databaseRules.rules.notifications.$uid;
    expect(notifications['.read']).toContain('auth.uid === $uid');
    expect(notifications.$notificationId.readAt['.write']).toContain('auth.uid === $uid');
  });
});
