"use client";
import { useState, useEffect } from "react";
import { usePlaylist } from "@/hooks/use-playlist";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Sun, Moon, Monitor, Link2, Loader2, RefreshCw } from "lucide-react";
import { getDefaultLink, setDefaultLink } from "@/lib/storage";
import { toast } from "sonner";

export default function SettingsPage() {
  const { allPlaylists, removePlaylist, loadPlaylist, fetchAndSaveFromUrl } =
    usePlaylist();
  const { theme, setTheme } = useTheme();

  const [defaultUrl, setDefaultUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);

  // Load current default link
  useEffect(() => {
    getDefaultLink().then((url) => {
      if (url) setDefaultUrl(url);
    });
  }, []);

  const handleSaveDefaultLink = async () => {
    const trimmed = defaultUrl.trim();
    if (!trimmed) {
      await setDefaultLink(null);
      toast.success("Đã xoá link mặc định");
      return;
    }
    setSaving(true);
    try {
      await setDefaultLink(trimmed);
      toast.success("Đã lưu link mặc định");
    } finally {
      setSaving(false);
    }
  };

  const handleReloadFromDefault = async () => {
    const link = defaultUrl.trim();
    if (!link) {
      toast.error("Chưa có link mặc định");
      return;
    }
    setReloading(true);
    try {
      await fetchAndSaveFromUrl(link);
      toast.success("Đã tải lại danh sách kênh");
    } catch (err: any) {
      toast.error(err.message || "Không thể tải playlist");
    } finally {
      setReloading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 py-4">
      <h1 className="text-2xl font-bold">Cài đặt</h1>

      {/* Nguồn mặc định */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nguồn playlist mặc định</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Link M3U sẽ tự động tải mỗi khi vào app (nếu chưa có playlist nào được lưu).
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://example.com/playlist.m3u"
                value={defaultUrl}
                onChange={(e) => setDefaultUrl(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSaveDefaultLink} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReloadFromDefault}
              disabled={reloading || !defaultUrl.trim()}
            >
              {reloading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Tải lại từ link
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                setDefaultUrl("");
                await setDefaultLink(null);
                toast.success("Đã xoá link mặc định");
              }}
            >
              Xoá
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Giao diện */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Giao diện</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4 mr-1" />
              Tối
            </Button>
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4 mr-1" />
              Sáng
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("system")}
            >
              <Monitor className="h-4 w-4 mr-1" />
              Hệ thống
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Playlists */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách kênh đã lưu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {allPlaylists.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có playlist nào</p>
          ) : (
            allPlaylists.map((pl) => (
              <div
                key={pl.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg border hover:bg-accent transition-colors"
              >
                <button
                  onClick={() => loadPlaylist(pl.id)}
                  className="text-left flex-1"
                >
                  <p className="text-sm font-medium">{pl.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pl.channelCount} kênh &middot;{" "}
                    {new Date(pl.createdAt).toLocaleDateString("vi-VN")}
                    {pl.source === "url" && " · URL"}
                    {pl.source === "file" && " · File"}
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePlaylist(pl.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
