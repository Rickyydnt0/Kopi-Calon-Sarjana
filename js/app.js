/**
 * app.js — Logika utama halaman pelanggan Kopi Calon Sarjana
 * Fitur Tahap 1: Registrasi, Katalog Menu, Kustomisasi, Keranjang
 */

// ==================== VARIABEL GLOBAL ====================
let mejaAktif = null; // Nomor meja dari URL
let kategoriAktif = "Kopi"; // Kategori menu yang sedang ditampilkan
let itemKustomisasi = null; // Item menu yang sedang dikustomisasi

// ==================== INISIALISASI HALAMAN ====================
document.addEventListener("DOMContentLoaded", async () => {
  // Inisialisasi data awal
  await initData();

  // Ambil parameter meja dari URL
  const params = new URLSearchParams(window.location.search);
  const kodeMeja = params.get("meja");

  // Validasi kode meja
  if (!kodeMeja || !MEJA_VALID.includes(kodeMeja)) {
    tampilkanHalamanError();
    return;
  }

  mejaAktif = kodeMeja;

  // Cek apakah pelanggan sudah registrasi
  const pelanggan = getPelanggan();
  if (pelanggan && pelanggan.meja === mejaAktif) {
    // Sudah registrasi, langsung ke menu
    tampilkanHalamanMenu();
  } else {
    // Belum registrasi, tampilkan form
    tampilkanHalamanRegistrasi();
  }
});

// ==================== HALAMAN ERROR MEJA ====================
/**
 * Tampilkan pesan error jika kode meja tidak valid
 */
function tampilkanHalamanError() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="page-container center-content">
      <div class="error-card">
        <div class="error-icon">☕</div>
        <h1>Meja tidak ditemukan</h1>
        <p>Kode meja tidak valid. Silakan scan ulang barcode di meja Anda atau hubungi kasir.</p>
        <p class="hint">Format meja yang valid: 01 - 20</p>
      </div>
    </div>
  `;
}

// ==================== HALAMAN REGISTRASI ====================
/**
 * Tampilkan form registrasi nama pelanggan
 */
function tampilkanHalamanRegistrasi() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="page-container center-content">
      <div class="register-card">
        <div class="brand-header">
          <div class="brand-icon">☕</div>
          <h1>Kopi Calon Sarjana</h1>
          <p class="brand-tagline">Temani perjuanganmu</p>
        </div>
        <form id="formRegistrasi" onsubmit="prosesRegistrasi(event)">
          <div class="form-group">
            <label for="inputMeja">Nomor Meja</label>
            <input type="text" id="inputMeja" value="${mejaAktif}" readonly
                   class="input-readonly" />
          </div>
          <div class="form-group">
            <label for="inputNama">Nama Pelanggan</label>
            <input type="text" id="inputNama" placeholder="Masukkan nama Anda"
                   maxlength="30" autocomplete="off" />
            <div id="errorNama" class="error-message" role="alert"></div>
          </div>
          <button type="submit" id="btnRegistrasi" class="btn-primary">
            Mulai Pesan
          </button>
        </form>
      </div>
    </div>
  `;

  // Fokus ke input nama
  document.getElementById("inputNama").focus();
}

/**
 * Proses registrasi pelanggan dengan validasi
 * Validasi: nama 3-30 karakter
 */
function prosesRegistrasi(event) {
  event.preventDefault();
  const inputNama = document.getElementById("inputNama");
  const errorNama = document.getElementById("errorNama");
  const nama = inputNama.value.trim();

  // Reset error
  errorNama.textContent = "";
  inputNama.classList.remove("input-error");

  // Validasi: kosong
  if (nama === "") {
    errorNama.textContent = "Nama wajib diisi";
    inputNama.classList.add("input-error");
    inputNama.focus();
    return;
  }

  // Validasi: panjang 3-30 karakter
  if (nama.length < 3 || nama.length > 30) {
    errorNama.textContent = "Nama harus 3-30 karakter";
    inputNama.classList.add("input-error");
    inputNama.focus();
    return;
  }

  // Simpan data pelanggan
  savePelanggan({ meja: mejaAktif, nama: nama });

  // Kosongkan keranjang untuk sesi baru
  saveKeranjang([]);

  // Tampilkan halaman menu
  tampilkanHalamanMenu();
}

