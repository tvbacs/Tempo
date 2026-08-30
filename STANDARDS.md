# QUY CHUAN THIET KE UI/UX & TIEU CHUAN LAP TRINH DU AN TEMPO

Tai lieu nay xac lap bo quy tac bat buoc ap dung cho toan bo qua trinh phat trien du an Tempo, dam bao san pham dat chat luong hoan thien cao cap, nhat quan, logic va loai bo hoan toan cac dau vet thiet ke cau tha cua AI.

---

## 1. NGUYEN TAC COT LOI (CORE PRINCIPLES)

### 1.1. Tuyet doi khong su dung Emoji
* Nghiem cam dat emoji trong:
  * Giao dien nguoi dung (UI text, placeholder, tab bar, header, button).
  * Ma nguon (ten bien, comment, log, commit message).
  * Du lieu tra ve tu API (response JSON, error messages).
* Moi bieu tuong truc quan bat buoc phai su dung vector icon chuan (Lucide Icons) voi stroke-width dong nhat (1.5px hoac 2px) va kich thuoc theo he so 4 (16px, 20px, 24px).

### 1.2. Loai bo hoan toan phong cach "AI Slop"
Cac loi thiet ke AI thuong gap phai tranh tuyet doi:
* Khong su dung cac dai mau gradient tim/neon vo toi va tao cam giac gia tao.
* Khong lam dung border-radius qua kho (nhu bo tron 9999px cho tat ca moi card).
* Khong su dung cac badge/tag dang pill rai rac khap man hinh ma khong phuc vu muc dich phan loai cu the.
* Khong chen cac cau van chao hoi ruom ra, van hoa khong can thiet. Ngon ngu giao dien phai ngan gon, chinh xac, mang tinh cong cu (functional microcopy).
* Khong de layout trong trai voi 1 vai card to bat thuong; thong tin phai co mat do hop ly (density) tuong tu cac ung dung cao cap nhu Spotify, Apple Music, Tidal.

---

## 2. HE THONG THIET KE UI/UX (DESIGN SYSTEM)

