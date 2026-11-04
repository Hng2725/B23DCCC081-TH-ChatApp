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
});
