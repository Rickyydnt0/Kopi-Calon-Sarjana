/**
 * data.js — Data awal (seed) untuk Kopi Calon Sarjana
 * Berisi: menu, daftar meja, akun admin/kasir
 * Data disimpan ke localStorage saat pertama kali dibuka
 */

// ==================== DATA MENU ====================
const SEED_MENU = [
  // --- Kategori: Kopi (Inspirasi Kopi Indonesia / Kopi Kenangan) ---
  {
    id: "M001",
    nama: "Es Kopi Susu Gula Aren",
    kategori: "Kopi",
    harga: 25000,
    tersedia: true,
    deskripsi: "Espresso robusta & arabika, susu segar krimi, dan gula aren asli",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "M002",
    nama: "Americano Klasik",
    kategori: "Kopi",
    harga: 18000,
    tersedia: true,
    deskripsi: "Double shot espresso dengan air murni, bold dan segar",
    image: "coffee_hero.jpg"
  },
  {
    id: "M003",
    nama: "Caramel Macchiato",
    kategori: "Kopi",
    harga: 28000,
    tersedia: true,
    deskripsi: "Espresso, susu segar, sirup vanila lembut dengan saus karamel lezat",
    image: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "M004",
    nama: "Kopi Alpukat Kocok",
    kategori: "Kopi",
    harga: 30000,
    tersedia: true,
    deskripsi: "Jus alpukat segar kental dipadukan dengan espresso dan es krim cokelat",
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=80"
  },

  // --- Kategori: Non-Kopi ---
  {
    id: "M005",
    nama: "Matcha Latte Asli",
    kategori: "Non-Kopi",
    harga: 27000,
    tersedia: false, // Menu tidak tersedia untuk uji black box (contoh Matcha Latte)
    deskripsi: "Bubuk green tea matcha otentik Jepang dipadu susu oat creamy",
    image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "M006",
    nama: "Coklat Signature",
    kategori: "Non-Kopi",
    harga: 22000,
    tersedia: true,
    deskripsi: "Cokelat belgia pekat premium dengan susu segar gurih",
    image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "M007",
    nama: "Teh Lemon Earl Grey",
    kategori: "Non-Kopi",
    harga: 15000,
    tersedia: false, // Menu tidak tersedia untuk uji black box
    deskripsi: "Seduhan daun teh earl grey harum dengan perasan lemon segar",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80"
  },

  // --- Kategori: Makanan & Cemilan (Toast, Bread, Cake, Snack) ---
  {
    id: "M008",
    nama: "Roti Bakar Coklat Keju",
    kategori: "Makanan",
    harga: 20000,
    tersedia: true,
    deskripsi: "Toast tebal panggang renyah dengan lelehan cokelat dan keju melimpah",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "M009",
    nama: "Toast Srikaya Butter",
    kategori: "Makanan",
    harga: 18000,
    tersedia: true,
    deskripsi: "Roti panggang tradisional dengan selai srikaya harum dan potongan mentega dingin",
    image: "https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "M010",
    nama: "Matcha Roll Cake",
    kategori: "Makanan",
    harga: 22000,
    tersedia: true,
    deskripsi: "Bolu lembut isi krim matcha pekat khas Heavenly Matcha",
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "M011",
    nama: "Kentang Goreng Crispy",
    kategori: "Makanan",
    harga: 18000,
    tersedia: true,
    deskripsi: "Kentang goreng renyah bumbu gurih dengan saus sambal dan mayones",
    image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "M012",
    nama: "Pisang Goreng Keju Aren",
    kategori: "Makanan",
    harga: 16000,
    tersedia: true,
    deskripsi: "Pisang kepok goreng krispi dengan taburan keju parut dan kucuran gula aren",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80"
  }
];

