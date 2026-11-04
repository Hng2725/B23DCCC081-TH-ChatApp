# Unread Conversation Dot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hiển thị chấm xanh cho từng cuộc trò chuyện có tin chưa đọc.

**Architecture:** Home tiếp tục dùng `ConversationSummary.unreadCount`; chỉ thay biểu diễn badge số bằng chấm trạng thái có nhãn trợ năng.

**Tech Stack:** React Native, TypeScript, Jest, react-test-renderer

**Spec:** `docs/superpowers/specs/2026-11-04-unread-dot-design.md`

## Global Constraints

- Không thay đổi Firebase hoặc luồng chat.
- Chấm xanh chỉ xuất hiện khi `unreadCount > 0`.

## Review Focus

- `unreadCount > 0`: có đúng một chấm xanh.
- `unreadCount = 0`: không có chấm xanh.
- Nhấn hội thoại vẫn mở đúng Chatbox.

---

### Task 1: Unread dot on Home

**Files:**
- Create: `__tests__/home-screen.test.tsx`
- Modify: `src/Screen/HomeScreen/index.tsx`

**Interfaces:**
- Consumes: `ConversationSummary.unreadCount`
- Produces: View có `testID="unread-dot"` và `accessibilityLabel="Có tin nhắn chưa đọc"`

- [x] Viết test thất bại cho trạng thái chưa đọc và đã đọc.
- [x] Chạy test để xác nhận thất bại do chưa có unread dot.
- [x] Thay badge số bằng chấm xanh 10px.
- [x] Chạy test riêng, toàn bộ Jest và TypeScript.

