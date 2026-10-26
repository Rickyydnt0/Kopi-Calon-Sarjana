/**
 * kasir.js — Logika Dasbor Kasir, POS (Point of Sale), Pembayaran Tunai, & Rekap
 * Kopi Calon Sarjana (Tahap 5)
 */

// ==================== STATE GLOBAL KASIR ====================
let kasirAktif = null;
let keranjangKasir = [];
let menuAktifKustom = null;
let toastKasirTimeout = null;

// ==================== INISIALISASI ====================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Guard Sesi: Pastikan kasir yang mengakses, jika admin arahkan ke admin.html (TC-01)
    kasirAktif = cekSesi("kasir");
    if (!kasirAktif) return;

    // 2. Inisialisasi seed data jika belum ada
    if (typeof initData === "function") {
        await initData();
    }

    // 3. Render Profil Kasir
    const elName = document.getElementById("kasirUserName");
    const elRole = document.getElementById("kasirUserRole");
    if (elName) elName.textContent = kasirAktif.username;
    if (elRole) elRole.textContent = kasirAktif.peran;

    // 4. Setup Navigasi Sidebar & Bottom Nav
    setupNavigasiKasir();

    // 5. Muat dan Render Komponen
    renderSemuaKasir();

    // 6. Real-time Synchronization antar-tab
    window.addEventListener("storage", (e) => {
        if (e.key === "kcs_pesanan" || e.key === "daftar_pesanan" || e.key === "kcs_menu") {
            renderSemuaKasir();
        }
    });
});

/**
 * Setup Navigasi Antar Tab di Dasbor Kasir
 */
function setupNavigasiKasir() {
    const navItems = [
        { id: "nav-pos", sectionId: "section-pos" },
        { id: "nav-tunai", sectionId: "section-tunai" },
        { id: "nav-rekap", sectionId: "section-rekap" }
    ];

    navItems.forEach(item => {
        const desktopBtn = document.getElementById(item.id);
        const mobileBtn = document.getElementById(`m-${item.id}`);

        const handleClick = (e) => {
            if (e) e.preventDefault();
            bukaSectionKasir(item.sectionId, item.id);
        };

        if (desktopBtn) desktopBtn.addEventListener("click", handleClick);
        if (mobileBtn) mobileBtn.addEventListener("click", handleClick);
    });
}

/**
 * Pindah section di dasbor kasir
 */
function bukaSectionKasir(sectionId, navId) {
    document.querySelectorAll(".admin-section").forEach(sec => sec.classList.remove("active"));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add("active");

    document.querySelectorAll(".nav-item, .bottom-nav-item").forEach(btn => btn.classList.remove("active"));
    const dBtn = document.getElementById(navId);
    const mBtn = document.getElementById(`m-${navId}`);
    if (dBtn) dBtn.classList.add("active");
    if (mBtn) mBtn.classList.add("active");

    if (sectionId === "section-pos") {
        renderMenuPOS();
        renderKeranjangPOS();
    } else if (sectionId === "section-tunai") {
        renderTabelPembayaranTunai();
    } else if (sectionId === "section-rekap") {
        renderRekapPenjualan();
    }
}

/**
 * Render seluruh data tampilan kasir
 */
function renderSemuaKasir() {
    renderMenuPOS();
    renderKeranjangPOS();
    renderTabelPembayaranTunai();
    renderRekapPenjualan();
}

// ==================== FITUR A: INPUT PESANAN (POS) ====================
/**
 * Render kartu menu di panel POS
 */
