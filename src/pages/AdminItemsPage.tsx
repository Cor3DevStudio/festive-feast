import { useEffect, useMemo, useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { slugifyText } from "@/lib/slugify";
import { supabase } from "@/lib/supabase";
import { useProducts } from "@/context/ProductsContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { uploadProductImageFile } from "@/lib/uploadProductImage";
import { cn } from "@/lib/utils";

const DEFAULT_CATEGORIES: { value: string; label: string }[] = [
  { value: "parols", label: "Parols" },
  { value: "lights", label: "Lights" },
  { value: "holiday-decor", label: "Holiday decor" },
];

function parseSizes(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseImageUrls(raw: string): string[] {
  return raw
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

interface AdminItemRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  in_stock: boolean;
  stock_count: number | null;
  updated_at: string | null;
  created_at: string | null;
  is_hidden: boolean;
  description: string;
  full_description: string;
  sizes: string[];
  images: string[];
  size_prices: Record<string, number> | null;
  price_range_min: number | null;
  price_range_max: number | null;
  badge: string | null;
  materials: string | null;
  dimensions: string | null;
  sort_order: number;
}

type VisibilityFilter = "all" | "visible" | "hidden";

function AdminItemsContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { refetchProducts } = useProducts();
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>(DEFAULT_CATEGORIES);
  const [items, setItems] = useState<AdminItemRow[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminItemRow | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [slugOverride, setSlugOverride] = useState("");
  const [category, setCategory] = useState("parols");
  const [pricePesos, setPricePesos] = useState("");
  const [description, setDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [sizesRaw, setSizesRaw] = useState("");
  const [imagesRaw, setImagesRaw] = useState("");
  const [inStock, setInStock] = useState(true);
  const [badge, setBadge] = useState("");
  const [materials, setMaterials] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [stockCount, setStockCount] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);

  async function loadItems() {
    setLoadingItems(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false, nullsFirst: false });
    setLoadingItems(false);
    if (error) {
      toast({ title: "Could not load items", description: error.message, variant: "destructive" });
      return;
    }
    const rows = (data ?? []) as Record<string, unknown>[];
    setItems(
      rows.map((row) => {
        const sizesRaw = row.sizes;
        const sizes = Array.isArray(sizesRaw)
          ? sizesRaw.map((s) => String(s))
          : typeof sizesRaw === "string"
            ? [sizesRaw]
            : [];
        const imagesRaw = row.images;
        const images = Array.isArray(imagesRaw) ? imagesRaw.map((s) => String(s)) : [];
        let size_prices: Record<string, number> | null = null;
        if (row.size_prices && typeof row.size_prices === "object" && !Array.isArray(row.size_prices)) {
          const o = row.size_prices as Record<string, unknown>;
          size_prices = {};
          for (const [k, v] of Object.entries(o)) {
            const n = typeof v === "number" ? v : Number(v);
            if (Number.isFinite(n)) size_prices[k] = n;
          }
          if (Object.keys(size_prices).length === 0) size_prices = null;
        }
        return {
          id: String(row.id ?? ""),
          name: String(row.name ?? ""),
          slug: typeof row.slug === "string" && row.slug.trim() ? row.slug : `item-${String(row.id ?? "")}`,
          category: String(row.category ?? ""),
          price: typeof row.price === "number" ? row.price : Number(row.price ?? 0),
          in_stock: row.in_stock === true,
          stock_count:
            row.stock_count === null || row.stock_count === undefined
              ? null
              : typeof row.stock_count === "number"
                ? row.stock_count
                : Number(row.stock_count),
          updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
          created_at: typeof row.created_at === "string" ? row.created_at : null,
          is_hidden: row.is_hidden === true,
          description: String(row.description ?? ""),
          full_description: String(row.full_description ?? ""),
          sizes,
          images,
          size_prices,
          price_range_min:
            row.price_range_min === null || row.price_range_min === undefined
              ? null
              : typeof row.price_range_min === "number"
                ? row.price_range_min
                : Number(row.price_range_min),
          price_range_max:
            row.price_range_max === null || row.price_range_max === undefined
              ? null
              : typeof row.price_range_max === "number"
                ? row.price_range_max
                : Number(row.price_range_max),
          badge: typeof row.badge === "string" && row.badge.trim() ? row.badge : null,
          materials: typeof row.materials === "string" ? row.materials : null,
          dimensions: typeof row.dimensions === "string" ? row.dimensions : null,
          sort_order: typeof row.sort_order === "number" ? row.sort_order : Number(row.sort_order ?? 0),
        };
      }),
    );
  }

  useEffect(() => {
    let cancelled = false;
    async function loadCategoryOptions() {
      const { data, error } = await supabase
        .from("product_categories")
        .select("name, slug")
        .order("name", { ascending: true });
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setCategoryOptions(DEFAULT_CATEGORIES);
        return;
      }
      const options = data.map((row) => ({ value: row.slug, label: row.name }));
      setCategoryOptions(options);
      setCategory((prev) => (options.some((c) => c.value === prev) ? prev : options[0].value));
    }
    loadCategoryOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadItems();
  }, []);

  async function resolveUniqueSlug(base: string, excludeProductId?: string): Promise<string> {
    let candidate = base;
    for (let n = 0; n < 40; n++) {
      let q = supabase.from("products").select("id").eq("slug", candidate);
      if (excludeProductId) q = q.neq("id", excludeProductId);
      const { data } = await q.maybeSingle();
      if (!data) return candidate;
      candidate = `${base}-${n + 2}`;
    }
    return `${base}-${crypto.randomUUID().slice(0, 8)}`;
  }

  function resetItemForm() {
    setName("");
    setSlugOverride("");
    setCategory((prev) => (categoryOptions.some((c) => c.value === prev) ? prev : categoryOptions[0]?.value ?? "parols"));
    setPricePesos("");
    setDescription("");
    setFullDescription("");
    setSizesRaw("");
    setImagesRaw("");
    setInStock(true);
    setBadge("");
    setMaterials("");
    setDimensions("");
    setStockCount("");
    setEditingId(null);
    setFormMode("add");
  }

  function openAddForm() {
    resetItemForm();
    setFormMode("add");
    setShowItemForm(true);
  }

  async function handleProductImageFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    if (!user?.id) {
      toast({ title: "Sign in required", description: "Refresh and sign in as admin again.", variant: "destructive" });
      return;
    }
    setUploadingImages(true);
    const urls: string[] = [];
    for (const file of Array.from(fileList)) {
      const { url, error } = await uploadProductImageFile(user.id, file);
      if (error) {
        toast({ title: "Upload failed", description: error, variant: "destructive" });
        setUploadingImages(false);
        return;
      }
      if (url) urls.push(url);
    }
    if (urls.length > 0) {
      setImagesRaw((prev) => {
        const base = prev.trim();
        return base ? `${base}\n${urls.join("\n")}` : urls.join("\n");
      });
      toast({ title: "Images uploaded", description: `${urls.length} public URL(s) added to the list below.` });
    }
    setUploadingImages(false);
  }

  function openEditForm(item: AdminItemRow) {
    setFormMode("edit");
    setEditingId(item.id);
    setName(item.name);
    setSlugOverride(item.slug);
    setCategory(item.category);
    setPricePesos(String(item.price ?? ""));
    setDescription(item.description);
    setFullDescription(item.full_description);
    setSizesRaw(item.sizes.length ? item.sizes.join(", ") : "");
    setImagesRaw(item.images.join("\n"));
    setInStock(item.in_stock);
    setBadge(item.badge ?? "");
    setMaterials(item.materials ?? "");
    setDimensions(item.dimensions ?? "");
    setStockCount(item.stock_count != null ? String(item.stock_count) : "");
    setShowItemForm(true);
  }

  async function setItemHidden(item: AdminItemRow, hidden: boolean) {
    const { error } = await supabase.from("products").update({ is_hidden: hidden }).eq("id", item.id);
    if (error) {
      toast({ title: "Could not update item", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: hidden ? "Item hidden" : "Item visible", description: hidden ? "Hidden from the storefront." : "Shown on the storefront again." });
    await loadItems();
    await refetchProducts();
  }

  async function confirmDeleteItem() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    const { error } = await supabase.from("products").delete().eq("id", id);
    setDeleteTarget(null);
    if (error) {
      toast({ title: "Could not delete item", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Item deleted", description: "Removed from the catalog." });
    await loadItems();
    await refetchProducts();
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (visibilityFilter === "visible" && item.is_hidden) return false;
      if (visibilityFilter === "hidden" && !item.is_hidden) return false;
      return true;
    });
  }, [items, visibilityFilter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const priceNum = Number.parseInt(pricePesos.replace(/[^\d]/g, ""), 10);
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast({ title: "Valid price is required (PHP, whole pesos)", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Short description is required", variant: "destructive" });
      return;
    }
    if (!fullDescription.trim()) {
      toast({ title: "Full description is required", variant: "destructive" });
      return;
    }

    const parsedSizes = parseSizes(sizesRaw);
    const sizes = parsedSizes.length > 0 ? parsedSizes : ["Standard"];

    const images = parseImageUrls(imagesRaw);
    if (images.length === 0) {
      toast({
        title: "At least one image URL is required",
        description: "Use full URLs starting with http:// or https://, one per line.",
        variant: "destructive",
      });
      return;
    }

    const baseSlug = slugOverride.trim() || slugifyText(name.trim());
    const slug =
      formMode === "edit" && editingId
        ? await resolveUniqueSlug(baseSlug, editingId)
        : await resolveUniqueSlug(baseSlug);

    const sizePrices: Record<string, number> = {};
    sizes.forEach((s) => {
      sizePrices[s] = priceNum;
    });
    const prices = Object.values(sizePrices);
    const minP = prices.length > 0 ? Math.min(...prices) : priceNum;
    const maxP = prices.length > 0 ? Math.max(...prices) : priceNum;

    const stockParsed = stockCount.trim() === "" ? null : Number.parseInt(stockCount, 10);

    const rowPayload = {
      name: name.trim(),
      slug,
      category,
      price: priceNum,
      price_range_min: minP,
      price_range_max: maxP === minP ? minP : maxP,
      size_prices: sizePrices,
      description: description.trim(),
      full_description: fullDescription.trim(),
      sizes,
      images,
      badge: badge.trim() || null,
      in_stock: inStock,
      stock_count: stockParsed !== null && Number.isFinite(stockParsed) ? stockParsed : null,
      materials: materials.trim() || null,
      dimensions: dimensions.trim() || null,
    };

    setSubmitting(true);
    let error: { message: string } | null = null;
    if (formMode === "edit" && editingId) {
      const existing = items.find((i) => i.id === editingId);
      const { error: upErr } = await supabase
        .from("products")
        .update({
          ...rowPayload,
          sort_order: existing?.sort_order ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId);
      error = upErr;
    } else {
      const id = `p_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      let sortOrder = 0;
      const { data: maxRow } = await supabase
        .from("products")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      sortOrder = (maxRow?.sort_order ?? 0) + 1;
      const { error: insErr } = await supabase.from("products").insert({
        ...rowPayload,
        id,
        sort_order: sortOrder,
        is_hidden: false,
      });
      error = insErr;
    }

    setSubmitting(false);

    if (error) {
      toast({ title: "Could not save item", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: formMode === "edit" ? "Item updated" : "Item added",
      description: "Saved to the products table.",
    });
    resetItemForm();
    setShowItemForm(false);
    await loadItems();
    await refetchProducts();
  }

  const card =
    "rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800/90 dark:bg-[#121214]";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Items</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Add items to your products table. All fields marked required must be filled before saving.
        </p>
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/80 p-4 text-sm text-zinc-800 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-zinc-200">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">Paano i-edit ang mga naka-post na product</p>
          <p className="mt-1 text-zinc-700 dark:text-zinc-300">
            Sa listahan sa ibaba, pindutin ang <strong>Edit</strong> sa row ng item, o <strong>right-click</strong> sa
            pangalan para sa Edit / Hide / Delete. Ilagay ang corrections sa form, tapos <strong>Save changes</strong>.
          </p>
        </div>
      </div>

      <section className={card}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">All items</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              {loadingItems
                ? "Loading items..."
                : visibilityFilter === "all"
                  ? `${items.length} item${items.length === 1 ? "" : "s"}`
                  : `${filteredItems.length} shown (${items.length} total)`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={visibilityFilter} onValueChange={(v) => setVisibilityFilter(v as VisibilityFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All items</SelectItem>
                <SelectItem value="visible">Visible only</SelectItem>
                <SelectItem value="hidden">Hidden only</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" onClick={openAddForm} className="bg-[#f43f5e] hover:bg-[#e11d48]">
              Add product
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Stock</th>
                <th className="py-2 pr-4">Storefront</th>
                <th className="py-2 pr-4">Updated</th>
                <th className="py-2 pr-0 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <ContextMenu key={item.id}>
                  <ContextMenuTrigger asChild>
                    <tr className="cursor-context-menu border-b border-zinc-200/80 dark:border-zinc-800/70" title="Right-click row for more options">
                      <td className="py-2 pr-4" title="Right-click for Edit, Hide, or Delete">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</p>
                        <p className="text-xs text-zinc-500">{item.slug}</p>
                      </td>
                      <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{item.category}</td>
                      <td className="py-2 pr-4 text-zinc-900 dark:text-zinc-100">
                        ₱{Number(item.price ?? 0).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            item.in_stock
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                              : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
                          )}
                        >
                          {item.in_stock
                            ? `In stock${item.stock_count != null ? ` (${item.stock_count})` : ""}`
                            : "Out of stock"}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            item.is_hidden
                              ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-700/40 dark:text-zinc-300"
                              : "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
                          )}
                        >
                          {item.is_hidden ? "Hidden" : "Visible"}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">
                        {item.updated_at ? new Date(item.updated_at).toLocaleDateString("en-PH") : "—"}
                      </td>
                      <td className="py-2 pr-0 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1 border-zinc-300 dark:border-zinc-600"
                          onClick={() => openEditForm(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="border-zinc-200 dark:border-zinc-800">
                    <ContextMenuItem inset onSelect={() => openEditForm(item)}>
                      Edit
                    </ContextMenuItem>
                    <ContextMenuItem inset onSelect={() => setItemHidden(item, !item.is_hidden)}>
                      {item.is_hidden ? "Unhide" : "Hide"}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      inset
                      className="text-red-600 focus:text-red-600 dark:text-red-400"
                      onSelect={() => setDeleteTarget(item)}
                    >
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </tbody>
          </table>
          {!loadingItems && items.length === 0 && (
            <p className="py-6 text-center text-zinc-500 dark:text-zinc-500">No items found.</p>
          )}
          {!loadingItems && items.length > 0 && filteredItems.length === 0 && (
            <p className="py-6 text-center text-zinc-500 dark:text-zinc-500">No items match this filter.</p>
          )}
        </div>
      </section>

      <Dialog
        open={showItemForm}
        onOpenChange={(open) => {
          setShowItemForm(open);
          if (!open) resetItemForm();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#121214] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-100">
              {formMode === "edit" ? "Edit item" : "Add new item"}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-500">
              {formMode === "edit"
                ? "Update this product. Required fields are marked."
                : "Required fields are marked. Save to add the product to your catalog."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="item-name">
              Name <span className="text-[#f43f5e]">*</span>
            </Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Product display name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-slug">URL slug (optional)</Label>
            <Input
              id="item-slug"
              value={slugOverride}
              onChange={(e) => setSlugOverride(e.target.value)}
              placeholder="Auto from name if empty"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Category <span className="text-[#f43f5e]">*</span>
            </Label>
            <Select value={category} onValueChange={(v) => setCategory(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">
              Need a new category? Add it in the Categories page.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-price">
              Price (PHP) <span className="text-[#f43f5e]">*</span>
            </Label>
            <Input
              id="item-price"
              inputMode="numeric"
              value={pricePesos}
              onChange={(e) => setPricePesos(e.target.value)}
              placeholder="e.g. 1499"
              required
            />
            <p className="text-xs text-zinc-500">Whole pesos.</p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="item-sizes">
              Sizes (optional)
            </Label>
            <Input
              id="item-sizes"
              value={sizesRaw}
              onChange={(e) => setSizesRaw(e.target.value)}
              placeholder='e.g. 12", 18", 24" or Standard'
            />
            <p className="text-xs text-zinc-500">
              Comma-separated. If empty, it defaults to Standard.
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="item-desc">
              Short description <span className="text-[#f43f5e]">*</span>
            </Label>
            <Textarea
              id="item-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One or two sentences for listings"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="item-full">
              Full description <span className="text-[#f43f5e]">*</span>
            </Label>
            <Textarea
              id="item-full"
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Details, materials, what is included…"
              rows={6}
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="item-images">
              Image URLs <span className="text-[#f43f5e]">*</span>
            </Label>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Lantern / product photos</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>
                  <strong>Upload dito:</strong> pumili ng JPEG/PNG/WebP (hanggang 5 MB bawat file). Kailangan muna sa
                  Supabase SQL Editor ang buong{" "}
                  <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">supabase/schema.sql</code>{" "}
                  (Storage → product-images) para gumana ang upload.
                </li>
                <li>
                  <strong>O kaya</strong> i-paste ang public URLs (CDN, Shopify, Google Drive direct link, atbp.) — isang
                  URL kada linya, dapat nagsisimula sa <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">https://</code>.
                </li>
              </ul>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="item-images-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={uploadingImages}
                className="max-w-md cursor-pointer text-sm file:mr-2 file:rounded-md file:border-0 file:bg-zinc-200 file:px-3 file:py-1.5 file:text-sm file:font-medium dark:file:bg-zinc-700"
                onChange={(e) => {
                  void handleProductImageFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {uploadingImages ? (
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading…
                </span>
              ) : null}
            </div>
            <Textarea
              id="item-images"
              value={imagesRaw}
              onChange={(e) => setImagesRaw(e.target.value)}
              placeholder={"https://example.com/parol-1.jpg\nhttps://example.com/parol-2.jpg"}
              rows={4}
              required
            />
            <p className="text-xs text-zinc-500">One URL per line. Must start with http:// or https://</p>
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox
              id="item-stock"
              checked={inStock}
              onCheckedChange={(v) => setInStock(v === true)}
            />
            <Label htmlFor="item-stock" className="cursor-pointer font-normal">
              In stock <span className="text-[#f43f5e]">*</span>
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-stock-count">Stock count (optional)</Label>
            <Input
              id="item-stock-count"
              inputMode="numeric"
              value={stockCount}
              onChange={(e) => setStockCount(e.target.value)}
              placeholder="e.g. 24"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-badge">Badge (optional)</Label>
            <Input
              id="item-badge"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="e.g. Bestseller"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="item-materials">Materials (optional)</Label>
            <Input
              id="item-materials"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="e.g. Capiz shells, bamboo"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="item-dimensions">Dimensions (optional)</Label>
            <Input
              id="item-dimensions"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              placeholder='e.g. 12" diameter'
            />
          </div>
        </div>

            <DialogFooter className="gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowItemForm(false);
                  resetItemForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#f43f5e] hover:bg-[#e11d48]">
                {submitting ? "Saving…" : formMode === "edit" ? "Save changes" : "Save item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-zinc-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This permanently removes "${deleteTarget.name}" from the catalog.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => void confirmDeleteItem()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminItemsPage() {
  return (
    <AdminShell>
      <AdminItemsContent />
    </AdminShell>
  );
}
