import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useCatalogVersion } from "../useSocket.js";
import { useToast } from "../toast.jsx";
import Page from "../components/Page.jsx";
import Modal from "../components/Modal.jsx";

const blank = () => ({ name: "", emoji: "", tint: "#f7eaee", sortOrder: 0 });

export default function Categories() {
  const version = useCatalogVersion();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // category | "new" | null

  async function load() {
    setLoading(true);
    try {
      setCategories(await api.getCategories());
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

  async function handleDelete(c) {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      await api.deleteCategory(c.id);
      toast("Category deleted", "success");
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <Page
      title="Categories"
      subtitle="Group your products — these become the filters on the website"
      actions={
        <button className="btn btn--primary" onClick={() => setEditing("new")}>
          + Add category
        </button>
      }
    >
      <div className="card section-card">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="empty">
            <span className="em">🗂️</span>
            No categories yet — add one to start grouping products.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Tint</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>{c.sortOrder}</td>
                    <td>
                      <b>
                        {c.emoji ? c.emoji + " " : ""}
                        {c.name}
                      </b>
                    </td>
                    <td>
                      <span className="muted">{c.slug}</span>
                    </td>
                    <td>
                      <span className="swatch" style={{ background: c.tint }}></span>{" "}
                      <span className="muted" style={{ fontSize: 12 }}>
                        {c.tint}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn--ghost btn--sm" onClick={() => setEditing(c)}>
                          Edit
                        </button>
                        <button className="btn btn--danger btn--sm" onClick={() => handleDelete(c)}>
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
        <CategoryModal
          category={editing === "new" ? null : editing}
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

function CategoryModal({ category, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(category);
  const [form, setForm] = useState(() =>
    category
      ? {
          name: category.name,
          emoji: category.emoji || "",
          tint: category.tint || "#f7eaee",
          sortOrder: category.sortOrder ?? 0,
        }
      : blank()
  );
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast("Name is required", "error");
      return;
    }
    const payload = {
      name: form.name.trim(),
      emoji: form.emoji.trim(),
      tint: form.tint,
      sortOrder: Number(form.sortOrder) || 0,
    };
    setBusy(true);
    try {
      if (isEdit) await api.updateCategory(category.id, payload);
      else await api.createCategory(payload);
      toast(isEdit ? "Category updated" : "Category created", "success");
      onSaved();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit category" : "Add category"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </button>
        </>
      }
    >
      <form onSubmit={submit}>
        <div className="field">
          <label>Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Bouquets"
            required
            autoFocus
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Emoji <span className="hint">(optional)</span></label>
            <input
              className="input"
              value={form.emoji}
              onChange={(e) => set("emoji", e.target.value)}
              placeholder="🌸"
              maxLength={4}
            />
          </div>
          <div className="field">
            <label>Sort order</label>
            <input
              className="input"
              type="number"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label>Card tint colour</label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="color"
              value={form.tint}
              onChange={(e) => set("tint", e.target.value)}
              style={{ width: 48, height: 42, border: "none", background: "none", cursor: "pointer" }}
            />
            <input
              className="input"
              value={form.tint}
              onChange={(e) => set("tint", e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
