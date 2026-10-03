import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { newsImageUrl } from "@/lib/news";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Plus, Image as ImageIcon } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Article = Tables<"news_articles">;

export default function NewsTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Article | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function refresh() {
    const { data, error } = await supabase.from("news_articles").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Could not load news", description: error.message, variant: "destructive" });
    else setItems(data ?? []);
  }

  useEffect(() => { void refresh(); }, []);

  async function start(article?: Article) {
    setEditing(article ?? null);
    setTitle(article?.title ?? "");
    setSummary(article?.summary ?? "");
    setBody(article?.body ?? "");
    setPhoto(null);
    setPreview(article?.image_path ? await newsImageUrl(article.image_path) : null);
    setOpen(true);
  }

  async function save(publish: boolean) {
    if (!title.trim() || !summary.trim() || !body.trim()) {
      toast({ title: "Complete the article", description: "Title, summary and article text are required.", variant: "destructive" });
      return;
    }
    setBusy(true);
    let uploadedPath: string | null = null;
    try {
      if (photo) {
        if (!photo.type.startsWith("image/") || photo.size > 5 * 1024 * 1024) throw new Error("Choose an image under 5 MB.");
        const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
        uploadedPath = `${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("news-images").upload(uploadedPath, photo, { contentType: photo.type });
        if (error) throw error;
      }
      const { data: { user } } = await supabase.auth.getUser();
      const values = {
        title: title.trim(), summary: summary.trim(), body: body.trim(),
        image_path: uploadedPath ?? editing?.image_path ?? null,
        published: publish,
        published_at: publish ? editing?.published_at ?? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      const { error } = editing
        ? await supabase.from("news_articles").update(values).eq("id", editing.id)
        : await supabase.from("news_articles").insert({ ...values, author_id: user?.id ?? null });
      if (error) throw error;
      if (uploadedPath && editing?.image_path) await supabase.storage.from("news-images").remove([editing.image_path]);
      setOpen(false);
      setPhoto(null);
      toast({ title: publish ? "Article published" : "Draft saved" });
      await refresh();
    } catch (error) {
      if (uploadedPath) await supabase.storage.from("news-images").remove([uploadedPath]);
      toast({ title: "Could not save article", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally { setBusy(false); }
  }

  async function remove(article: Article) {
    if (!window.confirm(`Delete “${article.title}”?`)) return;
    const { error } = await supabase.from("news_articles").delete().eq("id", article.id);
    if (error) return toast({ title: "Could not delete article", description: error.message, variant: "destructive" });
    if (article.image_path) await supabase.storage.from("news-images").remove([article.image_path]);
    await refresh();
  }

  async function toggle(article: Article) {
    const { error } = await supabase.from("news_articles").update({
      published: !article.published,
      published_at: article.published ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", article.id);
    if (error) toast({ title: "Could not change publication", description: error.message, variant: "destructive" });
    else await refresh();
  }

  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">News articles</h2>
      <Button onClick={() => void start()}><Plus /> New article</Button>
    </div>
    {open && <Card>
      <CardHeader><CardTitle>{editing ? "Edit article" : "New article"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label htmlFor="news-title">Title</Label><Input id="news-title" value={title} maxLength={180} onChange={e => setTitle(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="news-summary">Summary</Label><Textarea id="news-summary" value={summary} maxLength={500} onChange={e => setSummary(e.target.value)} rows={2} /></div>
        <div className="space-y-2"><Label htmlFor="news-body">Article</Label><Textarea id="news-body" value={body} onChange={e => setBody(e.target.value)} rows={12} /></div>
        <div className="space-y-2"><Label htmlFor="news-photo">Photo (optional, up to 5 MB)</Label><Input id="news-photo" type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] ?? null)} />{preview && !photo && <img src={preview} alt="Current article" className="h-36 w-auto object-cover" />}{photo && <p className="text-sm text-muted-foreground">{photo.name}</p>}</div>
        <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => void save(true)}>{busy ? "Saving…" : "Publish"}</Button><Button disabled={busy} variant="secondary" onClick={() => void save(false)}>Save draft</Button><Button disabled={busy} variant="outline" onClick={() => setOpen(false)}>Cancel</Button></div>
      </CardContent>
    </Card>}
    {items.length === 0 ? <p className="text-muted-foreground">No articles yet.</p> : <div className="grid gap-3">{items.map(article => <div key={article.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border py-4">
      <div className="min-w-0"><p className="font-semibold break-words">{article.title}</p><p className="text-sm text-muted-foreground">{article.published ? "Published" : "Draft"} · {new Date(article.published_at ?? article.created_at).toLocaleDateString()} {article.image_path && <ImageIcon className="inline size-4" />}</p></div>
      <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => void start(article)} title="Edit"><Pencil /> Edit</Button><Button size="sm" variant="secondary" onClick={() => void toggle(article)}>{article.published ? "Unpublish" : "Publish"}</Button><Button size="sm" variant="destructive" onClick={() => void remove(article)} title="Delete"><Trash2 /> Delete</Button></div>
    </div>)}</div>}
  </div>;
}