# Unread Conversation Dot Design

## Intent

Giúp người dùng nhận ra nhanh cuộc trò chuyện chưa đọc trên màn hình Home.

## Design

- Thay badge số hiện tại bằng một chấm tròn màu xanh 10px ở mép phải dòng xem trước.
- Chấm chỉ xuất hiện khi `unreadCount > 0` và biến mất khi cuộc trò chuyện được đánh dấu đã đọc.
- Thêm nhãn trợ năng `Có tin nhắn chưa đọc`.
- Không thay đổi Firebase, gửi tin nhắn hoặc màn hình Thông báo.

## Approaches

- Chọn chấm xanh đơn giản: dễ nhìn và đúng yêu cầu mới.
- Không giữ số trong chấm: dữ liệu số hiện phụ thuộc quyền cập nhật Firebase và người dùng chỉ cần nhận biết trạng thái chưa đọc.