function renderMenuPOS() {
    const container = document.getElementById("pos-menu-container");
    if (!container) return;

    const listMenu = typeof getMenu === "function" ? getMenu() : [];

    if (listMenu.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">Menu belum tersedia.</div>`;
        return;
    }

    container.innerHTML = listMenu.map(m => {
        const isTersedia = m.tersedia !== false;
        const hargaFmt = typeof formatRupiah === "function" ? formatRupiah(m.harga) : `Rp${m.harga}`;
        const imgUrl = m.image || "coffee_hero.jpg";

        return `
            <div 
                class="pos-menu-card ${isTersedia ? '' : 'disabled'}"
                onclick="${isTersedia ? `bukaModalKustomPOS('${m.id}')` : ''}"
                title="${isTersedia ? `Klik untuk memilih ${m.nama}` : `${m.nama} (Stok Habis)`}"
            >
                <div class="pos-card-img-wrap">
                    <img src="${imgUrl}" alt="${m.nama}" class="pos-card-img" onerror="this.src='coffee_hero.jpg'">
                    <span class="pos-card-badge">${m.kategori}</span>
                </div>
                <div class="pos-card-body">
                    <div class="pos-card-title">${m.nama}</div>
                    ${!isTersedia ? '<span style="color:var(--color-error); font-size:0.75rem; font-weight:700;">🔴 Tidak Tersedia</span>' : ''}
                    <div class="pos-card-price">${hargaFmt}</div>
                </div>
            </div>
        `;
    }).join("");
}

/**
 * Buka modal kustomisasi item minuman/makanan untuk kasir
 */
function bukaModalKustomPOS(idMenu) {
    const listMenu = typeof getMenu === "function" ? getMenu() : [];
    const item = listMenu.find(m => m.id === idMenu);
    if (!item) return;

    menuAktifKustom = item;

    const modal = document.getElementById("modalKustomPOS");
    const title = document.getElementById("posModalItemTitle");
    const price = document.getElementById("posModalItemPrice");

    if (title) title.textContent = item.nama;
    if (price) price.textContent = typeof formatRupiah === "function" ? formatRupiah(item.harga) : `Rp${item.harga}`;

    // Reset pilihan modal kustomisasi
    document.querySelectorAll("input[name='pos-ukuran'][value='Regular']").forEach(r => r.checked = true);
    document.querySelectorAll("input[name='pos-sugar'][value='Normal']").forEach(r => r.checked = true);
    document.querySelectorAll("input[name='pos-ice'][value='Normal']").forEach(r => r.checked = true);
    const cbBoba = document.getElementById("pos-topping-boba");
    if (cbBoba) cbBoba.checked = false;

    const inputQty = document.getElementById("pos-kustom-qty");
    if (inputQty) inputQty.value = "1";

    // Update kalkulasi harga di modal
    updateHargaModalPOS();

    if (modal) modal.classList.add("active");
}

/**
 * Tutup modal kustomisasi POS
 */
function tutupModalKustomPOS() {
    const modal = document.getElementById("modalKustomPOS");
    if (modal) modal.classList.remove("active");
    menuAktifKustom = null;
}

/**
 * Perbarui subtotal harga di modal kustomisasi POS secara dinamis
 */
function updateHargaModalPOS() {
    if (!menuAktifKustom) return;

    const radioLarge = document.querySelector("input[name='pos-ukuran']:checked");
    const ukuran = radioLarge ? radioLarge.value : "Regular";
    const cbBoba = document.getElementById("pos-topping-boba");
    const boba = cbBoba && cbBoba.checked;

    const inputQty = document.getElementById("pos-kustom-qty");
    const qty = inputQty ? Math.max(1, parseInt(inputQty.value, 10) || 1) : 1;

    // Gunakan fungsi murni hargaSatuan & subtotal dari hitung.js
    const unitPrice = typeof hargaSatuan === "function"
        ? hargaSatuan(menuAktifKustom.harga, ukuran, boba)
        : menuAktifKustom.harga + (ukuran === "Large" ? 5000 : 0) + (boba ? 3000 : 0);

    const sub = typeof subtotal === "function"
        ? subtotal(unitPrice, qty)
        : unitPrice * qty;

    const elSub = document.getElementById("posModalSubtotal");
    if (elSub) {
        elSub.textContent = typeof formatRupiah === "function" ? formatRupiah(sub) : `Rp${sub}`;
    }
}

