import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyText } from "@/lib/slugify";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  created_at: string | null;
}

function AdminCategoriesContent() {
  const { toast } = useToast();
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [slugOverride, setSlugOverride] = useState("");

  async function loadCategories() {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name, slug, created_at")
      .order("name", { ascending: true });
    setLoading(false);
    if (error) {
      toast({
        title: "Cannot load categories",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setRows((data as CategoryRow[]) ?? []);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q),
    );
  }, [rows, search]);

  async function resolveUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    for (let n = 0; n < 40; n++) {
      const { data } = await supabase.from("product_categories").select("id").eq("slug", candidate).maybeSingle();
      if (!data) return candidate;
      candidate = `${base}-${n + 2}`;
    }
    return `${base}-${crypto.randomUUID().slice(0, 8)}`;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }
    const baseSlug = slugOverride.trim() || slugifyText(name.trim(), "category");
    const slug = await resolveUniqueSlug(baseSlug);

    setSaving(true);
    const { error } = await supabase.from("product_categories").insert({
      name: name.trim(),
      slug,
    });
    setSaving(false);

    if (error) {
      toast({
        title: "Could not create category",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Category added" });
    setName("");
    setSlugOverride("");
    await loadCategories();
  }

  const card = "rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800/90 dark:bg-[#121214]";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Categories</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Add categories and use them in the Items page.
        </p>
      </div>

      <form onSubmit={handleCreate} className={`${card} space-y-5`}>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Add category</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Category name *</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wreaths"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug (optional)</Label>
            <Input
              id="cat-slug"
              value={slugOverride}
              onChange={(e) => setSlugOverride(e.target.value)}
              placeholder="e.g. wreaths"
            />
          </div>
        </div>
        <div className="flex justify-end border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Button type="submit" disabled={saving} className="bg-[#f43f5e] hover:bg-[#e11d48]">
            {saving ? "Saving..." : "Save category"}
          </Button>
        </div>
      </form>

      <section className={card}>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Category list</h2>
        <div className="mb-3 mt-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter categories by name or slug..."
          />
        </div>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-500">
          {loading ? "Loading..." : `${filtered.length} categories`}
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Slug</th>
                <th className="py-2 pr-0">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-zinc-200/80 dark:border-zinc-800/70">
                  <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{row.name}</td>
                  <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{row.slug}</td>
                  <td className="py-2 pr-0 text-zinc-600 dark:text-zinc-400">
                    {row.created_at ? new Date(row.created_at).toLocaleDateString("en-PH") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <p className="py-6 text-center text-zinc-500">No categories yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <AdminShell>
      <AdminCategoriesContent />
    </AdminShell>
  );
}

