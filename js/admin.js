/**
 * admin.js — Logika Dasbor Admin, Antrean Pesanan, & Kelola Menu
 * Kopi Calon Sarjana (Tahap 4)
 */

// ==================== STATE GLOBAL ADMIN ====================
let adminAktif = null;
let pesananDipilihUntukBukti = null;
let menuDipilihUntukEdit = null;
let toastTimeout = null;

// ==================== INISIALISASI HALAMAN ====================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Guard Sesi: Pastikan hanya admin yang bisa mengakses (TC-01 & TC-06)
    adminAktif = cekSesi("admin");
    if (!adminAktif) return;

    // 2. Inisialisasi seed data jika belum ada
    if (typeof initData === "function") {
        await initData();
    }

    // 3. Render Profil Admin
    const userRoleEl = document.getElementById("adminUserRole");
    const userNameEl = document.getElementById("adminUserName");
    if (userNameEl) userNameEl.textContent = adminAktif.username;
    if (userRoleEl) userRoleEl.textContent = adminAktif.peran;

    // 4. Setup Navigasi Tab (Dashboard, Antrean, Menu)
    setupNavigasi();

    // 5. Muat dan Render Data Pertama Kali
    renderSemuaData();

    // 6. Real-time Listener: Sinkronisasi otomatis saat ada pesanan baru di tab lain
    window.addEventListener("storage", (e) => {
        if (e.key === "kcs_pesanan" || e.key === "daftar_pesanan" || e.key === "kcs_menu") {
            renderSemuaData();
        }
    });
});

/**
 * Setup Navigasi Sidebar dan Mobile Bottom Nav
 */
function setupNavigasi() {
    const navItems = [
        { id: "nav-dashboard", sectionId: "section-dashboard" },
        { id: "nav-antrean", sectionId: "section-antrean" },
        { id: "nav-menu", sectionId: "section-menu" },
        { id: "nav-rekap", sectionId: "section-rekap" }
    ];

    navItems.forEach(item => {
        const desktopBtn = document.getElementById(item.id);
        const mobileBtn = document.getElementById(`m-${item.id}`);

        const handleClick = (e) => {
            if (e) e.preventDefault();
            bukaSection(item.sectionId, item.id);
        };

        if (desktopBtn) desktopBtn.addEventListener("click", handleClick);
        if (mobileBtn) mobileBtn.addEventListener("click", handleClick);
    });
}

/**
 * Berpindah tampilan section
 * @param {string} sectionId
 * @param {string} navId
 */
function bukaSection(sectionId, navId) {
    // Sembunyikan semua section
    document.querySelectorAll(".admin-section").forEach(sec => sec.classList.remove("active"));
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.add("active");

    // Update active class di navigasi desktop & mobile
    document.querySelectorAll(".nav-item, .bottom-nav-item").forEach(btn => btn.classList.remove("active"));

    const activeDesktop = document.getElementById(navId);
    const activeMobile = document.getElementById(`m-${navId}`);
    if (activeDesktop) activeDesktop.classList.add("active");
    if (activeMobile) activeMobile.classList.add("active");

    // Render ulang konten section jika diperlukan
    if (sectionId === "section-dashboard") {
        renderDasbor();
    } else if (sectionId === "section-antrean") {
        renderAntreanPesanan();
    } else if (sectionId === "section-menu") {
        renderTabelMenu();
    } else if (sectionId === "section-rekap") {
        renderRekapPenjualanAdmin();
    }
}

/**
 * Render ulang seluruh tampilan (Dasbor, Antrean, Menu, dan Rekap)
 */
function renderSemuaData() {
    renderDasbor();
    renderAntreanPesanan();
    renderTabelMenu();
    renderRekapPenjualanAdmin();
}

// ==================== FITUR A: DASBOR (RINGKASAN) ====================
/**
 * Render 3 kartu metrik hari ini
 */
