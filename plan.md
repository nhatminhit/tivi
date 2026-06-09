# Kế hoạch Web IPTV — Xem tivi online

## Tech Stack

| Công nghệ | Lý do |
|---|---|
| **Next.js 14 (App Router) + TypeScript** | SSR cho landing, client components cho player. Dễ deploy (Vercel) và chạy local |
| **Tailwind CSS** | Styling nhanh, responsive ngay từ đầu |
| **shadcn/ui** | Thư viện component gốc (Button, Input, Dialog, Card, Sheet) |
| **HLS.js** | Phát stream .m3u8 trong browser. Nhẹ (~25KB gzipped), adaptive bitrate |
| **idb (IndexedDB)** | Lưu danh sách kênh (M3U có thể 5000+ kênh, localStorage không đủ) |
| **lucide-react** | Icon |

Tự viết M3U parser — logic không phức tạp, tránh phụ thuộc thư viện ngoài.

## Nguồn IPTV mẫu

```
https://github.com/vietng228/m3u/blob/main/new.m3u
```

## Cấu trúc thư mục

```
tivi/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout + providers
│   │   ├── page.tsx              # Landing: upload URL / file
│   │   ├── channels/
│   │   │   ├── page.tsx          # Danh sách kênh (grid)
│   │   │   └── [id]/page.tsx     # Trang xem kênh + player
│   │   └── settings/
│   │       └── page.tsx          # Cài đặt playlist
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── playlist-uploader.tsx
│   │   ├── channel-grid.tsx
│   │   ├── channel-card.tsx
│   │   ├── video-player.tsx
│   │   └── search-bar.tsx
│   ├── lib/
│   │   ├── m3u-parser.ts         # Parse nội dung M3U → Channel[]
│   │   ├── storage.ts            # IndexedDB wrapper (lưu/tải playlist)
│   │   └── types.ts              # Type definitions
│   └── hooks/
│       ├── use-playlist.ts       # Context + hook quản lý playlist
│       └── use-player.ts         # Context + hook quản lý player state
├── public/
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Data Flow

```
1. User uploads file / nhập URL → fetch() / FileReader → raw text
       ↓
2. M3U Parser (m3u-parser.ts) — parse #EXTINF lines + URLs → Channel[]
       ↓
3. Storage (storage.ts) — lưu Channel[] vào IndexedDB, metadata vào localStorage
       ↓
4. PlaylistContext (use-playlist.ts) — load channels, cung cấp cho Grid/List
       ↓
5. User click kênh → navigate /channels/[id]
       ↓
6. PlayerContext + HLS.js instance → play stream
```

## Các Phase

### Phase 1: MVP
1. Init project: Next.js + Tailwind + shadcn/ui
2. Types + M3U Parser: `Channel` type, regex parse #EXTINF + URLs
3. Storage layer: IndexedDB wrapper (idb), CRUD playlist
4. Upload page: form URL + drag-drop file, toast feedback
5. Channels page: grid/list channels từ IndexedDB
6. Player page: HLS.js + fallback `<video>` cho MP4/TS
7. Responsive UI hoàn chỉnh

### Phase 2: Mở rộng
8. Tìm kiếm/lọc kênh
9. Nhiều playlist — chuyển đổi
10. Settings — quản lý playlist, xoá cache
11. Tối ưu: lazy load, skeleton loading

## Kiến trúc component chính

### video-player.tsx
- Props: `channelUrl: string`, `channelName: string`
- HLS.js cho `.m3u8`, `<video>` native cho MP4/TS
- `hls.destroy()` khi unmount — tránh memory leak

### m3u-parser.ts
- Pure function, regex: `#EXTINF:-1(.*?)\n(https?://\S+)`
- Extract: `tvg-id`, `tvg-logo`, `group-title`, `tvg-name`
- Output: `Channel[]`

### storage.ts
- Dùng `idb` wrapper
- Object stores: `channels`, `playlists`
- API: `savePlaylist()`, `loadPlaylist()`, `listPlaylists()`, `deletePlaylist()`

## Lưu ý kỹ thuật

- **CORS**: Stream ngoài có thể bị chặn → proxy option
- **HLS.js destroy**: Gọi trong useEffect cleanup
- **SSR**: `hls.js` + `idb` chỉ chạy client → dynamic import `{ ssr: false }`
- **File size**: M3U lớn → parse streaming nếu cần

## Verification

1. `npm run dev` → localhost:3000
2. Upload M3U → danh sách kênh hiển thị đúng
3. Click kênh → player phát stream
4. Responsive mobile/desktop
5. F5 refresh — data còn (IndexedDB persist)