function ubahQtyModalPOS(delta) {
    const input = document.getElementById("pos-kustom-qty");
    if (!input) return;
    let val = parseInt(input.value, 10) || 1;
    val += delta;
    if (val < 1) val = 1;
    if (val > 20) val = 20;
    input.value = val;
    updateHargaModalPOS();
}

/**
 * Tambahkan item kustom dari modal ke Keranjang Kasir
 */
function tambahItemKeKeranjangKasir() {
    if (!menuAktifKustom) return;

    const radioUkuran = document.querySelector("input[name='pos-ukuran']:checked");
    const ukuran = radioUkuran ? radioUkuran.value : "Regular";

    const radioSugar = document.querySelector("input[name='pos-sugar']:checked");
    const sugar = radioSugar ? radioSugar.value : "Normal";

    const radioIce = document.querySelector("input[name='pos-ice']:checked");
    const ice = radioIce ? radioIce.value : "Normal";

    const cbBoba = document.getElementById("pos-topping-boba");
    const adaBoba = cbBoba && cbBoba.checked;

    const inputQty = document.getElementById("pos-kustom-qty");
    const qty = inputQty ? Math.max(1, parseInt(inputQty.value, 10) || 1) : 1;

    const unitPrice = typeof hargaSatuan === "function"
        ? hargaSatuan(menuAktifKustom.harga, ukuran, adaBoba)
        : menuAktifKustom.harga + (ukuran === "Large" ? 5000 : 0) + (adaBoba ? 3000 : 0);

    const sub = typeof subtotal === "function"
        ? subtotal(unitPrice, qty)
        : unitPrice * qty;

    // Susun ringkasan opsi kustomisasi
    const opsiArr = [];
    if (ukuran) opsiArr.push(ukuran);
    if (sugar) opsiArr.push(`Sugar: ${sugar}`);
    if (ice) opsiArr.push(`Ice: ${ice}`);
    if (adaBoba) opsiArr.push("Topping: Boba");

    keranjangKasir.push({
        id: menuAktifKustom.id,
        nama: menuAktifKustom.nama,
        kategori: menuAktifKustom.kategori,
        ukuran: ukuran,
        sugar: sugar,
        ice: ice,
        boba: adaBoba ? "boba" : "none",
        hargaDasar: menuAktifKustom.harga,
        hargaSatuan: unitPrice,
        jumlah: qty,
        subtotal: sub,
        ringkasanOpsi: opsiArr.join(", ")
    });

    tutupModalKustomPOS();
    renderKeranjangPOS();
}

/**
 * Render isi keranjang kasir
 */