function renderDasbor() {
    const stats = typeof getStatistikHariIni === "function"
        ? getStatistikHariIni()
        : { pesananHariIni: 0, menungguKonfirmasi: 0, totalPenjualan: 0 };

    const elTotalPesanan = document.getElementById("stat-total-pesanan");
    const elMenungguKonfirmasi = document.getElementById("stat-menunggu-konfirmasi");
    const elTotalPenjualan = document.getElementById("stat-total-penjualan");

    if (elTotalPesanan) elTotalPesanan.textContent = stats.pesananHariIni;
    if (elMenungguKonfirmasi) elMenungguKonfirmasi.textContent = stats.menungguKonfirmasi;
    if (elTotalPenjualan) {
        elTotalPenjualan.textContent = typeof formatRupiah === "function"
            ? formatRupiah(stats.totalPenjualan)
            : `Rp${stats.totalPenjualan.toLocaleString("id-ID")}`;
    }

    // Render juga ringkasan 5 antrean terakhir di dasbor
    renderAntreanMiniDasbor();
}

/**
 * Render ringkasan pesanan terbaru di dalam halaman dasbor
 */
function renderAntreanMiniDasbor() {
    const tbody = document.getElementById("tbody-antrean-mini");
    if (!tbody) return;

    const daftar = typeof getSemuaPesananTernormalisasi === "function"
        ? getSemuaPesananTernormalisasi()
        : [];

    const limaTerbaru = daftar.slice(0, 5);

    if (limaTerbaru.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 1.5rem; color: var(--color-text-secondary);">Belum ada transaksi hari ini.</td></tr>`;
        return;
    }

    tbody.innerHTML = limaTerbaru.map(p => `
        <tr>
            <td><strong>${p.idPesanan || p.id}</strong></td>
            <td>Meja ${p.meja}</td>
            <td>${renderBadgeStatusBayar(p.statusBayar)}</td>
            <td>${renderBadgeStatusPesanan(p.status)}</td>
            <td><strong>${typeof formatRupiah === "function" ? formatRupiah(p.total) : `Rp${p.total}`}</strong></td>
        </tr>
    `).join("");
}

// ==================== FITUR B: ANTREAN PESANAN ====================
/**
 * Render tabel antrean pesanan lengkap, urut dari terbaru
 */