// ==================== HALAMAN MENU ====================
/**
 * Tampilkan halaman katalog menu dengan tab kategori
 */
function tampilkanHalamanMenu() {
  const pelanggan = getPelanggan();
  const keranjang = getKeranjang();
  const totalItem = keranjang.reduce((sum, item) => sum + item.jumlah, 0);

  const app = document.getElementById("app");
  app.innerHTML = `
    <header class="app-header">
      <div class="header-top">
        <div class="header-info">
          <h1 class="header-brand">☕ Kopi Calon Sarjana</h1>
          <span class="header-meta">Meja ${pelanggan.meja} • ${pelanggan.nama}</span>
        </div>
        <button id="btnResetData" class="btn-reset" onclick="konfirmasiReset()" title="Reset Data Uji">
          🔄
        </button>
      </div>
      <!-- Tab kategori -->
      <div class="tab-container" id="tabKategori">
        <button class="tab-btn ${kategoriAktif === 'Kopi' ? 'active' : ''}"
                id="tabKopi" onclick="gantiKategori('Kopi')">Kopi</button>
        <button class="tab-btn ${kategoriAktif === 'Non-Kopi' ? 'active' : ''}"
                id="tabNonKopi" onclick="gantiKategori('Non-Kopi')">Non-Kopi</button>
        <button class="tab-btn ${kategoriAktif === 'Makanan' ? 'active' : ''}"
                id="tabMakanan" onclick="gantiKategori('Makanan')">Makanan</button>
      </div>
    </header>

    <main class="main-content" id="daftarMenu">
      <!-- Daftar menu akan diisi oleh renderMenu() -->
    </main>

    <!-- Tombol keranjang floating -->
    <button id="btnKeranjang" class="fab-cart ${totalItem === 0 ? 'hidden' : ''}"
            onclick="tampilkanKeranjang()">
      🛒 <span id="badgeKeranjang">${totalItem}</span>
    </button>

    <!-- Modal kustomisasi -->
    <div id="modalKustomisasi" class="modal hidden">
      <div class="modal-content" id="modalContent">
        <!-- Diisi oleh bukaKustomisasi() -->
      </div>
    </div>

    <!-- Modal keranjang -->
    <div id="modalKeranjang" class="modal hidden">
      <div class="modal-content modal-keranjang" id="keranjangContent">
        <!-- Diisi oleh tampilkanKeranjang() -->
      </div>
    </div>
  `;

  renderMenu();
}

/**
 * Ganti kategori menu yang ditampilkan
 * @param {string} kategori - "Kopi", "Non-Kopi", atau "Makanan"
 */
function gantiKategori(kategori) {
  kategoriAktif = kategori;

  // Update tab aktif
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  if (kategori === "Kopi") document.getElementById("tabKopi").classList.add("active");
  else if (kategori === "Non-Kopi") document.getElementById("tabNonKopi").classList.add("active");
  else document.getElementById("tabMakanan").classList.add("active");

  renderMenu();
}

/**
 * Render daftar menu berdasarkan kategori aktif
 */
