# Tivi — IPTV Web Player

Xem truyền hình IPTV trực tiếp trên trình duyệt. Tải danh sách kênh M3U, duyệt và phát stream — tất cả trong giao diện web nhẹ, responsive.

## Tính năng

- **Upload playlist M3U** — qua URL hoặc file local
- **Phát stream** — HLS (`.m3u8`) với HLS.js, fallback `<video>` cho MP4/TS
- **Danh sách kênh** — grid với logo, group, tìm kiếm/lọc
- **Sidebar kênh** — chuyển kênh nhanh khi đang xem
- **Nhiều playlist** — lưu và chuyển đổi giữa các danh sách
- **Link mặc định** — tự động tải playlist khi vào app
- **Giao diện** — sáng/tối/theo hệ thống, responsive mobile & desktop
- **Persist dữ liệu** — IndexedDB, F5 không mất danh sách kênh

## Tech Stack

| Công nghệ | Mục đích |
|---|---|
| **Next.js 16** (App Router) | SSR landing, client components cho player |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Styling responsive |
| **shadcn/ui** + **Radix UI** | UI components (Dialog, Tabs, Toast, ScrollArea, DropdownMenu) |
| **HLS.js** | Phát stream `.m3u8` trong browser |
| **idb** | IndexedDB wrapper — lưu channels & playlists |
| **lucide-react** | Icons |
| **sonner** | Toast notifications |

## Cấu trúc thư mục

```
src/
├── app/
│   ├── layout.tsx            # Root layout + providers
│   ├── page.tsx              # Landing: upload URL / file + recent playlists
│   ├── channels/
│   │   ├── page.tsx          # Danh sách kênh (grid)
│   │   └── [id]/page.tsx     # Trang xem kênh + player + sidebar
│   └── settings/
│       └── page.tsx          # Cài đặt playlist & giao diện
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── playlist-uploader.tsx  # Form upload file/URL
│   ├── channel-grid.tsx       # Grid hiển thị kênh
│   ├── channel-card.tsx       # Card từng kênh
│   ├── channel-sidebar.tsx    # Sidebar chuyển kênh khi đang xem
│   ├── video-player.tsx       # HLS.js player + fallback
│   ├── navbar.tsx             # Thanh điều hướng
│   └── providers.tsx          # Client providers wrapper
├── hooks/
│   ├── use-playlist.tsx       # Context + hook quản lý playlist
│   ├── use-player.tsx         # Context + hook quản lý player state
│   └── use-theme.tsx          # Hook theme (sáng/tối/hệ thống)
└── lib/
    ├── types.ts               # Channel, PlaylistMeta interfaces
    ├── m3u-parser.ts          # Parse M3U → Channel[]
    ├── storage.ts             # IndexedDB CRUD
    └── utils.ts               # cn() helper
```

## Data Flow

```
User uploads file / nhập URL
        ↓
fetch() / FileReader → raw text
        ↓
M3U Parser → regex parse #EXTINF + URL → Channel[]
        ↓
IndexedDB → lưu channels + playlists
        ↓
PlaylistContext → load channels, cung cấp cho Grid/Player
        ↓
User click kênh → navigate /channels/[id]
        ↓
HLS.js instance → play stream (hoặc <video> native cho MP4/TS)
```

## Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Mở [http://localhost:3000](http://localhost:3000) và upload playlist M3U để bắt đầu.

## Playlist mẫu


## Lưu ý kỹ thuật

- **CORS**: Stream ngoài có thể bị chặn — cần proxy nếu cần
- **HLS.js destroy**: Gọi `hls.destroy()` trong `useEffect` cleanup để tránh memory leak
- **SSR**: `hls.js` và `idb` chỉ chạy client — dùng dynamic import `{ ssr: false }`
- **M3U lớn**: File có thể 5000+ kênh — parse streaming nếu cần tối ưu
