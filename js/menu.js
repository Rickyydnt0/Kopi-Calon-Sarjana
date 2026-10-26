/**
 * menu.js — Logika Katalog Menu, Kustomisasi Minuman, dan Keranjang
 * Kopi Calon Sarjana (Dine-in System)
 * 
 * Sesuai Spesifikasi:
 * - Menampilkan menu dalam grid rapi (Gambar diatas, nama, harga, tombol pesan).
 * - Penanda "Tidak Tersedia" dan tombol disabled untuk menu habis (M007 / Teh Lemon).
 * - Kustomisasi minuman: ukuran (Regular/Large +Rp5.000), suhu (Dingin/Panas),
 *   sugar level (0/25/50/100%), ice level (Less/Normal/Extra), topping boba (+Rp3.000),
 *   catatan, dan jumlah (1 sampai 20 dengan validasi ketat BVA).
 * - Keranjang belanja multi-item yang terakumulasi otomatis dan disimpan ke localStorage.
 */

// ==================== STATE GLOBAL ====================
let mejaAktif = null;
let namaPelangganAktif = "Tamu";
let kategoriAktif = "Semua";

// State modal kustomisasi saat ini
let kustomisasiState = {
    menu: null,
    ukuran: "Regular",
    suhu: "Dingin",
    sugar: "50%",
    ice: "Normal",
    boba: false,
    catatan: "",
    jumlah: 1
};

// ==================== INISIALISASI HALAMAN ====================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Inisialisasi data seed
    if (typeof initData === "function") {
        await initData();
    }

    // 2. Setup navbar responsif (hamburger)
    setupNavbarResponsive();

    // 3. Baca nomor meja dari parameter URL atau localStorage
    bacaIdentitasMeja();

    // 4. Render katalog menu produk
    renderKatalogMenu();

    // 5. Perbarui tampilan floating cart bar
    updateFloatingCart();
});

/**
 * Baca identitas meja dari URL (?meja=XX) atau dari sesi getPelanggan()
 */
function bacaIdentitasMeja() {
    const params = new URLSearchParams(window.location.search);
    const mejaURL = params.get("meja");

    const pelanggan = typeof getPelanggan === "function" ? getPelanggan() : null;

    if (mejaURL && typeof MEJA_VALID !== "undefined" && MEJA_VALID.includes(mejaURL)) {
        mejaAktif = mejaURL;
        if (pelanggan && pelanggan.meja === mejaAktif) {
            namaPelangganAktif = pelanggan.nama;
        }
    } else if (pelanggan && pelanggan.meja) {
        mejaAktif = pelanggan.meja;
        namaPelangganAktif = pelanggan.nama;
    } else {
        // Default meja 01 jika belum terdaftar untuk memudahkan pengujian
        mejaAktif = "01";
        namaPelangganAktif = "Pengunjung Meja 01";
    }

    // Update banner dine-in
    const displayNomorMeja = document.getElementById("displayNomorMeja");
    const displayNamaPelanggan = document.getElementById("displayNamaPelanggan");
    const cartMejaHeader = document.getElementById("cartMejaHeader");
    const navUserBadge = document.getElementById("navUserBadge");

    if (displayNomorMeja) displayNomorMeja.textContent = mejaAktif;
    if (displayNamaPelanggan) displayNamaPelanggan.textContent = `Pelanggan: ${namaPelangganAktif}`;
    if (cartMejaHeader) cartMejaHeader.textContent = mejaAktif;
    if (navUserBadge) navUserBadge.textContent = `Meja ${mejaAktif} • ${namaPelangganAktif}`;

    // Perbarui semua tautan navbar agar membawa parameter ?meja
    perbaruiTautanNavbar(mejaAktif);
}

// ==================== FILTER KATEGORI ====================
/**
 * Filter menu berdasarkan kategori yang dipilih
 * @param {string} kategori - "Semua", "Kopi", "Non-Kopi", "Makanan"
 * @param {HTMLElement} btnEl - Tombol tab yang diklik
 */
