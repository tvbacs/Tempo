# TEMPO MUSIC — CẤU HÌNH, PHIÊN BẢN VÀ HƯỚNG DẪN CÀI ĐẶT TOÀN TẬP

> **Phiên bản tài liệu**: 1.0.0  
> **Hệ điều hành hỗ trợ**: iOS (iPhone/iPad), Android, Web (PC/Laptop), Backend (Node.js)  
> **Cơ chế thiết kế**: 100% Tokenized Theme, Zero Border, No Emojis, Clean Glassmorphism.

---

## 1. BẢNG MA TRẬN PHIÊN BẢN & CẤU HÌNH CHUẨN

| Thành phần | Phiên bản / Môi trường | Ghi chú |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.x` (Khuyến nghị 20 LTS hoặc 22) | Môi trường runtime cho BE, FE và Web |
| **Expo SDK** | `54.0.0` | Nền tảng React Native đa nền tảng |
| **React Native** | `0.81.5` | React Native New Architecture Ready |
| **React** | `19.1.10` / `@types/react: ~19.1.10` | React core |
| **TypeScript** | `~5.9.2` | Ngôn ngữ phát triển toàn bộ dự án |
| **Slider** | `@react-native-community/slider: 5.0.1` | Thanh trượt tiến trình & âm lượng |
| **Audio Engine** | `expo-audio: ~54.0.0` (Expo SDK 54) | Hỗ trợ phát nền & widget Màn hình khóa |
| **Xcode (iOS Build)** | `Xcode 16.2` (`macos-14` / `macos-15`) | Môi trường build IPA trên GitHub Actions |
| **Database & Realtime** | Supabase Cloud (PostgreSQL + Realtime Channel) | Cross-device Spotify Connect & Cloud Sync |

---

## 2. CẤU TRÚC DỰ ÁN

```text
Tempo/
├── .github/
│   └── workflows/
│       └── build-ios.yml          # GitHub Actions tự động build file IPA cho iOS
├── BE/
│   └── Tempo/                     # Backend API (Node.js Express + Zing MP3 + Stream Proxy)
│       ├── src/
│       │   ├── services/
│       │   │   └── zingService.js # Tích hợp Zing MP3 API & fallback nghệ sĩ
│       │   └── routes/
│       ├── package.json
│       └── .env
├── FE/
│   └── Tempo/                     # Mobile App (React Native / Expo)
│       ├── src/
│       │   ├── components/        # Toast, MiniPlayer, DevicePickerModal, ...
│       │   ├── screens/           # Home, Library, LikedSongs, PlayerModal, Auth, ...
│       │   ├── store/             # playerStore, connectStore, libraryStore, authStore, ...
│       │   ├── services/          # audioPlayer.ts (expo-audio engine)
│       │   └── constants/theme.ts # 100% Tokenized Design System
│       ├── app.json               # Cấu hình UIBackgroundModes, File Sharing, EAS Update
│       └── package.json
├── Web/
│   └── Tempo/                     # Web Player (React + Vite + Tailwind + Realtime Connect)
│       ├── src/
│       │   ├── store/connectStore.ts # Nhận lệnh điều khiển từ xa & phát nhạc trên PC
│       │   └── components/
│       └── package.json
└── PROJECTS_CONFIG_AND_VERSIONS.md
```

---

## 3. CÁC CÂU LỆNH CÀI ĐẶT & CHẠY DỰ ÁN

### 3.1. Chạy Backend API (BE)
```bash
# Di chuyển vào thư mục Backend
cd BE/Tempo

# Cài đặt thư viện
npm install

# Khởi chạy server Backend (Mặc định Port 5000)
npm start
```

### 3.2. Chạy Web Player trên PC (Web)
```bash
# Di chuyển vào thư mục Web Player
cd Web/Tempo

# Cài đặt thư viện
npm install

# Khởi chạy Web Player (Mở trên trình duyệt PC: http://localhost:5173)
npm run dev

# Kiểm tra lỗi TypeScript
npx tsc --noEmit
```

### 3.3. Chạy Mobile App trong môi trường phát triển (FE)
```bash
# Di chuyển vào thư mục Mobile App
cd FE/Tempo

# Cài đặt thư viện
npm install

# Tự động sửa và chuẩn hóa phiên bản thư viện theo Expo SDK 54
npx expo install --fix

# Kiểm tra TypeScript toàn bộ app
npx tsc --noEmit

# Khởi chạy Expo Dev Server
npx expo start
```

---

## 4. QUY TRÌNH TỰ ĐỘNG BUILD FILE `.IPA` (iOS) QUA GITHUB ACTIONS

Toàn bộ quá trình biên dịch mã nguồn iOS sang file `.ipa` được tự động hóa 100% trên đám mây của GitHub (miễn phí), không cần máy Mac tại nhà.

### Cách thức hoạt động:
1. Mỗi khi bạn đẩy code lên nhánh `main` (`git push origin main`), GitHub Actions sẽ tự động kích hoạt workflow `.github/workflows/build-ios.yml`.
2. Máy chủ ảo macOS (`macos-14` chạy Xcode 16.2) sẽ:
   - Cài đặt Node.js & dependencies
   - Chạy lệnh `npx expo prebuild --platform ios --clean`
   - Biên dịch bằng `xcodebuild -workspace ios/Tempo.xcworkspace -scheme Tempo -configuration Release`
   - Đóng gói file `.ipa` vào thư mục `Payload/Tempo.app` và nén thành `Tempo.ipa`.
   - Xuất file artifact lên GitHub.

### Cách tải file `.ipa` đã build:
1. Mở trình duyệt vào trang GitHub: `https://github.com/tvbacs/Tempo/actions`
2. Chọn lượt chạy **Build iOS IPA** mới nhất.
3. Cuộn xuống phần **Artifacts** ở dưới cùng.
4. Nhấn tải file **`Tempo.ipa`** về máy tính.

