import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useCatalogVersion } from "../useSocket.js";
import { useToast } from "../toast.jsx";
import Page from "../components/Page.jsx";
import Modal from "../components/Modal.jsx";
import { priceRange, badgeText, BADGES, ART_STYLES } from "../util.js";

const blankForm = () => ({
  name: "",
  desc: "",
  categoryId: "",
  badge: "none",
  artFallback: "gift",
  active: true,
  sortOrder: 0,
  options: [{ label: "", price: "" }],
});

export default function Products() {
  const version = useCatalogVersion();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // product object | "new" | null

  async function load() {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([api.getProducts(), api.getCategories()]);
      setProducts(p);
      setCategories(c);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  async function handleDelete(p) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(p.id);
      toast("Product deleted", "success");
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <Page
      title="Products"
      subtitle="Add, edit and organise your catalogue"
      actions={
        <button
          className="btn btn--primary"
          onClick={() => setEditing("new")}
          disabled={categories.length === 0}
          title={categories.length === 0 ? "Create a category first" : ""}
        >
          + Add product
        </button>
      }
    >
      {categories.length === 0 && !loading && (
        <div className="login-error">
          You need at least one category before adding products — head to{" "}
          <b>Categories</b> first.
        </div>
      )}

      <div className="card section-card">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : products.length === 0 ? (
          <div className="empty">
            <span className="em">🎁</span>
            No products yet — click <b>Add product</b> to create one.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="thumb-cell">
                        {p.imageUrl ? <img src={p.imageUrl} alt="" /> : "🎁"}
                      </div>
                    </td>
                    <td>
                      <b>{p.name}</b>
                      {p.badge && (
                        <span className={`pill pill--${p.badge}`} style={{ marginLeft: 8 }}>
                          {badgeText[p.badge]}
                        </span>
                      )}
                      <div className="muted" style={{ fontSize: 12, maxWidth: 360 }}>
                        {p.desc.slice(0, 70)}
                        {p.desc.length > 70 ? "…" : ""}
                      </div>
                    </td>
                    <td>
                      <span className="pill pill--cat">{p.category?.name || "—"}</span>
                    </td>
                    <td>{priceRange(p.options)}</td>
                    <td>
                      <span className={`pill ${p.active ? "pill--on" : "pill--off"}`}>
                        {p.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn--ghost btn--sm" onClick={() => setEditing(p)}>
                          Edit
                        </button>
                        <button className="btn btn--danger btn--sm" onClick={() => handleDelete(p)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <ProductModal
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </Page>
  );
}

/* -------------------- Create / edit modal -------------------- */
function ProductModal({ product, categories, onClose, onSaved }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const isEdit = Boolean(product);

  const [form, setForm] = useState(() => {
    if (!product) return { ...blankForm(), categoryId: categories[0]?.id || "" };
    return {
      name: product.name,
      desc: product.desc,
      categoryId: product.categoryId,
      badge: product.badge || "none",
      artFallback: product.artFallback || "gift",
      active: product.active,
      sortOrder: product.sortOrder ?? 0,
      options:
        Array.isArray(product.options) && product.options.length
          ? product.options.map((o) => ({ label: o.label, price: String(o.price) }))
          : [{ label: "", price: "" }],
    };
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(product?.imageUrl || "");
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function setOption(i, key, val) {
    setForm((f) => {
      const options = f.options.map((o, idx) => (idx === i ? { ...o, [key]: val } : o));
      return { ...f, options };
    });
  }
  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, { label: "", price: "" }] }));
  }
  function removeOption(i) {
    setForm((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));
  }

  function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function submit(e) {
    e.preventDefault();
    // validate options
    const cleanOpts = form.options
      .map((o) => ({ label: o.label.trim(), price: Math.round(Number(o.price)) }))
      .filter((o) => o.label && Number.isFinite(o.price) && o.price >= 0);
    if (!form.name.trim() || !form.desc.trim() || !form.categoryId) {
      toast("Name, description and category are required", "error");
      return;
    }
    if (!cleanOpts.length) {
      toast("Add at least one price option (label + price)", "error");
      return;
    }

    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("desc", form.desc.trim());
    fd.append("categoryId", form.categoryId);
    fd.append("badge", form.badge);
    fd.append("artFallback", form.artFallback);
    fd.append("active", String(form.active));
    fd.append("sortOrder", String(Number(form.sortOrder) || 0));
    fd.append("options", JSON.stringify(cleanOpts));
    if (imageFile) fd.append("image", imageFile);

    setBusy(true);
    try {
      if (isEdit) await api.updateProduct(product.id, fd);
      else await api.createProduct(fd);
      toast(isEdit ? "Product updated 💌" : "Product created 💌", "success");
      onSaved();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit product" : "Add product"}
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </button>
        </>
      }
    >
      <form onSubmit={submit}>
        <div className="field">
          <label>Product image <span className="hint">(optional — falls back to a drawing)</span></label>
          {preview && <img className="upload-preview" src={preview} alt="preview" />}
          <div className="upload" onClick={() => fileRef.current?.click()}>
            {imageFile ? imageFile.name : "Click to upload an image (max 5 MB)"}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            style={{ display: "none" }}
          />
        </div>

        <div className="field">
          <label>Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Dried Flower Bouquet"
            required
          />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea
            className="input"
            value={form.desc}
            onChange={(e) => set("desc", e.target.value)}
            placeholder="Short description shown on the card…"
            required
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Category</label>
            <select
              className="select"
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji ? c.emoji + " " : ""}
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Badge</label>
            <select
              className="select"
              value={form.badge}
              onChange={(e) => set("badge", e.target.value)}
            >
              {BADGES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Fallback drawing <span className="hint">(if no image)</span></label>
            <select
              className="select"
              value={form.artFallback}
              onChange={(e) => set("artFallback", e.target.value)}
            >
              {ART_STYLES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Sort order <span className="hint">(lower = first)</span></label>
            <input
              className="input"
              type="number"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Price options <span className="hint">(label + price in ₹)</span></label>
          {form.options.map((o, i) => (
            <div className="opt-row" key={i}>
              <input
                className="input"
                placeholder="Label (e.g. Standard)"
                value={o.label}
                onChange={(e) => setOption(i, "label", e.target.value)}
              />
              <input
                className="input"
                type="number"
                placeholder="Price"
                value={o.price}
                onChange={(e) => setOption(i, "price", e.target.value)}
                style={{ maxWidth: 130 }}
              />
              <button
                type="button"
                className="icon-x"
                onClick={() => removeOption(i)}
                disabled={form.options.length === 1}
                title="Remove option"
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="btn btn--ghost btn--sm" onClick={addOption}>
            + Add option
          </button>
        </div>

        <div className="field">
          <label className="toggle">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            <span className="track"></span>
            <span>Active (visible on the website)</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}
