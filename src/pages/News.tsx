import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { newsImageUrl } from "@/lib/news";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Article = Tables<"news_articles"> & { imageUrl?: string | null };

const News = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Article | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await supabase.from("news_articles").select("*").eq("published", true).order("published_at", { ascending: false });
      if (!active) return;
      if (error) setError(true);
      else {
        const items = await Promise.all((data ?? []).map(async item => ({ ...item, imageUrl: await newsImageUrl(item.image_path) })));
        if (active) setArticles(items);
      }
      if (active) setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-14 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold">News & Events</h1>
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            {loading ? <p className="text-muted-foreground">Loading news…</p> : error ? <p className="text-destructive">News is unavailable right now.</p> : articles.length === 0 ? <p className="text-muted-foreground">No news has been published yet.</p> :
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{articles.map(item => <article key={item.id} className="border-b border-border pb-6">
                {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full aspect-[4/3] object-cover rounded-md mb-4" />}
                <time className="text-sm text-muted-foreground">{new Date(item.published_at ?? item.created_at).toLocaleDateString()}</time>
                <h2 className="text-2xl font-bold mt-2 mb-3">{item.title}</h2>
                <p className="text-muted-foreground mb-4">{item.summary}</p>
                <Button variant="link" className="px-0" onClick={() => setSelected(item)}>Read article →</Button>
              </article>)}</div>}
          </div>
        </section>
        <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-2xl pr-6">{selected?.title}</DialogTitle></DialogHeader>
            {selected && <article>
              <time className="text-sm text-muted-foreground">{new Date(selected.published_at ?? selected.created_at).toLocaleDateString()}</time>
              {selected.imageUrl && <img src={selected.imageUrl} alt={selected.title} className="w-full max-h-[28rem] object-contain my-5" />}
              <p className="font-medium my-4">{selected.summary}</p>
              <div className="whitespace-pre-wrap leading-relaxed text-foreground">{selected.body}</div>
            </article>}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default News;