---

## 5. HƯỚNG DẪN CÀI ĐẶT LÊN IPHONE BẰNG SIDELOADLY

### 5.1. Chuẩn bị:
- Phần mềm **Sideloadly** trên máy tính Windows/Mac: https://sideloadly.io
- Cài đặt **iTunes** (bản tải trực tiếp từ Apple hoặc Microsoft Store) hoặc **Apple Devices** để máy tính nhận diện iPhone.
- Cáp kết nối iPhone với máy tính (Lightning hoặc Type-C).

### 5.2. Các bước cài đặt:
1. Cắm iPhone vào máy tính và mở phần mềm **Sideloadly**.
2. Kéo thả file **`Tempo.ipa`** (vừa tải từ GitHub Actions) vào ô trống bên trái của Sideloadly.
3. Nhập địa chỉ **Apple ID** của bạn vào ô `Apple ID`.
4. Nhấn vào nút **Advanced Options** (mở rộng cài đặt nâng cao):
   - **Tích chọn ô "File Sharing"** (hoặc *"Enable iTunes File Sharing"* / *"UIFileSharing"*): Giúp thư mục nhạc ngoại tuyến xuất hiện trực tiếp trong ứng dụng **Tệp (Files)** trên iPhone.
5. Nhấn nút **Start**. Nhập mật khẩu Apple ID khi được yêu cầu (và mã xác thực 2 lớp hiển thị trên màn hình iPhone nếu có).
6. Đợi 1-2 phút cho đến khi Sideloadly báo **Done!**.

### 5.3. Kích hoạt quyền ứng dụng trên iPhone (Làm 1 lần đầu):
1. Trên iPhone, vào **Cài đặt (Settings)** ➔ **Cài đặt chung (General)**.
2. Chọn **Quản lý VPN & Thiết bị (VPN & Device Management)**.
3. Nhấn vào tài khoản Apple ID của bạn trong mục *Ứng dụng nhà phát triển*.
4. Nhấn **Tin cậy (Trust)** ➔ Xác nhận Tin cậy.
5. Mở app **Tempo** và thưởng thức âm nhạc!

---

## 6. CẬP NHẬT ỨNG DỤNG KHÔNG DÂY (EXPO EAS OTA UPDATE)

Bản IPA đã được tích hợp công nghệ **EAS Update**. Khi có các bản vá lỗi giao diện, thêm tính năng, sửa kết nối hay chỉnh sửa logic:
- **Không cần cắm cáp**.
- **Không cần cài lại qua Sideloadly**.

### Lệnh xuất bản cập nhật từ máy tính:
```bash
cd FE/Tempo
npx eas-cli update --auto
```

### Cách nhận bản cập nhật trên iPhone:
1. Vuốt tắt app **Tempo** trên iPhone (đóng khỏi màn hình đa nhiệm).
2. Mở lại app Tempo (kết nối Wi-Fi/4G để app tự động tải mã nguồn mới trong nền ~1-2 giây).
3. Đóng app và mở lại lần thứ hai ➔ Tính năng mới lập tức có hiệu lực!

---

## 7. CÁC TÍNH NĂNG ĐẶC TRƯNG ĐÃ ĐƯỢC HOÀN THIỆN

1. **Cross-Device Connect (Spotify Connect Clone)**:
   - Đồng bộ thời gian thực qua Supabase Broadcast Channel (`tempo_connect_channel`).
   - Điều khiển Web Player trên PC bằng iPhone và ngược lại.
   - **Thanh kéo âm lượng PC từ xa**: Tích hợp thanh trượt mượt mà, phản hồi 0ms (Optimistic UI), không bị lag hay giật lùi trạng thái khi mạng chậm.
   - **Tự động giữ kết nối nền**: Tự động phục hồi trạng thái khi mở lại app từ Background mà không làm gián đoạn bài hát trên PC.

2. **Nút Phát & Trộn bài độc lập (Context-Isolated Playback)**:
   - Các màn hình `Bài hát đã thích`, `Danh sách phát`, `Nghệ sĩ`, `Nhạc đã tải`, `Xem tất cả` hoạt động độc lập theo chuẩn ngữ cảnh Spotify.
   - Nút Play to chỉ hiển thị trạng thái Pause nếu bài hát đang phát thực sự thuộc về màn hình đó.

3. **Màn hình khóa & Trung tâm điều khiển (Lock Screen / Now Playing Widget)**:
   - Tích hợp qua `expo-audio` với cờ `UIBackgroundModes: ["audio"]`.
   - Hiển thị đầy đủ ảnh bìa album, tên bài hát, nghệ sĩ, thanh trượt thời gian và các phím điều hướng ngay trên màn hình khóa iPhone/Android.

4. **Tải nhạc Offline & Chia sẻ tệp qua iTunes/Files**:
   - Lưu trữ nhạc trực tiếp trong `Documents/tempo_downloads/`.
   - Bật cờ `UIFileSharingEnabled: true` giúp quản lý nhạc trực tiếp qua ứng dụng **Tệp (Files)** hoặc copy qua máy tính bằng iTunes / 3uTools.

5. **Cloud Sync Toàn Diện**:
   - Tự động lưu trữ và đồng bộ toàn bộ Bài hát yêu thích, Playlist cá nhân, Lịch sử nghe và Album đã lưu lên Supabase Cloud Database.
   - Bất kể cài lại app hay đổi thiết bị, chỉ cần đăng nhập là 100% dữ liệu được phục hồi tức thì.