// ==================== DAFTAR MEJA VALID ====================
// Meja 01 sampai 20
const MEJA_VALID = Array.from({ length: 20 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

// ==================== AKUN AWAL ====================
// Password di-hash dengan SHA-256 saat inisialisasi
const SEED_AKUN = [
  {
    username: "admin01",
    // Password asli: Kopi12345 (akan di-hash saat init)
    passwordPlain: "Kopi12345",
    role: "admin"
  },
  {
    username: "kasir01",
    // Password asli: Kasir12345 (akan di-hash saat init)
    passwordPlain: "Kasir12345",
    role: "kasir"
  }
];

// ==================== HARGA TOPPING ====================
const HARGA_BOBA = 3000;

// ==================== HARGA UKURAN ====================
// Large menambah Rp5.000 dari harga dasar
const TAMBAHAN_LARGE = 5000;

// ==================== FUNGSI HASH SHA-256 ====================
/**
 * Hash string dengan SHA-256 menggunakan Web Crypto API
 * @param {string} text - Teks yang akan di-hash
 * @returns {Promise<string>} - Hash dalam format hex
 */
async function hashSHA256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ==================== INISIALISASI DATA ====================
/**
 * Inisialisasi data awal ke localStorage jika belum ada
 * Dipanggil saat halaman pertama kali dimuat
 */
async function initData() {
  // Simpan menu jika belum ada atau jika masih format lama
  const currentMenu = localStorage.getItem("kcs_menu");
  if (!currentMenu || !currentMenu.includes('"image"')) {
    localStorage.setItem("kcs_menu", JSON.stringify(SEED_MENU));
  }

  // Simpan akun jika belum ada (hash password)
  if (!localStorage.getItem("kcs_akun")) {
    const akunHashed = [];
    for (const akun of SEED_AKUN) {
      const hash = await hashSHA256(akun.passwordPlain);
      akunHashed.push({
        username: akun.username,
        passwordHash: hash,
        role: akun.role
      });
    }
    localStorage.setItem("kcs_akun", JSON.stringify(akunHashed));
  }

  // Inisialisasi array pesanan jika belum ada
  if (!localStorage.getItem("daftar_pesanan") && !localStorage.getItem("kcs_pesanan")) {
    localStorage.setItem("daftar_pesanan", JSON.stringify([]));
    localStorage.setItem("kcs_pesanan", JSON.stringify([]));
  }

  // Inisialisasi counter nomor pesanan jika belum ada
  if (!localStorage.getItem("kcs_pesanan_counter")) {
    localStorage.setItem("kcs_pesanan_counter", "0");
  }
}

/**
 * Reset semua data ke kondisi awal (untuk pengujian)
 * Menghapus semua data di localStorage lalu inisialisasi ulang
 */
async function resetData() {
  localStorage.removeItem("kcs_menu");
  localStorage.removeItem("kcs_akun");
  localStorage.removeItem("kcs_pesanan");
  localStorage.removeItem("daftar_pesanan");
  localStorage.removeItem("kcs_pesanan_counter");
  localStorage.removeItem("kcs_keranjang");
  localStorage.removeItem("kcs_pelanggan");

  // Hapus semua data keranjang per meja (keranjang_meja01 - keranjang_meja20)
  if (typeof MEJA_VALID !== "undefined") {
    MEJA_VALID.forEach(m => localStorage.removeItem(`keranjang_meja${m}`));
  }
  await initData();
}

/**
 * Ambil data menu dari localStorage
 * @returns {Array} - Array objek menu
 */
function getMenu() {
  return JSON.parse(localStorage.getItem("kcs_menu")) || [];
}

/**
 * Simpan data menu ke localStorage
 * @param {Array} menu - Array objek menu
 */
function saveMenu(menu) {
  localStorage.setItem("kcs_menu", JSON.stringify(menu));
}

/**
 * Mendapatkan kunci localStorage keranjang per meja (contoh: keranjang_meja01)
 * @param {string} [meja] - Nomor meja (opsional)
 * @returns {string} - Kunci localStorage
 */
function getKunciKeranjang(meja) {
  let m = meja;
  if (!m) {
    const p = typeof getPelanggan === "function" ? getPelanggan() : null;
    m = p && p.meja ? p.meja : "01";
  }
  return `keranjang_meja${m}`;
}

/**
 * Ambil data keranjang dari localStorage per meja
 * @param {string} [meja] - Nomor meja
 * @returns {Array} - Array item keranjang meja tersebut
 */
function getKeranjang(meja) {
  const key = getKunciKeranjang(meja);
  return JSON.parse(localStorage.getItem(key)) || [];
}

/**
 * Simpan data keranjang ke localStorage per meja
 * @param {Array} keranjang - Array item keranjang
 * @param {string} [meja] - Nomor meja
 */
function saveKeranjang(keranjang, meja) {
  const key = getKunciKeranjang(meja);
  localStorage.setItem(key, JSON.stringify(keranjang));
}

/**
 * Ambil data pesanan dari localStorage (mendukung daftar_pesanan dan kcs_pesanan)
 * @returns {Array} - Array objek pesanan
 */
function getPesanan() {
  const d = localStorage.getItem("daftar_pesanan") || localStorage.getItem("kcs_pesanan");
  return d ? JSON.parse(d) : [];
}

/**
 * Simpan data pesanan ke localStorage (ke daftar_pesanan dan kcs_pesanan)
 * @param {Array} pesanan - Array objek pesanan
 */
function savePesanan(pesanan) {
  localStorage.setItem("daftar_pesanan", JSON.stringify(pesanan));
  localStorage.setItem("kcs_pesanan", JSON.stringify(pesanan));
}

/**
 * Generate nomor pesanan unik: KCS-001, KCS-002, dst.
 * @returns {string} - Nomor pesanan
 */
function generateNomorPesanan() {
  let counter = parseInt(localStorage.getItem("kcs_pesanan_counter")) || 0;
  counter++;
  localStorage.setItem("kcs_pesanan_counter", String(counter));
  return "KCS-" + String(counter).padStart(3, "0");
}

/**
 * Simpan data pelanggan (meja + nama) ke localStorage
 * @param {object} pelanggan - { meja, nama }
 */
function savePelanggan(pelanggan) {
  localStorage.setItem("kcs_pelanggan", JSON.stringify(pelanggan));
}

/**
 * Ambil data pelanggan dari localStorage
 * @returns {object|null}
 */
function getPelanggan() {
  const data = localStorage.getItem("kcs_pelanggan");
  return data ? JSON.parse(data) : null;
}

/**
 * Format angka menjadi format Rupiah
 * @param {number} angka
 * @returns {string} - Contoh: "Rp25.000"
 */
function formatRupiah(angka) {
  return "Rp" + angka.toLocaleString("id-ID");
}