function filterKategori(kategori, btnEl) {
    kategoriAktif = kategori;

    // Update kelas aktif pada tab
    document.querySelectorAll(".cat-tab").forEach(tab => tab.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");

    // Render ulang grid produk
    renderKatalogMenu();
}

// ==================== RENDER KATALOG MENU ====================
/**
 * Render kartu produk ke dalam grid
 */
function renderKatalogMenu() {
    const menuList = typeof getMenu === "function" ? getMenu() : [];
    const container = document.getElementById("menuGrid");

    if (!container) return;

    // Filter berdasarkan kategori aktif
    const filtered = kategoriAktif === "Semua" 
        ? menuList 
        : menuList.filter(item => item.kategori === kategoriAktif);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-menu-state">
                <p>☕ Belum ada menu pada kategori ini.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map((item, index) => {
        const isHabis = !item.tersedia;
        const fallbackImg = item.image || "coffee_hero.jpg";

        return `
            <article class="product-card ${isHabis ? 'tidak-tersedia' : ''}" id="cardMenu-${item.id}" style="--card-index: ${index};">
                <div class="product-image-wrapper">
                    <img src="${fallbackImg}" 
                         alt="${item.nama}" 
                         class="product-image" 
                         onerror="this.src='coffee_hero.jpg'" 
                         loading="lazy" />
                    ${isHabis ? `<span class="badge-habis">Tidak Tersedia</span>` : ''}
                </div>

                <div class="product-card-body">
                    <span class="product-category-tag">${item.kategori}</span>
                    <h3 class="product-title">${item.nama}</h3>
                    <p class="product-desc">${item.deskripsi}</p>

                    <div class="product-card-footer">
                        <span class="product-price">${formatRupiah(item.harga)}</span>
                        ${isHabis 
                            ? `<button type="button" class="btn-pesan btn-disabled" id="btnPesan-${item.id}" disabled title="Menu ini sedang tidak tersedia">Habis</button>`
                            : `<button type="button" class="btn-pesan" id="btnPesan-${item.id}" onclick="bukaModalKustomisasi('${item.id}')">Pesan +</button>`
                        }
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

// ==================== MODAL KUSTOMISASI ====================
/**
 * Buka modal kustomisasi untuk produk tertentu
 * @param {string} menuId - ID produk (contoh: M001)
 */
function bukaModalKustomisasi(menuId) {
    const menuList = typeof getMenu === "function" ? getMenu() : [];
    const item = menuList.find(m => m.id === menuId);

    if (!item || !item.tersedia) return;

    const isMakanan = item.kategori === "Makanan";

    // Reset state kustomisasi default
    kustomisasiState = {
        menu: item,
        ukuran: "Regular",
        suhu: "Dingin",
        sugar: "50%",
        ice: "Normal",
        boba: false,
        catatan: "",
        jumlah: 1
    };

    // Elemen modal
    const modal = document.getElementById("modalKustomisasi");
    const modalNamaMenu = document.getElementById("modalNamaMenu");
    const modalDeskripsiMenu = document.getElementById("modalDeskripsiMenu");
    const modalHargaDasar = document.getElementById("modalHargaDasar");
    const modalGambarMenu = document.getElementById("modalGambarMenu");
    const modalKategoriBadge = document.getElementById("modalKategoriBadge");
    const opsiMinumanContainer = document.getElementById("opsiMinumanContainer");
    const inputCatatan = document.getElementById("inputCatatan");
    const inputJumlah = document.getElementById("inputJumlah");
    const errorJumlah = document.getElementById("errorJumlah");

    // Isi konten dasar produk
    modalNamaMenu.textContent = item.nama;
    modalDeskripsiMenu.textContent = item.deskripsi;
    modalHargaDasar.textContent = formatRupiah(item.harga);
    modalGambarMenu.src = item.image || "coffee_hero.jpg";
    modalKategoriBadge.textContent = item.kategori;

    // Atur visibilitas opsi minuman vs makanan
    if (isMakanan) {
        opsiMinumanContainer.classList.add("hidden");
    } else {
        opsiMinumanContainer.classList.remove("hidden");
        resetTombolOpsiMinuman();
    }

    // Reset input catatan & jumlah
    inputCatatan.value = "";
    inputJumlah.value = 1;
    errorJumlah.textContent = "";

    // Hitung total awal
    hitungTotalKustomisasi();

    // Tampilkan modal
    modal.classList.remove("hidden");
}

/**
 * Reset tombol pill pada modal kustomisasi ke posisi default
 */
function resetTombolOpsiMinuman() {
    // Ukuran: Regular
    document.querySelectorAll("#grupUkuran .pill-btn").forEach(btn => btn.classList.remove("active"));
    const optRegular = document.getElementById("optRegular");
    if (optRegular) optRegular.classList.add("active");

    // Suhu: Dingin
    document.querySelectorAll("#grupSuhu .pill-btn").forEach(btn => btn.classList.remove("active"));
    const optCold = document.getElementById("optCold");
    if (optCold) optCold.classList.add("active");

    // Sugar: 50%
    document.querySelectorAll("#grupSugar .pill-btn").forEach(btn => btn.classList.remove("active"));
    const optSugar50 = document.getElementById("optSugar50");
    if (optSugar50) optSugar50.classList.add("active");

    // Ice: Normal
    document.querySelectorAll("#grupIce .pill-btn").forEach(btn => btn.classList.remove("active"));
    const optIceNormal = document.getElementById("optIceNormal");
    if (optIceNormal) optIceNormal.classList.add("active");

    // Boba: Unchecked
    const checkBoba = document.getElementById("checkBoba");
    if (checkBoba) checkBoba.checked = false;
}

/**
 * Handler pilihan ukuran (Regular / Large)
 */
function pilihUkuran(ukuran) {
    kustomisasiState.ukuran = ukuran;
    document.querySelectorAll("#grupUkuran .pill-btn").forEach(btn => btn.classList.remove("active"));
    const target = ukuran === "Large" ? document.getElementById("optLarge") : document.getElementById("optRegular");
    if (target) target.classList.add("active");
    hitungTotalKustomisasi();
}

/**
 * Handler pilihan suhu (Dingin / Panas)
 */
function pilihSuhu(suhu) {
    kustomisasiState.suhu = suhu;
    document.querySelectorAll("#grupSuhu .pill-btn").forEach(btn => btn.classList.remove("active"));
    const target = suhu === "Panas" ? document.getElementById("optHot") : document.getElementById("optCold");
    if (target) target.classList.add("active");

    // Jika Panas, sembunyikan atau sesuaikan opsi es batu
    const containerIce = document.getElementById("containerIceLevel");
    if (containerIce) {
        if (suhu === "Panas") {
            containerIce.style.display = "none";
            kustomisasiState.ice = "None (Panas)";
        } else {
            containerIce.style.display = "block";
            kustomisasiState.ice = "Normal";
        }
    }
    hitungTotalKustomisasi();
}

/**
 * Handler pilihan sugar level (0%, 25%, 50%, 100%)
 */
function pilihSugar(level) {
    kustomisasiState.sugar = level;
    document.querySelectorAll("#grupSugar .pill-btn").forEach(btn => {
        btn.classList.toggle("active", btn.textContent.trim() === level);
    });
}

/**
 * Handler pilihan ice level (Less, Normal, Extra)
 */
function pilihIce(level) {
    kustomisasiState.ice = level;
    document.querySelectorAll("#grupIce .pill-btn").forEach(btn => {
        btn.classList.toggle("active", btn.textContent.trim() === level);
    });
}

/**
 * Handler pilihan topping boba
 */
function toggleToppingBoba() {
    const checkBoba = document.getElementById("checkBoba");
    kustomisasiState.boba = checkBoba ? checkBoba.checked : false;
    hitungTotalKustomisasi();
}

/**
 * Kontrol jumlah pesanan dengan validasi batas batas BVA (1 sampai 20)
 * @param {number} delta - (+1 atau -1)
 */
function aturJumlahItem(delta) {
    const inputJumlah = document.getElementById("inputJumlah");
    const errorJumlah = document.getElementById("errorJumlah");
    let current = parseInt(inputJumlah.value) || 1;
    let baru = current + delta;

    // Aturan Pengujian Black Box: 1 sampai 20
    if (baru < 1) {
        errorJumlah.textContent = "Jumlah item minimal 1";
        return;
    }

    if (baru > 20) {
        errorJumlah.textContent = "Jumlah item maksimal 20";
        return;
    }

    errorJumlah.textContent = "";
    inputJumlah.value = baru;
    kustomisasiState.jumlah = baru;
    hitungTotalKustomisasi();
}

/**
 * Hitung total harga kustomisasi secara otomatis:
 * Total = (Harga Dasar + Tambahan Ukuran + Tambahan Topping) * Jumlah
 */
function hitungTotalKustomisasi() {
    if (!kustomisasiState.menu) return;

    let hargaSatuan = kustomisasiState.menu.harga;
    const isMakanan = kustomisasiState.menu.kategori === "Makanan";

    if (!isMakanan) {
        // Large menambah Rp5.000
        if (kustomisasiState.ukuran === "Large") {
            hargaSatuan += (typeof TAMBAHAN_LARGE !== "undefined" ? TAMBAHAN_LARGE : 5000);
        }
        // Boba menambah Rp3.000
        if (kustomisasiState.boba) {
            hargaSatuan += (typeof HARGA_BOBA !== "undefined" ? HARGA_BOBA : 3000);
        }
    }

    const subtotal = hargaSatuan * kustomisasiState.jumlah;
    const calcEl = document.getElementById("modalKalkulasiTotal");
    if (calcEl) calcEl.textContent = formatRupiah(subtotal);
}

/**
 * Masukkan item yang sudah dikustomisasi ke dalam keranjang belanja di localStorage
 */
function tambahkanKeKeranjang() {
    if (!kustomisasiState.menu) return;

    const isMakanan = kustomisasiState.menu.kategori === "Makanan";
    const inputCatatan = document.getElementById("inputCatatan");
    const inputJumlah = document.getElementById("inputJumlah");
    const errorJumlah = document.getElementById("errorJumlah");

    const jumlah = parseInt(inputJumlah.value);
    if (isNaN(jumlah) || jumlah < 1 || jumlah > 20) {
        errorJumlah.textContent = "Jumlah pesanan harus antara 1 sampai 20";
        return;
    }

    // Hitung harga satuan akhir
    let hargaSatuan = kustomisasiState.menu.harga;
    if (!isMakanan) {
        if (kustomisasiState.ukuran === "Large") {
            hargaSatuan += (typeof TAMBAHAN_LARGE !== "undefined" ? TAMBAHAN_LARGE : 5000);
        }
        if (kustomisasiState.boba) {
            hargaSatuan += (typeof HARGA_BOBA !== "undefined" ? HARGA_BOBA : 3000);
        }
    }

    const catatan = inputCatatan ? inputCatatan.value.trim() : "";

    // Objek item keranjang
    const itemKeranjang = {
        id: "ITEM-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        menuId: kustomisasiState.menu.id,
        nama: kustomisasiState.menu.nama,
        kategori: kustomisasiState.menu.kategori,
        hargaDasar: kustomisasiState.menu.harga,
        ukuran: isMakanan ? "-" : kustomisasiState.ukuran,
        suhu: isMakanan ? "-" : kustomisasiState.suhu,
        sugar: isMakanan ? "-" : kustomisasiState.sugar,
        ice: isMakanan ? "-" : kustomisasiState.ice,
        boba: isMakanan ? false : kustomisasiState.boba,
        catatan: catatan,
        jumlah: jumlah,
        hargaSatuan: hargaSatuan,
        subtotal: hargaSatuan * jumlah,
        image: kustomisasiState.menu.image || "coffee_hero.jpg"
    };

    // Simpan ke localStorage
    const keranjang = typeof getKeranjang === "function" ? getKeranjang() : [];
    keranjang.push(itemKeranjang);
    if (typeof saveKeranjang === "function") {
        saveKeranjang(keranjang);
    }

    // Tutup modal
    tutupModalKustomisasi();

    // Perbarui floating cart
    updateFloatingCart();

    // Notifikasi toast
    tampilkanToast(`✅ ${itemKeranjang.nama} (${jumlah}x) ditambahkan ke pesanan.`);
}

/**
 * Tutup modal kustomisasi
 */
function tutupModalKustomisasi() {
    const modal = document.getElementById("modalKustomisasi");
    if (modal) modal.classList.add("hidden");
}

// ==================== FLOATING CART & MODAL KERANJANG ====================
/**
 * Update ringkasan floating cart di bagian bawah layar
 */
function updateFloatingCart() {
    const keranjang = typeof getKeranjang === "function" ? getKeranjang() : [];
    const floatingBar = document.getElementById("floatingCartBar");
    const cartBadgeCount = document.getElementById("cartBadgeCount");
    const cartItemsText = document.getElementById("cartItemsText");
    const cartTotalPrice = document.getElementById("cartTotalPrice");

    const totalItem = keranjang.reduce((sum, it) => sum + it.jumlah, 0);
    const grandTotal = keranjang.reduce((sum, it) => sum + it.subtotal, 0);

    if (cartBadgeCount) cartBadgeCount.textContent = totalItem;
    if (cartItemsText) cartItemsText.textContent = `${totalItem} Item dipilih`;
    if (cartTotalPrice) cartTotalPrice.textContent = formatRupiah(grandTotal);

    if (floatingBar) {
        if (totalItem > 0) {
            floatingBar.classList.remove("hidden");
        } else {
            floatingBar.classList.add("hidden");
        }
    }
}

/**
 * Buka modal ringkasan keranjang sebelum checkout
 */
function bukaModalKeranjang() {
    const keranjang = typeof getKeranjang === "function" ? getKeranjang() : [];
    const modal = document.getElementById("modalKeranjang");
    const container = document.getElementById("cartItemsList");
    const grandTotalEl = document.getElementById("cartGrandTotalText");
    const cartMejaHeader = document.getElementById("cartMejaHeader");

    if (cartMejaHeader) cartMejaHeader.textContent = mejaAktif;

    if (keranjang.length === 0) {
        container.innerHTML = `
            <div class="empty-menu-state" style="padding: 2rem 0;">
                <p>🛒 Keranjang Anda masih kosong.</p>
                <small style="color: var(--color-text-muted);">Silakan pilih menu kopi atau camilan di atas.</small>
            </div>
        `;
        if (grandTotalEl) grandTotalEl.textContent = formatRupiah(0);
        if (modal) modal.classList.remove("hidden");
        return;
    }

    const grandTotal = keranjang.reduce((sum, it) => sum + it.subtotal, 0);
    if (grandTotalEl) grandTotalEl.textContent = formatRupiah(grandTotal);

    container.innerHTML = keranjang.map(item => `
        <div class="cart-item-row" id="cartRow-${item.id}">
            <div class="cart-item-info">
                <h4 class="cart-item-name">${item.nama}</h4>
                ${item.kategori !== "Makanan" ? `
                    <p class="cart-item-meta">
                        ${item.ukuran} • ${item.suhu} • Sugar ${item.sugar} • Ice ${item.ice}
                        ${item.boba ? ' • Boba' : ''}
                    </p>
                ` : ''}
                ${item.catatan ? `<p class="cart-item-note">📝 Catatan: "${item.catatan}"</p>` : ''}
                <p class="cart-item-price-calc">
                    ${formatRupiah(item.hargaSatuan)} × ${item.jumlah} = <strong>${formatRupiah(item.subtotal)}</strong>
                </p>
            </div>
            <button type="button" class="btn-remove-item" onclick="hapusItemDariKeranjang('${item.id}')" title="Hapus item">
                🗑️
            </button>
        </div>
    `).join("");

    if (modal) modal.classList.remove("hidden");
}

/**
 * Tutup modal ringkasan keranjang
 */
function tutupModalKeranjang() {
    const modal = document.getElementById("modalKeranjang");
    if (modal) modal.classList.add("hidden");
}

/**
 * Hapus satu item dari keranjang
 * @param {string} itemId - ID unik item keranjang
 */
function hapusItemDariKeranjang(itemId) {
    let keranjang = typeof getKeranjang === "function" ? getKeranjang() : [];
    keranjang = keranjang.filter(it => it.id !== itemId);
    if (typeof saveKeranjang === "function") {
        saveKeranjang(keranjang);
    }

    updateFloatingCart();
    bukaModalKeranjang();
    tampilkanToast("Item dihapus dari pesanan.");
}

/**
 * Lanjut ke halaman checkout (membawa parameter meja)
 */
function lanjutKeCheckout() {
    const keranjang = typeof getKeranjang === "function" ? getKeranjang() : [];
    if (keranjang.length === 0) {
        alert("Keranjang Anda masih kosong. Silakan pilih menu terlebih dahulu.");
        return;
    }

    window.location.href = `checkout.html?meja=${mejaAktif}`;
}

// ==================== NAVIGASI & MODAL HELPER ====================
/**
 * Buka dialog / kembali ke beranda untuk mengganti nomor meja
 */
function bukaGantiMeja() {
    if (confirm("Ingin berpindah meja atau mengganti nama pemesan?")) {
        window.location.href = `beranda.html?meja=${mejaAktif}`;
    }
}

/**
 * Perbarui semua tautan navbar agar menyertakan parameter meja aktif
 */
function perbaruiTautanNavbar(meja) {
    const linkBeranda = document.getElementById("linkBeranda");
    const linkMenu = document.getElementById("linkMenu");
    const linkKeranjang = document.getElementById("linkKeranjang");
    const linkStatus = document.getElementById("linkStatus");

    if (linkBeranda) linkBeranda.href = `beranda.html?meja=${meja}`;
    if (linkMenu) linkMenu.href = `menu.html?meja=${meja}`;
    if (linkKeranjang) linkKeranjang.href = `checkout.html?meja=${meja}`;
    if (linkStatus) linkStatus.href = `status.html?meja=${meja}`;
}

/**
 * Tutup modal jika user klik area gelap (overlay)
 */
function tutupModalJikaKlikLuar(event, modalId) {
    if (event.target.id === modalId) {
        document.getElementById(modalId).classList.add("hidden");
    }
}

/**
 * Setup hamburger menu untuk tampilan mobile
 */
function setupNavbarResponsive() {
    const hamburger = document.getElementById("navHamburger");
    const navLinks = document.getElementById("navLinks");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            navLinks.classList.toggle("show");
        });
    }
}

/**
 * Tampilkan notifikasi toast ringkas
 */
function tampilkanToast(pesan) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>☕</span> <span>${pesan}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

/**
 * Konfirmasi reset data uji
 */
function konfirmasiReset() {
    const yakin = confirm("Reset semua data uji ke kondisi awal?\nSemua keranjang dan pesanan akan dikembalikan ke kondisi awal.");
    if (yakin && typeof resetData === "function") {
        resetData().then(() => {
            alert("Data uji berhasil direset ke kondisi awal.");
            window.location.reload();
        });
    }
}