function renderKeranjangPOS() {
    const container = document.getElementById("pos-keranjang");
    const totalEl = document.getElementById("pos-total-harga");
    const countEl = document.getElementById("pos-item-count");

    if (!container) return;

    if (keranjangKasir.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem 1rem; color: var(--color-text-secondary); font-size: 0.85rem;">
                <div style="font-size: 2rem; margin-bottom: 0.35rem;">🛒</div>
                Keranjang kasir kosong.<br>Pilih menu di samping untuk menambahkan.
            </div>
        `;
        if (totalEl) totalEl.textContent = "Rp0";
        if (countEl) countEl.textContent = "0";
        return;
    }

    const total = typeof totalKeranjang === "function"
        ? totalKeranjang(keranjangKasir)
        : keranjangKasir.reduce((sum, it) => sum + (it.subtotal || 0), 0);

    if (totalEl) totalEl.textContent = typeof formatRupiah === "function" ? formatRupiah(total) : `Rp${total}`;
    if (countEl) countEl.textContent = keranjangKasir.length;

    container.innerHTML = keranjangKasir.map((it, idx) => `
        <div class="pos-cart-item">
            <div class="pos-item-header">
                <span>${it.nama}</span>
                <span>${typeof formatRupiah === "function" ? formatRupiah(it.subtotal) : `Rp${it.subtotal}`}</span>
            </div>
            <div class="pos-item-meta">${it.ringkasanOpsi || `Jumlah: ${it.jumlah}`}</div>
            <div class="pos-item-controls">
                <div class="pos-qty-stepper">
                    <button class="pos-btn-step" onclick="ubahQtyItemKeranjangKasir(${idx}, -1)">-</button>
                    <span style="font-weight: 700; font-size: 0.85rem; min-width: 20px; text-align: center;">${it.jumlah}</span>
                    <button class="pos-btn-step" onclick="ubahQtyItemKeranjangKasir(${idx}, 1)">+</button>
                </div>
                <button 
                    onclick="hapusItemKeranjangKasir(${idx})"
                    style="background:none; border:none; color:var(--color-error); font-size:0.8rem; cursor:pointer;"
                >
                    Hapus
                </button>
            </div>
        </div>
    `).join("");
}

function ubahQtyItemKeranjangKasir(idx, delta) {
    if (!keranjangKasir[idx]) return;
    keranjangKasir[idx].jumlah += delta;
    if (keranjangKasir[idx].jumlah <= 0) {
        keranjangKasir.splice(idx, 1);
    } else {
        keranjangKasir[idx].subtotal = keranjangKasir[idx].hargaSatuan * keranjangKasir[idx].jumlah;
    }
    renderKeranjangPOS();
}

function hapusItemKeranjangKasir(idx) {
    keranjangKasir.splice(idx, 1);
    renderKeranjangPOS();
}

function kosongkanKeranjangKasir() {
    keranjangKasir = [];
    renderKeranjangPOS();
}

/**
 * Simpan Pesanan Kasir (TC-26)
 * Otomatis statusBayar = "Lunas", status = "Diproses", sumber = "kasir"
 */
function handleSimpanPesananKasir(e) {
    if (e) e.preventDefault();

    if (keranjangKasir.length === 0) {
        alert("Keranjang pesanan masih kosong. Silakan pilih menu terlebih dahulu.");
        return;
    }

    const inputNama = document.getElementById("pos-input-nama");
    const inputMeja = document.getElementById("pos-input-meja");

    const nama = inputNama ? inputNama.value.trim() : "";
    const meja = (inputMeja && inputMeja.value.trim()) ? inputMeja.value.trim() : "01";

    // Validasi Nama Pelanggan (3 - 30 karakter)
    if (nama.length < 3 || nama.length > 30) {
        alert("Nama Pelanggan wajib diisi (3 - 30 karakter).");
        if (inputNama) inputNama.focus();
        return;
    }

    const total = typeof totalKeranjang === "function"
        ? totalKeranjang(keranjangKasir)
        : keranjangKasir.reduce((sum, it) => sum + (it.subtotal || 0), 0);

    const idPesanan = typeof generateNomorPesanan === "function"
        ? generateNomorPesanan()
        : "KCS-" + String(Date.now()).slice(-4);

    // Objek Pesanan Baru Sesuai Spesifikasi Kasir
    const pesananKasirBaru = {
        idPesanan: idPesanan,
        id: idPesanan,
        nama: nama,
        meja: meja,
        items: [...keranjangKasir],
        total: total,
        metodePembayaran: "Tunai",
        metodeBayar: "tunai",
        statusBayar: "Lunas",      // Langsung Lunas
        status: "Diproses",        // Langsung Diproses
        sumber: "kasir",
        kasir: kasirAktif ? kasirAktif.username : "kasir01",
        timestamp: new Date().toISOString()
    };

    // Simpan ke localStorage global pesanan
    const daftar = typeof getPesanan === "function" ? getPesanan() : [];
    daftar.push(pesananKasirBaru);

    if (typeof savePesanan === "function") {
        savePesanan(daftar);
    } else {
        localStorage.setItem("daftar_pesanan", JSON.stringify(daftar));
        localStorage.setItem("kcs_pesanan", JSON.stringify(daftar));
    }

    // Reset Form & Keranjang
    keranjangKasir = [];
    if (inputNama) inputNama.value = "";
    if (inputMeja) inputMeja.value = "";
    renderKeranjangPOS();

    // Notifikasi Sukses
    tampilkanToastKasir(`✅ Pesanan ${idPesanan} berhasil disimpan! Status: Diproses (Lunas)`);
    renderTabelPembayaranTunai();
    renderRekapPenjualan();
}

// ==================== FITUR B: PENERIMAAN PEMBAYARAN TUNAI ====================
/**
 * Render tabel antrean pembayaran tunai pelanggan (TC-15)
 * Memfilter pesanan pelanggan dengan metode = 'tunai' dan statusBayar = 'Menunggu Pembayaran'
 */
function renderTabelPembayaranTunai() {
    const tbody = document.getElementById("tabel-pembayaran-tunai");
    if (!tbody) return;

    const daftar = typeof getSemuaPesananTernormalisasi === "function"
        ? getSemuaPesananTernormalisasi()
        : (typeof getPesanan === "function" ? getPesanan() : []);

    // Filter: metode tunai DAN statusBayar belum lunas (Menunggu Pembayaran)
    const antreanTunai = daftar.filter(p => {
        const metode = (p.metodeBayar || p.metodePembayaran || "").toLowerCase();
        const isTunai = !metode.includes("non") && !metode.includes("qris") && !metode.includes("transfer");
        const statusBayar = (p.statusBayar || "").toLowerCase();
        const belumLunas = statusBayar === "menunggu pembayaran" || statusBayar === "belum dibayar" || statusBayar === "";
        return isTunai && belumLunas;
    });

    const badgeCount = document.getElementById("badge-count-tunai");
    if (badgeCount) badgeCount.textContent = antreanTunai.length;

    if (antreanTunai.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
                    <div style="font-size: 2rem; margin-bottom: 0.35rem;">💵</div>
                    <strong>Tidak Ada Pesanan Menunggu Pembayaran Tunai</strong>
                    <p style="font-size: 0.825rem; margin-top: 0.25rem;">Pesanan tunai dari pelanggan di meja akan otomatis muncul di sini.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = antreanTunai.map(p => {
        const id = p.idPesanan || p.id;
        const totalFmt = typeof formatRupiah === "function" ? formatRupiah(p.total) : `Rp${p.total}`;

        return `
            <tr id="row-tunai-${id}">
                <td>
                    <strong>${id}</strong>
                    <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${formatWaktu(p.timestamp)}</div>
                </td>
                <td><strong>Meja ${p.meja}</strong></td>
                <td>${p.nama || "Pelanggan"}</td>
                <td><strong style="color: var(--color-primary);">${totalFmt}</strong></td>
                <td>
                    <button 
                        class="header-action-btn"
                        style="padding: 0.45rem 0.9rem; font-size: 0.825rem;"
                        onclick="handleTerimaPembayaranTunai('${id}')"
                    >
                        <span>✓</span>
                        <span>Terima Pembayaran</span>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

/**
 * Aksi Konfirmasi Terima Pembayaran Tunai (TC-15)
 * Mengubah statusBayar -> "Lunas", status -> "Diproses"
 * @param {string} idPesanan
 */
function handleTerimaPembayaranTunai(idPesanan) {
    const daftar = typeof getPesanan === "function" ? getPesanan() : [];
    const idx = daftar.findIndex(p => (p.idPesanan === idPesanan || p.id === idPesanan));

    if (idx === -1) {
        alert("Pesanan tidak ditemukan.");
        return;
    }

    // Ubah status pembayaran ke Lunas dan alur ke Diproses
    daftar[idx].statusBayar = "Lunas";
    daftar[idx].status = "Diproses";
    daftar[idx].diterimaOlehKasir = kasirAktif ? kasirAktif.username : "kasir01";
    daftar[idx].waktuLunas = new Date().toISOString();

    if (typeof savePesanan === "function") {
        savePesanan(daftar);
    } else {
        localStorage.setItem("daftar_pesanan", JSON.stringify(daftar));
        localStorage.setItem("kcs_pesanan", JSON.stringify(daftar));
    }

    tampilkanToastKasir(`✅ Pembayaran tunai untuk ${idPesanan} DITERIMA! Status bayar: Lunas & Pesanan Diproses.`);
    renderTabelPembayaranTunai();
    renderRekapPenjualan();
}

// ==================== FITUR C: REKAP PENJUALAN ====================
let tabRekapAktif = "harian";

function bukaTabRekap(tipe) {
    tabRekapAktif = tipe;
    document.querySelectorAll(".rekap-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".rekap-tab-content").forEach(c => c.classList.remove("active"));

    const btn = document.getElementById(`btn-tab-${tipe}`);
    const content = document.getElementById(`tab-content-${tipe}`);

    if (btn) btn.classList.add("active");
    if (content) content.classList.add("active");

    renderRekapPenjualan();
}

/**
 * Render data Rekap Penjualan menggunakan fungsi hitungRekap dari js/rekap.js
 * (TC-16, TC-27)
 */
function renderRekapPenjualan() {
    const daftar = typeof getPesanan === "function" ? getPesanan() : [];

    // Hitung menggunakan pure function dari js/rekap.js
    const rekap = typeof hitungRekap === "function"
        ? hitungRekap(new Date(), daftar)
        : { tunai: 0, nonTunai: 0, total: 0, totalBulanan: 0 };

    // Update Elemen Rekap Harian (TC-16)
    const elTunaiHarian = document.getElementById("rekap-tunai-harian");
    const elNonTunaiHarian = document.getElementById("rekap-nontunai-harian");
    const elTotalHarian = document.getElementById("rekap-total-harian");

    if (elTunaiHarian) elTunaiHarian.textContent = typeof formatRupiah === "function" ? formatRupiah(rekap.tunai) : `Rp${rekap.tunai}`;
    if (elNonTunaiHarian) elNonTunaiHarian.textContent = typeof formatRupiah === "function" ? formatRupiah(rekap.nonTunai) : `Rp${rekap.nonTunai}`;
    if (elTotalHarian) elTotalHarian.textContent = typeof formatRupiah === "function" ? formatRupiah(rekap.total) : `Rp${rekap.total}`;

    // Update Elemen Rekap Bulanan (TC-27)
    const elTotalBulanan = document.getElementById("rekap-total-bulanan");
    if (elTotalBulanan) elTotalBulanan.textContent = typeof formatRupiah === "function" ? formatRupiah(rekap.totalBulanan) : `Rp${rekap.totalBulanan}`;

    // Update Label Bulan Berjalan
    const elNamaBulan = document.getElementById("rekap-nama-bulan");
    if (elNamaBulan) {
        const bln = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });
        elNamaBulan.textContent = bln;
    }
}

/**
 * Handler Tombol Inject Data Dummy Kemarin (TC-27)
 */
function handleInjectDummy() {
    if (typeof injectDataDummyKemarin === "function") {
        const p = injectDataDummyKemarin();
        tampilkanToastKasir(`🧪 Data dummy kemarin (${typeof formatRupiah === "function" ? formatRupiah(p.total) : `Rp${p.total}`}) disuntikkan. Rekap Bulanan bertambah!`);
        renderRekapPenjualan();
    }
}

// ==================== TOAST NOTIFIKASI ====================
function tampilkanToastKasir(pesan) {
    const toast = document.getElementById("toast-kasir");
    const toastText = document.getElementById("toast-kasir-text");

    if (!toast) return;

    if (toastText) toastText.textContent = pesan;
    else toast.textContent = pesan;

    toast.classList.add("show");

    if (toastKasirTimeout) clearTimeout(toastKasirTimeout);
    toastKasirTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3200);
}

function formatWaktu(isoString) {
    if (!isoString) return "-";
    try {
        const d = new Date(isoString);
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
        return "-";
    }
}