function renderAntreanPesanan() {
    const tbody = document.getElementById("tbody-antrean-pesanan");
    if (!tbody) return;

    const daftar = typeof getSemuaPesananTernormalisasi === "function"
        ? getSemuaPesananTernormalisasi()
        : [];

    if (daftar.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
                    <strong>Belum Ada Antrean Pesanan</strong>
                    <p style="font-size: 0.85rem; margin-top: 0.25rem;">Pesanan yang dibuat oleh pelanggan akan otomatis muncul di sini secara real-time.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = daftar.map(p => {
        const id = p.idPesanan || p.id;
        const isNonTunaiVerif = (p.metodeBayar === "nontunai" || (p.metodePembayaran && p.metodePembayaran.toLowerCase().includes("non"))) &&
            p.statusBayar === "Menunggu Verifikasi";

        return `
            <tr id="row-pesanan-${id}">
                <td>
                    <div style="font-weight: 700; color: var(--color-primary);">${id}</div>
                    <div style="font-size: 0.775rem; color: var(--color-text-secondary);">${formatWaktu(p.timestamp)}</div>
                </td>
                <td>
                    <strong>Meja ${p.meja}</strong>
                    <div style="font-size: 0.775rem; color: var(--color-text-secondary);">${p.nama || "Pelanggan"}</div>
                </td>
                <td>${renderBadgeStatusBayar(p.statusBayar)}</td>
                <td>${renderBadgeStatusPesanan(p.status)}</td>
                <td>
                    <strong>${typeof formatRupiah === "function" ? formatRupiah(p.total) : `Rp${p.total}`}</strong>
                    <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${p.items ? p.items.length : 0} item</div>
                </td>
                <td>
                    <div class="action-cell-flex">
                        ${isNonTunaiVerif ? `
                            <button class="btn-action-small btn-bukti" onclick="bukaModalBukti('${id}')" title="Periksa Bukti Transfer">
                                <span>🔍</span>
                                <span>Lihat Bukti</span>
                            </button>
                        ` : ''}

                        <!-- Dropdown Ubah Status Berurutan -->
                        <select 
                            id="select-status-${id}"
                            class="select-status-dropdown select-status" 
                            onchange="handleDropdownUbahStatus('${id}', this.value, '${p.status}')"
                            title="Ubah Status Pesanan"
                        >
                            <option value="Menunggu Konfirmasi" ${p.status === "Menunggu Konfirmasi" ? "selected" : ""}>Menunggu Konfirmasi</option>
                            <option value="Diproses" ${p.status === "Diproses" ? "selected" : ""}>Diproses</option>
                            <option value="Siap Diambil" ${p.status === "Siap Diambil" ? "selected" : ""}>Siap Diambil</option>
                            <option value="Selesai" ${p.status === "Selesai" ? "selected" : ""}>Selesai</option>
                        </select>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

/**
 * Handler saat admin mengubah status dari dropdown di tabel
 * Menguji validasi transisi alur (TC-13 sukses, TC-23 ditolak)
 * @param {string} idPesanan
 * @param {string} statusBaru
 * @param {string} statusLama
 */
function handleDropdownUbahStatus(idPesanan, statusBaru, statusLama) {
    if (statusBaru === statusLama) return;

    // Cek validitas transisi menggunakan fungsi ubahStatus dari js/pesanan.js
    const hasil = ubahStatus(idPesanan, statusBaru, adminAktif ? adminAktif.username : "admin");

    if (!hasil.success) {
        // TC-23: Lompat atau mundur status ditolak sistem
        tampilkanToastError(hasil.message || "Perubahan status tidak valid");

        // Kembalikan pilihan dropdown ke status lama
        const dropdown = document.getElementById(`select-status-${idPesanan}`);
        if (dropdown) dropdown.value = statusLama;
        return;
    }

    // TC-13: Perubahan berurutan berhasil
    tampilkanToastSuccess(`Status pesanan ${idPesanan} diubah ke "${statusBaru}"`);
    renderSemuaData();
}

// ==================== VERIFIKASI PEMBAYARAN NON-TUNAI ====================
/**
 * Membuka modal verifikasi bukti pembayaran (Tahap 3 & 4)
 * @param {string} idPesanan
 */
function bukaModalBukti(idPesanan) {
    const daftar = typeof getSemuaPesananTernormalisasi === "function"
        ? getSemuaPesananTernormalisasi()
        : [];

    const pesanan = daftar.find(p => (p.idPesanan === idPesanan || p.id === idPesanan));
    if (!pesanan) return;

    pesananDipilihUntukBukti = pesanan;

    const modal = document.getElementById("modalBuktiPembayaran");
    const container = document.getElementById("buktiPreviewArea");
    const detailMeta = document.getElementById("buktiDetailMeta");

    const totalFmt = typeof formatRupiah === "function" ? formatRupiah(pesanan.total) : `Rp${pesanan.total}`;

    // Render Gambar Bukti atau Mockup Preview Berkualitas
    const namaFile = pesanan.namaFileBukti || "bukti_transfer.jpg";
    
    // Gunakan gambar bukti jika ada, atau buat preview slip transfer digital yang rapi
    const previewHtml = pesanan.gambarBukti 
        ? `<img src="${pesanan.gambarBukti}" alt="Bukti Pembayaran" class="bukti-img-preview">`
        : `
            <div style="background: #ffffff; border: 1.5px dashed var(--color-accent); border-radius: 12px; padding: 1.5rem; text-align: center;">
                <div style="font-size: 2.75rem; color: var(--color-accent); margin-bottom: 0.5rem;">🧾</div>
                <h4 style="color: var(--color-primary); font-size: 1.05rem; margin-bottom: 0.25rem;">Bukti Transfer QRIS / Bank</h4>
                <div style="font-size: 0.825rem; color: var(--color-text-secondary); margin-bottom: 0.75rem;">
                    File terlampir: <strong>${namaFile}</strong>
                </div>
                <div style="background: #faf6f1; border-radius: 8px; padding: 0.75rem; text-align: left; font-size: 0.85rem; line-height: 1.6;">
                    <div>• <strong>Nominal Transfer:</strong> ${totalFmt}</div>
                    <div>• <strong>Pengirim / Pelanggan:</strong> ${pesanan.nama || "Pelanggan"} (Meja ${pesanan.meja})</div>
                    <div>• <strong>Waktu Transaksi:</strong> ${formatWaktu(pesanan.timestamp)}</div>
                    <div>• <strong>Tujuan:</strong> QRIS Kopi Calon Sarjana</div>
                </div>
            </div>
        `;

    if (container) container.innerHTML = previewHtml;

    if (detailMeta) {
        detailMeta.innerHTML = `
            Memverifikasi pesanan <strong>${pesanan.idPesanan || pesanan.id}</strong> — Meja <strong>${pesanan.meja}</strong> (${totalFmt})
        `;
    }

    if (modal) modal.classList.add("active");
}

/**
 * Menutup modal bukti pembayaran
 */
function tutupModalBukti() {
    const modal = document.getElementById("modalBuktiPembayaran");
    if (modal) modal.classList.remove("active");
    pesananDipilihUntukBukti = null;
}

/**
 * Aksi Tombol Terima Bukti (TC-12)
 * statusBayar -> "Lunas", status -> "Diproses"
 */
function handleAksiTerimaBukti() {
    if (!pesananDipilihUntukBukti) return;
    const id = pesananDipilihUntukBukti.idPesanan || pesananDipilihUntukBukti.id;

    const hasil = verifikasiPembayaran(id, "terima", adminAktif ? adminAktif.username : "admin");
    tutupModalBukti();

    if (hasil.success) {
        tampilkanToastSuccess(`✅ Pembayaran pesanan ${id} DITERIMA! Status bayar Lunas & pesanan Diproses.`);
        renderSemuaData();
    } else {
        tampilkanToastError(hasil.message);
    }
}

/**
 * Aksi Tombol Tolak Bukti (TC-22)
 * statusBayar -> "Ditolak"
 */
function handleAksiTolakBukti() {
    if (!pesananDipilihUntukBukti) return;
    const id = pesananDipilihUntukBukti.idPesanan || pesananDipilihUntukBukti.id;

    const hasil = verifikasiPembayaran(id, "tolak", adminAktif ? adminAktif.username : "admin");
    tutupModalBukti();

    if (hasil.success) {
        tampilkanToastError(`⚠️ Bukti pembayaran pesanan ${id} DITOLAK.`);
        renderSemuaData();
    } else {
        tampilkanToastError(hasil.message);
    }
}

// ==================== FITUR C: KELOLA MENU ====================
/**
 * Render tabel menu untuk admin
 */
function renderTabelMenu() {
    const tbody = document.getElementById("tbody-kelola-menu");
    if (!tbody) return;

    const menu = typeof getMenu === "function" ? getMenu() : [];

    if (menu.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem;">Menu kosong. Silakan tambahkan menu baru.</td></tr>`;
        return;
    }

    tbody.innerHTML = menu.map((m, idx) => {
        const isTersedia = m.tersedia !== false;
        const hargaFmt = typeof formatRupiah === "function" ? formatRupiah(m.harga) : `Rp${m.harga}`;
        const imgUrl = m.image || "coffee_hero.jpg";

        return `
            <tr id="row-menu-${m.id}">
                <td><code>${m.id}</code></td>
                <td>
                    <img src="${imgUrl}" alt="${m.nama}" class="menu-img-mini" onerror="this.src='coffee_hero.jpg'">
                </td>
                <td>
                    <div style="font-weight: 700; color: var(--color-primary);">${m.nama}</div>
                    <div style="font-size: 0.775rem; color: var(--color-text-secondary); max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${m.deskripsi || "-"}
                    </div>
                </td>
                <td><span class="badge" style="background: #fdf2e9; color: var(--color-primary);">${m.kategori}</span></td>
                <td><strong>${hargaFmt}</strong></td>
                <td>
                    <!-- Switch / Toggle Ketersediaan (TC-14) -->
                    <button 
                        class="toggle-switch-btn ${isTersedia ? 'toggle-tersedia' : 'toggle-habis'}"
                        onclick="toggleKetersediaanMenu('${m.id}')"
                        title="Klik untuk mengubah ketersediaan"
                    >
                        <span>${isTersedia ? '🟢 Tersedia' : '🔴 Tidak Tersedia'}</span>
                    </button>
                </td>
                <td>
                    <div class="action-cell-flex">
                        <button class="btn-icon-action" onclick="bukaModalEditMenu('${m.id}')" title="Edit Menu (TC-30)">
                            ✏️ Edit
                        </button>
                        <button class="btn-icon-action btn-icon-delete" onclick="hapusMenu('${m.id}', '${m.nama}')" title="Hapus Menu">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

/**
 * Toggle Ketersediaan Menu (TC-14)
 * Mengubah tersedia: true <-> false
 * @param {string} idMenu
 */
function toggleKetersediaanMenu(idMenu) {
    const menu = typeof getMenu === "function" ? getMenu() : [];
    const item = menu.find(m => m.id === idMenu);

    if (!item) return;

    // Toggle boolean
    item.tersedia = (item.tersedia === false) ? true : false;

    // Simpan kembali ke localStorage (kcs_menu)
    if (typeof saveMenu === "function") {
        saveMenu(menu);
    } else {
        localStorage.setItem("kcs_menu", JSON.stringify(menu));
    }

    tampilkanToastSuccess(`Status ketersediaan "${item.nama}" diubah menjadi: ${item.tersedia ? 'Tersedia' : 'Tidak Tersedia'}`);
    renderTabelMenu();
}

/**
 * Membuka Modal Tambah Menu Baru
 */
function bukaModalTambahMenu() {
    menuDipilihUntukEdit = null;
    const modal = document.getElementById("modalKelolaMenu");
    const modalTitle = document.getElementById("modalMenuTitle");
    const form = document.getElementById("formMenuAdmin");

    if (modalTitle) modalTitle.textContent = "Tambah Menu Baru";
    if (form) form.reset();

    // Reset hidden ID
    const inputId = document.getElementById("input-menu-id");
    if (inputId) inputId.value = "";

    if (modal) modal.classList.add("active");
}

/**
 * Membuka Modal Edit Menu (TC-30: Edit Harga Es Kopi Susu dari 25000 jadi 27000)
 * @param {string} idMenu
 */
function bukaModalEditMenu(idMenu) {
    const menu = typeof getMenu === "function" ? getMenu() : [];
    const item = menu.find(m => m.id === idMenu);
    if (!item) return;

    menuDipilihUntukEdit = item;

    const modal = document.getElementById("modalKelolaMenu");
    const modalTitle = document.getElementById("modalMenuTitle");

    if (modalTitle) modalTitle.textContent = `Edit Menu: ${item.nama}`;

    document.getElementById("input-menu-id").value = item.id;
    document.getElementById("input-menu-nama").value = item.nama;
    document.getElementById("input-menu-kategori").value = item.kategori;
    document.getElementById("input-menu-harga").value = item.harga;
    document.getElementById("input-menu-deskripsi").value = item.deskripsi || "";
    document.getElementById("input-menu-image").value = item.image || "";

    if (modal) modal.classList.add("active");
}

/**
 * Menutup Modal Kelola Menu
 */
function tutupModalMenu() {
    const modal = document.getElementById("modalKelolaMenu");
    if (modal) modal.classList.remove("active");
    menuDipilihUntukEdit = null;
}

/**
 * Simpan Form Tambah / Edit Menu
 * @param {Event} e
 */
function handleSimpanMenu(e) {
    if (e) e.preventDefault();

    const id = document.getElementById("input-menu-id").value.trim();
    const nama = document.getElementById("input-menu-nama").value.trim();
    const kategori = document.getElementById("input-menu-kategori").value;
    const hargaStr = document.getElementById("input-menu-harga").value.trim();
    const deskripsi = document.getElementById("input-menu-deskripsi").value.trim();
    const image = document.getElementById("input-menu-image").value.trim();

    if (!nama) {
        alert("Nama menu wajib diisi.");
        return;
    }

    const harga = parseInt(hargaStr, 10);
    if (isNaN(harga) || harga <= 0) {
        alert("Harga menu wajib berupa angka yang valid.");
        return;
    }

    const menu = typeof getMenu === "function" ? getMenu() : [];

    if (id) {
        // Mode Edit (TC-30)
        const idx = menu.findIndex(m => m.id === id);
        if (idx !== -1) {
            menu[idx].nama = nama;
            menu[idx].kategori = kategori;
            menu[idx].harga = harga;
            menu[idx].deskripsi = deskripsi;
            if (image) menu[idx].image = image;

            tampilkanToastSuccess(`Menu "${nama}" berhasil diperbarui.`);
        }
    } else {
        // Mode Tambah Baru
        const newId = "M" + String(Date.now()).slice(-4);
        menu.push({
            id: newId,
            nama: nama,
            kategori: kategori,
            harga: harga,
            tersedia: true,
            deskripsi: deskripsi,
            image: image || "coffee_hero.jpg"
        });
        tampilkanToastSuccess(`Menu baru "${nama}" berhasil ditambahkan.`);
    }

    // Simpan ke localStorage
    if (typeof saveMenu === "function") {
        saveMenu(menu);
    } else {
        localStorage.setItem("kcs_menu", JSON.stringify(menu));
    }

    tutupModalMenu();
    renderTabelMenu();
}

/**
 * Hapus menu dengan konfirmasi
 * @param {string} idMenu
 * @param {string} namaMenu
 */
function hapusMenu(idMenu, namaMenu) {
    const setuju = confirm(`Apakah Anda yakin ingin menghapus menu "${namaMenu}"?`);
    if (!setuju) return;

    let menu = typeof getMenu === "function" ? getMenu() : [];
    menu = menu.filter(m => m.id !== idMenu);

    if (typeof saveMenu === "function") {
        saveMenu(menu);
    } else {
        localStorage.setItem("kcs_menu", JSON.stringify(menu));
    }

    tampilkanToastSuccess(`Menu "${namaMenu}" berhasil dihapus.`);
    renderTabelMenu();
}

// ==================== TOAST NOTIFICATION HELPERS ====================
/**
 * Menampilkan Toast Error (TC-23: "Perubahan status tidak valid")
 * Menggunakan id="toast-error-status"
 * @param {string} pesan
 */
function tampilkanToastError(pesan) {
    const toast = document.getElementById("toast-error-status");
    const toastText = document.getElementById("toast-error-text");

    if (!toast) return;

    if (toastText) toastText.textContent = pesan;
    else toast.textContent = `❌ ${pesan}`;

    toast.classList.add("show");

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3200);
}

/**
 * Menampilkan Toast Sukses
 * @param {string} pesan
 */
function tampilkanToastSuccess(pesan) {
    const toast = document.getElementById("toast-success-status");
    const toastText = document.getElementById("toast-success-text");

    if (!toast) return;

    if (toastText) toastText.textContent = pesan;
    else toast.textContent = `✅ ${pesan}`;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ==================== RENDER HELPER BADGES ====================
function renderBadgeStatusBayar(statusBayar) {
    const sb = statusBayar || "Menunggu Pembayaran";
    if (sb === "Lunas") {
        return `<span class="badge badge-lunas">✓ Lunas</span>`;
    } else if (sb === "Menunggu Verifikasi") {
        return `<span class="badge badge-menunggu-verifikasi">⏳ Menunggu Verifikasi</span>`;
    } else if (sb === "Ditolak") {
        return `<span class="badge badge-ditolak">✕ Ditolak</span>`;
    } else {
        return `<span class="badge badge-menunggu-bayar">💳 Menunggu Pembayaran</span>`;
    }
}

function renderBadgeStatusPesanan(status) {
    const st = status || "Menunggu Konfirmasi";
    if (st === "Diproses") {
        return `<span class="badge badge-status-diproses">🔄 Diproses</span>`;
    } else if (st === "Siap Diambil") {
        return `<span class="badge badge-status-siap">🔔 Siap Diambil</span>`;
    } else if (st === "Selesai") {
        return `<span class="badge badge-status-selesai">✅ Selesai</span>`;
    } else {
        return `<span class="badge badge-status-konfirmasi">⏳ Menunggu Konfirmasi</span>`;
    }
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

// ==================== FITUR REKAP PENJUALAN ADMIN ====================
let tabRekapAdminAktif = "harian";

function bukaTabRekapAdmin(tipe) {
    tabRekapAdminAktif = tipe;
    const btnHarian = document.getElementById("btn-tab-harian") || document.getElementById("btn-tab-harian-admin");
    const btnBulanan = document.getElementById("btn-tab-bulanan") || document.getElementById("btn-tab-bulanan-admin");
    const contentHarian = document.getElementById("tab-content-harian") || document.getElementById("tab-content-harian-admin");
    const contentBulanan = document.getElementById("tab-content-bulanan") || document.getElementById("tab-content-bulanan-admin");

    if (tipe === "harian") {
        if (btnHarian) btnHarian.classList.add("active");
        if (btnBulanan) btnBulanan.classList.remove("active");
        if (contentHarian) contentHarian.classList.add("active");
        if (contentBulanan) contentBulanan.classList.remove("active");
    } else {
        if (btnBulanan) btnBulanan.classList.add("active");
        if (btnHarian) btnHarian.classList.remove("active");
        if (contentBulanan) contentBulanan.classList.add("active");
        if (contentHarian) contentHarian.classList.remove("active");
    }

    renderRekapPenjualanAdmin();
}

function renderRekapPenjualanAdmin() {
    const daftar = typeof getPesanan === "function" ? getPesanan() : [];

    const rekap = typeof hitungRekap === "function"
        ? hitungRekap(new Date(), daftar)
        : { tunai: 0, nonTunai: 0, total: 0, totalBulanan: 0 };

    const elTunai = document.getElementById("rekap-tunai-harian") || document.getElementById("rekap-tunai-harian-admin");
    const elNonTunai = document.getElementById("rekap-nontunai-harian") || document.getElementById("rekap-nontunai-harian-admin");
    const elTotal = document.getElementById("rekap-total-harian") || document.getElementById("rekap-total-harian-admin");
    const elBulanan = document.getElementById("rekap-total-bulanan") || document.getElementById("rekap-total-bulanan-admin");

    if (elTunai) elTunai.textContent = typeof formatRupiah === "function" ? formatRupiah(rekap.tunai) : `Rp${rekap.tunai}`;
    if (elNonTunai) elNonTunai.textContent = typeof formatRupiah === "function" ? formatRupiah(rekap.nonTunai) : `Rp${rekap.nonTunai}`;
    if (elTotal) elTotal.textContent = typeof formatRupiah === "function" ? formatRupiah(rekap.total) : `Rp${rekap.total}`;
    if (elBulanan) elBulanan.textContent = typeof formatRupiah === "function" ? formatRupiah(rekap.totalBulanan) : `Rp${rekap.totalBulanan}`;

    const elNamaBulan = document.getElementById("rekap-nama-bulan") || document.getElementById("rekap-nama-bulan-admin");
    if (elNamaBulan) {
        elNamaBulan.textContent = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    }
}

function handleInjectDummyAdmin() {
    if (typeof injectDataDummyKemarin === "function") {
        const p = injectDataDummyKemarin();
        tampilkanToastSuccess(`Data dummy transaksi kemarin (${typeof formatRupiah === "function" ? formatRupiah(p.total) : `Rp${p.total}`}) disuntikkan.`);
        renderSemuaData();
    }
}

