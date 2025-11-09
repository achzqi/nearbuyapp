import { openDB } from "idb";

const DATABASE_NAME = "produk-database";
const DATABASE_VERSION = 2;
const OBJECT_STORE_NAME = "produk";

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      const store = db.createObjectStore(OBJECT_STORE_NAME, {
        keyPath: "uniqueId",
      });
      store.createIndex("id", "id", { unique: false });
      store.createIndex("userId", "userId", { unique: false });
    }
  },
});

export const ProdukIDB = {
  // ✅ Ambil semua produk milik user tertentu
  async getAllProduk(userId) {
    const db = await dbPromise;
    const all = await db.getAll(OBJECT_STORE_NAME);
    return all.filter((p) => p.userId === userId);
  },

  // ✅ Ambil produk tertentu milik user
  async getProduk(id, userId) {
    const db = await dbPromise;
    const index = db.transaction(OBJECT_STORE_NAME).store.index("userId");
    const userItems = await index.getAll(userId);
    return userItems.find((p) => p.id === id) || null;
  },

  // ✅ Simpan produk per user
  async putProduk(produk, userId) {
    if (!produk.hasOwnProperty("id")) return;
    const db = await dbPromise;
    const produkWithUser = {
      ...produk,
      userId,
      uniqueId: `${userId}-${produk.id}`,
    };
    return db.put(OBJECT_STORE_NAME, produkWithUser);
  },

  // ✅ Hapus produk berdasarkan userId + id
  async deleteProduk(id, userId) {
    const db = await dbPromise;
    const tx = db.transaction(OBJECT_STORE_NAME, "readwrite");
    const store = tx.store;
    const all = await store.getAll();
    const item = all.find((p) => p.id === id && p.userId === userId);
    if (item) await store.delete(item.uniqueId);
    await tx.done;
  },
};
