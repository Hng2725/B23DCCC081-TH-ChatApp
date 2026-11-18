# Thiết lập chat nhóm, ảnh và thông báo

## Cloudinary

1. Trong Cloudinary Console, tạo **unsigned upload preset** dành cho ảnh chat. Giới hạn định dạng ảnh được chấp nhận và bật `disallow_public_id`. Ứng dụng đã giảm ảnh về tối đa 1024 × 1024 trước khi gửi; có thể thêm incoming transformation trong preset.
2. Điền **cloud name** và **tên unsigned preset** vào `src/config/cloudinary.ts`. Hai giá trị này xuất hiện trong ứng dụng cài trên máy; không đặt API secret ở đây.
3. Gửi thử một ảnh bằng camera và một ảnh từ thư viện. Khi chưa điền cấu hình, app báo rõ chưa thể gửi ảnh trước khi mở camera hoặc thư viện. Nếu tải lên thất bại sau khi đã cấu hình, bong bóng ảnh có nút thử lại.

## Firebase

- Triển khai `firebase-database.rules.json` cùng bản ứng dụng mới. Có thể dùng `npx firebase deploy --only database --project chatapp-29f27` sau khi đăng nhập tài khoản Firebase có quyền với dự án. Không chạy lệnh này chỉ để kiểm thử.
- Chạy kiểm thử local bằng `npm run test:rules`. Lệnh dùng dự án giả `demo-chatapp`, Firebase Auth + Realtime Database Emulator và Java 17. Dữ liệu kiểm thử không chạm Firebase thật.
- Chat 1-1 cũ vẫn đọc được. Khi có tin mới, app ghi thêm `lastMessageId`; trước thời điểm đó Home lấy tin cuối từ lịch sử để cập nhật nội dung nếu tin bị thu hồi.

## Kiểm tra trên thiết bị

- Android: cấp hoặc từ chối quyền camera; mở thư viện; chụp và gửi ảnh.
- iOS: chạy `pod install` trong thư mục `ios` trên macOS trước khi build vì có hai thư viện native mới (`react-native-image-picker` và Clipboard).
- Dùng ba tài khoản để thử nhóm, số chưa đọc riêng, cảm xúc, đã xem khi mọi thành viên mở chat, và trạng thái soạn tin tự tắt sau 3 giây.