### 2.1. Bang mau (Color Palette)
Tempo su dung giao dien Dark Mode cao cap lam trong tam (Dark-first UI) voi sac do trung tinh sau, tranh mau den tuyet doi (#000000) de giam moi mat:

* Background Primary: #0A0A0C (Nen chinh)
* Background Secondary: #121216 (Nen card, surface, modal)
* Background Tertiary: #1A1A22 (Nen input, hover state, active pill)
* Border / Divider: #262630 (Duong ke phan cach manh 1px)
* Text Primary: #F4F4F6 (Tieu de, ten bai hat, van ban quan trong)
* Text Secondary: #8E8E9F (Ten ca si, thoi luong, nhan phu)
* Text Muted: #565666 (Placeholder, disabled state, metadata nho)
* Accent Primary: #22C55E hoac #FA586A (Diem nhan hanh dong chinh: Play button, active slider)

### 2.2. Quy chuan Typography
* Su dung font he thong (San Francisco tren iOS, Roboto/Inter tren Android).
* Phan cap kich thuoc ro rang:
  * Heading 1 (Screen Title): 28px, Font-weight: 700, Line-height: 34px
  * Heading 2 (Section Title): 20px, Font-weight: 600, Line-height: 26px
  * Body Regular (Song Title, Item Name): 15px, Font-weight: 500, Line-height: 20px
  * Subtitle / Metadata (Artist Name, Album): 13px, Font-weight: 400, Line-height: 18px
  * Caption / Timecode (03:42, Label nho): 11px, Font-weight: 500, Tabular figures
* Quy tac hien thi chuoi dai: Moi ten bai hat va ten ca si bat buoc phai co numberOfLines={1} kem thuoc tinh cat chu ellipsizeMode="tail", khong bao gio de text vo dong lam meo layout.

### 2.3. Quy chuan Khoang cach & Kich thuoc (Layout & Touch Targets)
* Tuan thu he thong luoi 4px / 8px: gap-2 (8px), gap-3 (12px), gap-4 (16px), p-4 (16px), p-5 (20px).
* Vung cham toi thieu (Touch Target): Moi nut bam, icon dieu khien phai co vung bam toi thieu 44x44px de de cham tren man hinh cam ung.

### 2.4. Xu ly Trang thai Giao dien (State Completeness)
Moi man hinh va component danh sach deu phai xu ly day du 4 trang thai:
1. Loading State: Su dung Skeleton Shimmer Loader co dung kich thuoc va hinh dang cua card/item thuc te. Tuyet doi khong chi dat mot ActivityIndicator xoay tron giua man hinh trong.
2. Error State: Hien thi thong diep ngan gon, ly do ro rang kem nut Retry (Thu lai).
3. Empty State: Hinh minh hoa vector toi gian, giai thich danh sach trong va kem nut hanh dong (vi du: Kham pha bai hat moi).
4. Data State: Hien thi danh sach muot ma, ho tro keo de lam moi (Pull-to-Refresh).

---

## 3. TIEU CHUAN MA NGUON FRONTEND (REACT NATIVE / EXPO)

### 3.1. Cau truc Thu muc va Phan tach Trach nhiem
FE/
├── src/
│   ├── api/             # Ket noi Backend & Supabase Client
│   ├── components/      # UI components tai su dung (Button, Card, MiniPlayer, Item)
│   ├── constants/       # Theme, Colors, API Config, Layout constants
│   ├── hooks/           # Custom React hooks (useAudioPlayer, useDebounce)
│   ├── navigation/      # Stack, Tab Navigator, RootContainer
│   ├── screens/         # Man hinh chinh (chi lam nhiem vu lap rap components)
│   ├── services/        # Audio engine, Background service, Cache engine
│   ├── store/           # Zustand stores (PlayerStore, QueueStore, AuthStore)
│   ├── types/           # Toan bo TypeScript interfaces / types tap trung
│   └── utils/           # Helper functions (formatTime, sanitizeString)

### 3.2. Quy tac Viet Code TypeScript & React
* Khong su dung kieu any: Moi doi tuong (Song, Artist, Album, Playlist, User) phai duoc dinh nghia tuong minh trong thu muc types/.
* Phan tach Logic va Giao dien: Tach business logic vao Custom Hooks. Screen chi tap trung render layout.
* Tranh Re-render thua: Tien do phat nhac (currentTime) khong duoc dat chung trong Store lam re-render toan bo cay component.
* Xu ly Audio Player muot ma: Ho tro Audio Focus, Background Playback, Lock Screen Controls.

---

## 4. TIEU CHUAN MA NGUON BACKEND (NODE.JS / EXPRESS)

### 4.1. Cau truc Thu muc Backend
BE/
├── src/
│   ├── config/          # Cau hinh moi truong, bien ENV
│   ├── controllers/     # Dieu huong luong xu ly request/response
│   ├── middlewares/     # Rate limit, error handler, request logger
│   ├── routes/          # Khai bao endpoints API
│   ├── services/        # Business logic: ZingMp3 adapter, Gemini service
│   ├── types/           # TypeScript / JSDoc definition
│   └── utils/           # Ham tien ich ma hoa, dinh dang du lieu
├── server.js (hoac index.ts)
└── package.json

### 4.2. Chuan hoa Phan hoi API (API Response Standard)
Tat ca API tra ve tu Backend bat buoc tuan theo cau truc JSON chuan:
{
  "success": true,
  "data": { ... },
  "message": null
}

Truong hop say ra loi:
{
  "success": false,
  "data": null,
  "error": {
    "code": "SONG_NOT_FOUND",
    "message": "Khong tim thay bai hat yeu cau hoac bai hat da bi gioi han ban quyen."
  }
}

### 4.3. Caching & Toi uu hieu nang
* Cache ket qua tu Zing MP3 (Bang xep hang, danh muc thinh hanh) trong bo nho (In-memory Cache / Redis) trong 5-15 phut de tranh goi don dap vao server nguon.
