"use client";
import { useState, useCallback } from "react";
import { Upload, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { parseM3U, generatePlaylistId } from "@/lib/m3u-parser";
import { usePlaylist } from "@/hooks/use-playlist";
import { toast } from "sonner";

export default function PlaylistUploader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { saveAndActivate } = usePlaylist();

  const processChannels = useCallback(
    async (content: string, sourceName: string, sourceType: "url" | "file", sourceUrl?: string) => {
      const channels = parseM3U(content);
      if (channels.length === 0) {
        toast.error("Không tìm thấy kênh nào trong file. Kiểm tra lại nội dung M3U.");
        return;
      }

      await saveAndActivate(
        {
          id: generatePlaylistId(),
          name: sourceName,
          source: sourceType,
          url: sourceUrl,
          channelCount: channels.length,
          createdAt: Date.now(),
        },
        channels
      );

      toast.success(`Đã tải ${channels.length} kênh từ "${sourceName}"`);
    },
    [saveAndActivate]
  );

  const handleUrlSubmit = async () => {
    if (!url.trim()) {
      toast.error("Vui lòng nhập URL playlist");
      return;
    }

    setLoading(true);
    try {
      // Try raw URL first, then GitHub blob URL conversion
      let fetchUrl = url.trim();

      // Convert GitHub blob URL to raw URL
      if (fetchUrl.includes("github.com") && fetchUrl.includes("/blob/")) {
        fetchUrl = fetchUrl.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
      }

      const res = await fetch(fetchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TiviIPTV/1.0)",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const content = await res.text();
      const name = fetchUrl.split("/").pop() || "Playlist từ URL";
      await processChannels(content, name, "url", url.trim());
      setUrl("");
    } catch (err) {
      toast.error("Không thể tải playlist từ URL. Kiểm tra lại đường dẫn.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const content = await file.text();
      await processChannels(content, file.name, "file");
    } catch (err) {
      toast.error("Không thể đọc file. Đảm bảo file là định dạng M3U hợp lệ.");
    } finally {
      setLoading(false);
      // Reset input so re-upload of same file triggers change
      e.target.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleUrlSubmit();
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-4">
        {/* URL input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nhập URL playlist M3U..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="pl-9"
            />
          </div>
          <Button onClick={handleUrlSubmit} disabled={loading || !url.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tải"}
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">hoặc</span>
          </div>
        </div>

        {/* File upload */}
        <div className="flex justify-center">
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-6 py-3 border-2 border-dashed rounded-lg hover:bg-accent transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {loading ? "Đang xử lý..." : "Chọn file M3U / M3U8"}
              </span>
            </div>
            <input
              type="file"
              accept=".m3u,.m3u8,audio/x-mpegurl,application/x-mpegurl"
              onChange={handleFileUpload}
              disabled={loading}
              className="hidden"
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
