# ChatApp

Ứng dụng chat React Native CLI dùng **Firebase Authentication** để đăng nhập, **Firebase Realtime Database** để lưu cuộc trò chuyện và **Cloudinary** để lưu ảnh. App hỗ trợ chat cá nhân, chat nhóm, tin chữ, vị trí, ảnh, trạng thái hoạt động/đang gõ/đã xem, thu hồi, cảm xúc và thông báo.

## Chạy ứng dụng

- Node.js **>= 22.11**, Android SDK và JDK phù hợp với React Native 0.87. Với iOS cần macOS và CocoaPods.
- Cài thư viện: `npm ci`.
- Mở Metro: `npm start`.
- Mở một terminal khác và chạy Android: `npm run android`. Trên macOS, có thể chạy `cd ios && pod install` rồi `npm run ios`.

Nếu Metro của bạn đang chạy ở cổng **8082**, hãy dùng cùng cổng khi chạy app, ví dụ `npm start -- --port 8082` và `npm run android -- --port 8082`. Không mở thêm một Metro ở cổng khác cho cùng phiên chạy.

## Thiết lập Firebase

Mã nguồn hiện trỏ tới Firebase project `chatapp-29f27` trong [`src/services/firebase.ts`](src/services/firebase.ts). Nếu dùng đúng project này và đã được cấp quyền, có thể giữ nguyên cấu hình. Nếu dùng project Firebase của riêng bạn:

1. Tạo Firebase project, đăng ký **Web app** để lấy `firebaseConfig`, rồi thay các trường trong `src/services/firebase.ts`. App dùng Firebase **JavaScript SDK**; cấu hình nằm trong file này.
2. Trong Firebase Authentication, bật phương thức đăng nhập **Email/Password**. App đăng ký và đăng nhập bằng phương thức đó.
3. Tạo **Realtime Database** và thay `databaseURL` trong `src/services/firebase.ts` bằng URL của database mới. App dùng Realtime Database, không dùng Cloud Firestore để lưu chat.
4. Kiểm tra luật trong [`firebase-database.rules.json`](firebase-database.rules.json). File [`firebase.json`](firebase.json) chỉ Firebase CLI tới file luật này.
5. Kiểm thử luật ở local bằng `npm run test:rules` (cần Java 17 và các cổng emulator 9000, 9099 đang trống). Lệnh này dùng project giả `demo-chatapp`, không thay đổi dữ liệu thật.
6. Khi đã sẵn sàng áp dụng luật lên project thật, đăng nhập CLI bằng `npx firebase login`, rồi chạy:

   ```bash
   npx firebase deploy --only database --project <PROJECT_ID>
   ```

   Thay `<PROJECT_ID>` bằng ID project của bạn; với project đang cấu hình là `chatapp-29f27`. Lệnh deploy **thay thế luật Realtime Database đang chạy** của project đích, nên hãy kiểm tra đúng project và nội dung luật trước khi chạy. Chỉ chạy bước này khi bạn có quyền quản lý project.

Luật hiện tại yêu cầu đăng nhập, giới hạn quyền đọc/gửi tin theo thành viên cuộc trò chuyện và giới hạn một số thao tác theo chủ sở hữu (ví dụ chỉ người gửi được thu hồi tin). Nếu app báo `PERMISSION_DENIED` khi gửi ảnh dù ảnh đã tải lên Cloudinary, hãy kiểm tra luật Realtime Database của **đúng project** đã được cập nhật từ file trên chưa.

Tài liệu chính thức: [Firebase Email/Password](https://firebase.google.com/docs/auth/web/password-auth), [Realtime Database Security Rules](https://firebase.google.com/docs/database/security/get-started), [triển khai luật bằng CLI](https://firebase.google.com/docs/rules/manage-deploy).

## Thiết lập Cloudinary để gửi ảnh

Mã nguồn hiện có `cloudName: 'e35xrl68'` và `preset: 'ChatApp'` trong [`src/config/cloudinary.ts`](src/config/cloudinary.ts). Hai giá trị phải thuộc **cùng một Cloudinary product environment**. `Dynamic folders` là chế độ quản lý thư mục; riêng thông tin này không thay cho upload preset.

1. Trong Cloudinary Console, mở **Settings → Upload → Upload Presets** và tạo hoặc kiểm tra preset tên `ChatApp`.
2. Đặt preset ở chế độ **Unsigned**. App tải ảnh trực tiếp từ điện thoại, nên preset dạng Signed sẽ không hoạt động với luồng hiện tại.
3. Nên giới hạn preset cho ảnh, đặt giới hạn dung lượng phù hợp và bật **Disallow public ID**. Unsigned preset có thể được thấy trong mã ứng dụng, vì vậy không dùng nó như một bí mật.
4. Nếu dùng Cloudinary environment khác, sửa `cloudName` và `preset` trong `src/config/cloudinary.ts` cho khớp. **Không đưa API secret vào ứng dụng.**

Luồng gửi ảnh: người dùng chụp/chọn ảnh bằng `react-native-image-picker` → app yêu cầu ảnh có cạnh tối đa 1024 px → [`imageUploadService.ts`](src/services/imageUploadService.ts) gửi ảnh đến Cloudinary bằng `upload_preset` → Cloudinary trả `secure_url` → app chỉ lưu URL đó trong Realtime Database. Camera cần quyền truy cập trên thiết bị; khi tải lên hoặc gửi tin thất bại, bong bóng ảnh tạm có nút **Thử lại**.

Nếu Cloudinary báo lỗi upload, kiểm tra `cloudName`, **đúng chữ hoa/thường** của preset và chế độ Unsigned. Nếu đã nhận URL ảnh nhưng Firebase báo `PERMISSION_DENIED`, kiểm tra Firebase rules theo mục trên.

Tài liệu chính thức: [Cloudinary upload presets](https://cloudinary.com/documentation/upload_presets), [Upload API](https://cloudinary.com/documentation/image_upload_api_reference).