function renderMenu() {
  const menu = getMenu();
  const filtered = menu.filter(item => item.kategori === kategoriAktif);
  const container = document.getElementById("daftarMenu");

  if (filtered.length === 0) {
    container.innerHTML = `<p class="empty-message">Belum ada menu di kategori ini.</p>`;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="menu-card ${!item.tersedia ? 'tidak-tersedia' : ''}" id="menu-${item.id}">
      <div class="menu-info">
        <h3 class="menu-nama">${item.nama}</h3>
        <p class="menu-deskripsi">${item.deskripsi}</p>
        <p class="menu-harga">${formatRupiah(item.harga)}</p>
        ${!item.tersedia ? '<span class="badge-habis">Tidak Tersedia</span>' : ''}
      </div>
      <div class="menu-action">
        ${item.tersedia
          ? `<button class="btn-tambah" id="btnTambah-${item.id}"
               onclick="bukaKustomisasi('${item.id}')">+</button>`
          : `<button class="btn-tambah btn-disabled" disabled>✕</button>`
        }
      </div>
    </div>
  `).join("");
}

// ==================== KUSTOMISASI MINUMAN ====================
/**
 * Buka modal kustomisasi untuk item menu tertentu
 * @param {string} menuId - ID menu yang dipilih
 */
function bukaKustomisasi(menuId) {
  const menu = getMenu();
  const item = menu.find(m => m.id === menuId);
  if (!item || !item.tersedia) return;

  itemKustomisasi = item;

  // Cek apakah item adalah makanan (tidak perlu kustomisasi minuman)
  const isMakanan = item.kategori === "Makanan";

  const modal = document.getElementById("modalKustomisasi");
  const content = document.getElementById("modalContent");

  content.innerHTML = `
    <div class="modal-header">
      <h2>${item.nama}</h2>
      <button class="btn-close" id="btnTutupKustomisasi" onclick="tutupModal('modalKustomisasi')">✕</button>
    </div>
    <div class="modal-body">
      <p class="modal-harga">${formatRupiah(item.harga)}</p>

      ${!isMakanan ? `
      <!-- Ukuran -->
      <div class="form-group">
        <label>Ukuran</label>
        <div class="option-group" id="grupUkuran">
          <button class="option-btn active" id="optRegular" onclick="pilihOpsi('grupUkuran', this, 'Regular')">
            Regular
          </button>
          <button class="option-btn" id="optLarge" onclick="pilihOpsi('grupUkuran', this, 'Large')">
            Large (+${formatRupiah(TAMBAHAN_LARGE)})
          </button>
        </div>
      </div>

      <!-- Sugar Level -->
      <div class="form-group">
        <label>Sugar Level</label>
        <div class="option-group" id="grupSugar">
          <button class="option-btn" id="optSugar0" onclick="pilihOpsi('grupSugar', this, '0%')">0%</button>
          <button class="option-btn" id="optSugar25" onclick="pilihOpsi('grupSugar', this, '25%')">25%</button>
          <button class="option-btn active" id="optSugar50" onclick="pilihOpsi('grupSugar', this, '50%')">50%</button>
          <button class="option-btn" id="optSugar100" onclick="pilihOpsi('grupSugar', this, '100%')">100%</button>
        </div>
      </div>

      <!-- Ice Level -->
      <div class="form-group">
        <label>Ice Level</label>
        <div class="option-group" id="grupIce">
          <button class="option-btn" id="optIceLess" onclick="pilihOpsi('grupIce', this, 'Less')">Less</button>
          <button class="option-btn active" id="optIceNormal" onclick="pilihOpsi('grupIce', this, 'Normal')">Normal</button>
          <button class="option-btn" id="optIceExtra" onclick="pilihOpsi('grupIce', this, 'Extra')">Extra</button>
        </div>
      </div>

      <!-- Topping -->
      <div class="form-group">
        <label>
          <input type="checkbox" id="checkBoba" onchange="updateHargaKustomisasi()" />
          Topping Boba (+${formatRupiah(HARGA_BOBA)})
        </label>
      </div>
      ` : ''}

      <!-- Catatan -->
      <div class="form-group">
        <label for="inputCatatan">Catatan</label>
        <input type="text" id="inputCatatan" placeholder="Contoh: kurangi gula" maxlength="100" />
      </div>

      <!-- Jumlah -->
      <div class="form-group">
        <label>Jumlah</label>
        <div class="qty-control">
          <button class="btn-qty" id="btnKurang" onclick="ubahJumlah(-1)">−</button>
          <input type="number" id="inputJumlah" value="1" min="1" max="20" readonly />
          <button class="btn-qty" id="btnTambahQty" onclick="ubahJumlah(1)">+</button>
        </div>
        <div id="errorJumlah" class="error-message" role="alert"></div>
      </div>

      <!-- Total harga -->
      <div class="kustomisasi-total">
        <span>Total:</span>
        <span id="totalKustomisasi">${formatRupiah(item.harga)}</span>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-primary" id="btnMasukKeranjang" onclick="masukKeranjang()">
        Masukkan ke Keranjang
      </button>
    </div>
  `;

  modal.classList.remove("hidden");
  updateHargaKustomisasi();
}

/**
 * Pilih opsi pada grup tombol (ukuran, sugar, ice)
 */
function pilihOpsi(grupId, btnEl, nilai) {
  const grup = document.getElementById(grupId);
  grup.querySelectorAll(".option-btn").forEach(btn => btn.classList.remove("active"));
  btnEl.classList.add("active");
  updateHargaKustomisasi();
}

/**
 * Ubah jumlah item di modal kustomisasi
 * @param {number} delta - +1 atau -1
 */
function ubahJumlah(delta) {
  const input = document.getElementById("inputJumlah");
  const errorEl = document.getElementById("errorJumlah");
  let jumlah = parseInt(input.value) + delta;

  // Validasi batas 1-20
  if (jumlah < 1) {
    errorEl.textContent = "Jumlah minimal 1";
    return;
  }
  if (jumlah > 20) {
    errorEl.textContent = "Jumlah maksimal 20";
    return;
  }

  errorEl.textContent = "";
  input.value = jumlah;
  updateHargaKustomisasi();
}

/**
 * Hitung dan update tampilan total harga di modal kustomisasi
 */
function updateHargaKustomisasi() {
  if (!itemKustomisasi) return;

  let hargaSatuan = itemKustomisasi.harga;
  const isMakanan = itemKustomisasi.kategori === "Makanan";

  if (!isMakanan) {
    // Tambahan ukuran Large
    const grupUkuran = document.getElementById("grupUkuran");
    if (grupUkuran) {
      const ukuranAktif = grupUkuran.querySelector(".option-btn.active");
      if (ukuranAktif && ukuranAktif.id === "optLarge") {
        hargaSatuan += TAMBAHAN_LARGE;
      }
    }

    // Tambahan topping boba
    const checkBoba = document.getElementById("checkBoba");
    if (checkBoba && checkBoba.checked) {
      hargaSatuan += HARGA_BOBA;
    }
  }

  const jumlah = parseInt(document.getElementById("inputJumlah").value) || 1;
  const total = hargaSatuan * jumlah;

  document.getElementById("totalKustomisasi").textContent = formatRupiah(total);
}

/**
 * Masukkan item ke keranjang dengan kustomisasi yang dipilih
 */
function masukKeranjang() {
  if (!itemKustomisasi) return;

  const isMakanan = itemKustomisasi.kategori === "Makanan";
  const jumlah = parseInt(document.getElementById("inputJumlah").value);

  // Validasi jumlah (antisipasi manipulasi)
  if (jumlah < 1 || jumlah > 20) {
    document.getElementById("errorJumlah").textContent = "Jumlah harus 1-20";
    return;
  }

  // Ambil kustomisasi
  let ukuran = "Regular";
  let sugar = "50%";
  let ice = "Normal";
  let boba = false;

  if (!isMakanan) {
    const ukuranBtn = document.getElementById("grupUkuran").querySelector(".active");
    ukuran = ukuranBtn.id === "optLarge" ? "Large" : "Regular";

    const sugarBtn = document.getElementById("grupSugar").querySelector(".active");
    sugar = sugarBtn.textContent.trim();

    const iceBtn = document.getElementById("grupIce").querySelector(".active");
    ice = iceBtn.textContent.trim();

    boba = document.getElementById("checkBoba").checked;
  }

  const catatan = document.getElementById("inputCatatan").value.trim();

  // Hitung harga satuan
  let hargaSatuan = itemKustomisasi.harga;
  if (!isMakanan) {
    if (ukuran === "Large") hargaSatuan += TAMBAHAN_LARGE;
    if (boba) hargaSatuan += HARGA_BOBA;
  }

  // Buat item keranjang
  const itemKeranjang = {
    id: Date.now().toString(), // ID unik per item keranjang
    menuId: itemKustomisasi.id,
    nama: itemKustomisasi.nama,
    kategori: itemKustomisasi.kategori,
    hargaDasar: itemKustomisasi.harga,
    ukuran: isMakanan ? "-" : ukuran,
    sugar: isMakanan ? "-" : sugar,
    ice: isMakanan ? "-" : ice,
    boba: isMakanan ? false : boba,
    catatan: catatan,
    jumlah: jumlah,
    hargaSatuan: hargaSatuan,
    subtotal: hargaSatuan * jumlah
  };

  // Simpan ke keranjang
  const keranjang = getKeranjang();
  keranjang.push(itemKeranjang);
  saveKeranjang(keranjang);

  // Update badge keranjang
  updateBadgeKeranjang();

  // Tutup modal
  tutupModal("modalKustomisasi");

  // Tampilkan notifikasi
  tampilkanNotifikasi(`${itemKustomisasi.nama} ditambahkan ke keranjang`);
}

// ==================== KERANJANG ====================
/**
 * Update badge jumlah item di tombol keranjang
 */
function updateBadgeKeranjang() {
  const keranjang = getKeranjang();
  const total = keranjang.reduce((sum, item) => sum + item.jumlah, 0);
  const badge = document.getElementById("badgeKeranjang");
  const fab = document.getElementById("btnKeranjang");

  if (badge) badge.textContent = total;
  if (fab) {
    if (total > 0) fab.classList.remove("hidden");
    else fab.classList.add("hidden");
  }
}

/**
 * Tampilkan modal keranjang dengan daftar item
 */
function tampilkanKeranjang() {
  const keranjang = getKeranjang();
  const content = document.getElementById("keranjangContent");
  const modal = document.getElementById("modalKeranjang");

  if (keranjang.length === 0) {
    content.innerHTML = `
      <div class="modal-header">
        <h2>Keranjang</h2>
        <button class="btn-close" id="btnTutupKeranjang" onclick="tutupModal('modalKeranjang')">✕</button>
      </div>
      <div class="modal-body">
        <p class="empty-message">Keranjang kosong</p>
      </div>
    `;
    modal.classList.remove("hidden");
    return;
  }

  const grandTotal = keranjang.reduce((sum, item) => sum + item.subtotal, 0);

  content.innerHTML = `
    <div class="modal-header">
      <h2>Keranjang</h2>
      <button class="btn-close" id="btnTutupKeranjang" onclick="tutupModal('modalKeranjang')">✕</button>
    </div>
    <div class="modal-body">
      ${keranjang.map(item => `
        <div class="cart-item" id="cartItem-${item.id}">
          <div class="cart-item-info">
            <h4>${item.nama}</h4>
            ${item.kategori !== "Makanan" ? `
              <p class="cart-detail">
                ${item.ukuran} • Sugar ${item.sugar} • Ice ${item.ice}
                ${item.boba ? ' • Boba' : ''}
              </p>
            ` : ''}
            ${item.catatan ? `<p class="cart-catatan">📝 ${item.catatan}</p>` : ''}
            <p class="cart-harga">
              ${formatRupiah(item.hargaSatuan)} × ${item.jumlah} = ${formatRupiah(item.subtotal)}
            </p>
          </div>
          <button class="btn-hapus" id="btnHapus-${item.id}"
                  onclick="hapusDariKeranjang('${item.id}')">🗑️</button>
        </div>
      `).join("")}
    </div>
    <div class="modal-footer cart-footer">
      <div class="cart-total">
        <span>Total</span>
        <span id="grandTotal">${formatRupiah(grandTotal)}</span>
      </div>
      <button class="btn-primary" id="btnCheckout" disabled
              title="Fitur checkout tersedia di tahap berikutnya">
        Checkout (Tahap 2)
      </button>
    </div>
  `;

  modal.classList.remove("hidden");
}

/**
 * Hapus item dari keranjang
 * @param {string} itemId - ID unik item keranjang
 */
function hapusDariKeranjang(itemId) {
  let keranjang = getKeranjang();
  keranjang = keranjang.filter(item => item.id !== itemId);
  saveKeranjang(keranjang);

  // Refresh tampilan keranjang
  tampilkanKeranjang();
  updateBadgeKeranjang();
}

// ==================== UTILITAS UI ====================
/**
 * Tutup modal berdasarkan ID
 * @param {string} modalId
 */
function tutupModal(modalId) {
  document.getElementById(modalId).classList.add("hidden");
}

/**
 * Tampilkan notifikasi singkat (toast)
 * @param {string} pesan
 */
function tampilkanNotifikasi(pesan) {
  // Hapus notifikasi lama jika ada
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = pesan;
  document.body.appendChild(toast);

  // Hilangkan setelah 2 detik
  setTimeout(() => {
    toast.classList.add("toast-hide");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/**
 * Konfirmasi sebelum reset data uji
 */
function konfirmasiReset() {
  if (confirm("Reset semua data ke kondisi awal?\nKeranjang dan pesanan akan dihapus.")) {
    resetData().then(() => {
      tampilkanNotifikasi("Data berhasil direset");
      // Reload halaman
      setTimeout(() => window.location.reload(), 500);
    });
  }
}
