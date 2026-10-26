/**
 * nav-guard.js — Pengawal Akses Navigasi & Modal Notifikasi Interaktif Pelanggan
 * Kopi Calon Sarjana
 * 
 * Aturan Akses:
 * 1. Pelanggan Belum Registrasi (belum input nama / nomor meja di index.html):
 *    - Klik Menu / Keranjang / Status Pesanan dicegah dan menampilkan pop-up modal ramah:
 *      "Mohon masukkan nama dan nomor meja terlebih dahulu di Beranda!"
 * 2. Pelanggan Sudah Masuk, Tapi Keranjang Kosong:
 *    - Klik Keranjang dicegah dan menampilkan pop-up modal informatif:
 *      "Keranjang masih kosong! Silakan pilih produk terlebih dahulu pada katalog menu."
 * 3. Pelanggan Sudah Masuk, Tapi Belum Ada Pesanan Aktif:
 *    - Klik Status Pesanan dicegah dan menampilkan pop-up modal:
 *      "Belum ada pesanan aktif untuk Meja Anda. Silakan lakukan pemesanan terlebih dahulu."
 * 4. Mendukung Flash Notice (jika pelanggan diarahkan langsung dari URL tanpa syarat).
 */

(function () {
    // Injeksi style modal mandiri agar 100% tampil di atas halaman manapun
    injectGuardStyles();

    function boot() {
        injectGuardStyles();
        initNavGuardModal();
        periksaFlashNotice();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }

    /**
     * Injeksi CSS modal agar terjamin tampil di tengah layar dengan backdrop blur
     */
    function injectGuardStyles() {
        if (document.getElementById("kcsGuardInjectedStyles")) return;
        const style = document.createElement("style");
        style.id = "kcsGuardInjectedStyles";
        style.textContent = `
            .kcs-guard-modal-overlay {
                position: fixed !important;
                inset: 0 !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(34, 20, 13, 0.72) !important;
                backdrop-filter: blur(8px) !important;
                -webkit-backdrop-filter: blur(8px) !important;
                z-index: 999999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 1.5rem !important;
                opacity: 1 !important;
                visibility: visible !important;
                transition: opacity 0.25s ease, visibility 0.25s ease !important;
            }
            .kcs-guard-modal-overlay.hidden {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }
            .kcs-guard-modal-card {
                background: #FFFFFF !important;
                border: 1.5px solid #E6D5C3 !important;
                border-radius: 20px !important;
                max-width: 440px !important;
                width: 100% !important;
                padding: 2.2rem 2rem !important;
                text-align: center !important;
                box-shadow: 0 20px 48px rgba(34, 20, 13, 0.35) !important;
                transform: scale(1) translateY(0) !important;
                transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
                animation: popInModalGuard 0.35s cubic-bezier(0.16, 1, 0.3, 1) both !important;
                font-family: 'Inter', -apple-system, sans-serif !important;
            }
            @keyframes popInModalGuard {
                from { opacity: 0; transform: scale(0.88) translateY(20px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .kcs-guard-icon-badge {
                width: 72px !important;
                height: 72px !important;
                margin: 0 auto 1.25rem !important;
                background: #FDEEDB !important;
                border: 2px solid rgba(198, 156, 109, 0.45) !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 2.2rem !important;
                box-shadow: 0 6px 16px rgba(111, 78, 55, 0.15) !important;
            }
            .kcs-guard-title {
                font-family: 'Playfair Display', Georgia, serif !important;
                font-size: 1.5rem !important;
                color: #6F4E37 !important;
                margin-bottom: 0.75rem !important;
                line-height: 1.3 !important;
                font-weight: 700 !important;
            }
            .kcs-guard-message {
                font-size: 0.95rem !important;
                color: #745743 !important;
                line-height: 1.6 !important;
                margin-bottom: 1.75rem !important;
                font-weight: 400 !important;
            }
            .kcs-guard-actions {
                display: flex !important;
                flex-direction: column !important;
                gap: 0.75rem !important;
            }
            .kcs-guard-actions .btn-primary {
                width: 100% !important;
                padding: 0.85rem 1.4rem !important;
                font-size: 0.96rem !important;
                cursor: pointer !important;
                background: linear-gradient(135deg, #C69C6D 0%, #B86725 100%) !important;
                color: #FFFFFF !important;
                border: none !important;
                border-radius: 9999px !important;
                font-weight: 600 !important;
                box-shadow: 0 4px 14px rgba(200, 122, 56, 0.35) !important;
            }
            .kcs-guard-actions .btn-secondary {
                width: 100% !important;
                padding: 0.75rem 1.4rem !important;
                font-size: 0.9rem !important;
                background: transparent !important;
                border: 1.5px solid #E6D5C3 !important;
                color: #745743 !important;
                cursor: pointer !important;
                border-radius: 9999px !important;
                transition: all 0.25s ease !important;
                font-weight: 600 !important;
            }
            .kcs-guard-actions .btn-secondary:hover {
                background: #EDE2D3 !important;
                color: #6F4E37 !important;
                border-color: #C69C6D !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Buat dan pasang elemen DOM Pop-up Modal jika belum ada
     */
    function initNavGuardModal() {
        if (document.getElementById("kcsGuardModalOverlay")) return;

        const modalHtml = `
            <div id="kcsGuardModalOverlay" class="kcs-guard-modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="guardModalTitle">
                <div class="kcs-guard-modal-card">
                    <div class="kcs-guard-icon-badge" id="guardModalIcon">☕</div>
                    <h3 class="kcs-guard-title" id="guardModalTitle">Perhatian</h3>
                    <p class="kcs-guard-message" id="guardModalMessage">Pesan...</p>
                    <div class="kcs-guard-actions">
                        <button type="button" class="btn-primary" id="guardModalBtnPrimary">Aksi Utama</button>
                        <button type="button" class="btn-secondary" id="guardModalBtnClose">Tutup</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML("beforeend", modalHtml);

        const overlay = document.getElementById("kcsGuardModalOverlay");
        const btnClose = document.getElementById("guardModalBtnClose");

        if (btnClose) {
            btnClose.addEventListener("click", tutupModalPeringatan);
        }

        if (overlay) {
            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) {
                    tutupModalPeringatan();
                }
            });
        }
    }

    /**
     * Tampilkan pop-up modal peringatan interaktif
     * @param {Object} opsi - { icon, judul, pesan, tombolText, onAksi, tombolUrl, tombolTutupText }
     */
    window.tampilkanModalPeringatan = function (opsi) {
        injectGuardStyles();
        initNavGuardModal();

        const overlay = document.getElementById("kcsGuardModalOverlay");
        const iconEl = document.getElementById("guardModalIcon");
        const titleEl = document.getElementById("guardModalTitle");
        const msgEl = document.getElementById("guardModalMessage");
        const btnPrimary = document.getElementById("guardModalBtnPrimary");
        const btnClose = document.getElementById("guardModalBtnClose");

        if (!overlay || !btnPrimary) return;

        if (iconEl) iconEl.textContent = opsi.icon || "☕";
        if (titleEl) titleEl.textContent = opsi.judul || "Pemberitahuan";
        if (msgEl) msgEl.innerHTML = opsi.pesan || "";

        btnPrimary.textContent = opsi.tombolText || "Lanjutkan";
        if (btnClose) {
            btnClose.textContent = opsi.tombolTutupText || "Tutup";
        }

        // Hapus listener lama dengan cloneNode
        const newBtnPrimary = btnPrimary.cloneNode(true);
        btnPrimary.parentNode.replaceChild(newBtnPrimary, btnPrimary);

        newBtnPrimary.addEventListener("click", () => {
            tutupModalPeringatan();
            if (typeof opsi.onAksi === "function") {
                opsi.onAksi();
            } else if (opsi.tombolUrl) {
                window.location.href = opsi.tombolUrl;
            }
        });

        overlay.classList.remove("hidden");
    };

    /**
     * Tutup modal peringatan
     */
    window.tutupModalPeringatan = function () {
        const overlay = document.getElementById("kcsGuardModalOverlay");
        if (overlay) {
            overlay.classList.add("hidden");
        }
    };

    /**
     * Gunakan capture phase pada document click agar intersep link berjalan 100% andal
     */
    document.addEventListener("click", (e) => {
        const target = e.target;
        if (!target) return;

        const linkMenu = target.closest("#linkMenu");
        const linkKeranjang = target.closest("#linkKeranjang, #btnKeranjang, #btn-keranjang, .btn-keranjang, [data-link='keranjang']");
        const linkStatus = target.closest("#linkStatus");
        const btnMulaiPesan = target.closest("#btnMulaiPesan");

        // 1. Klik Menu
        if (linkMenu) {
            const pelanggan = ambilDataPelanggan();
            if (!pelangganValid(pelanggan)) {
                e.preventDefault();
                e.stopPropagation();
                tampilkanPeringatanBelumRegistrasi("menu");
                return;
            }
        }

        // 2. Klik Keranjang
        if (linkKeranjang) {
            const pelanggan = ambilDataPelanggan();
            // Belum login meja
            if (!pelangganValid(pelanggan)) {
                e.preventDefault();
                e.stopPropagation();
                tampilkanPeringatanBelumRegistrasi("keranjang");
                return;
            }

            // Keranjang masih kosong
            const keranjang = ambilKeranjangMeja(pelanggan.meja);
            if (!keranjang || keranjang.length === 0) {
                e.preventDefault();
                e.stopPropagation();
                tampilkanPeringatanKeranjangKosong(pelanggan.meja);
                return;
            }
        }

        // 3. Klik Status Pesanan
        if (linkStatus) {
            const pelanggan = ambilDataPelanggan();
            // Belum login meja
            if (!pelangganValid(pelanggan)) {
                e.preventDefault();
                e.stopPropagation();
                tampilkanPeringatanBelumRegistrasi("status");
                return;
            }

            // Belum pernah memesan / tidak ada pesanan aktif
            const pesanan = ambilPesananMeja(pelanggan.meja);
            if (!pesanan || pesanan.length === 0) {
                e.preventDefault();
                e.stopPropagation();
                tampilkanPeringatanBelumMemesan(pelanggan.meja);
                return;
            }
        }

        // 4. Tombol Hero CTA di Beranda
        if (btnMulaiPesan && (window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/"))) {
            const pelanggan = ambilDataPelanggan();
            if (pelangganValid(pelanggan)) {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `menu.html?meja=${pelanggan.meja}`;
                return;
            }
        }
    }, true);

    /**
     * Tampilkan peringatan jika pelanggan belum memasukkan nama & meja
     */
    function tampilkanPeringatanBelumRegistrasi(tujuan) {
        const isDiBeranda = window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/");

        window.tampilkanModalPeringatan({
            icon: "☕",
            judul: "Akses Meja Diperlukan",
            pesan: `Halo Calon Sarjana! 👋<br>Untuk mengakses <strong>${tujuan === 'keranjang' ? 'Keranjang' : tujuan === 'status' ? 'Status Pesanan' : 'Katalog Menu'}</strong>, mohon masukkan nomor meja dan nama Anda terlebih dahulu di Beranda agar pesanan dapat disajikan tepat ke meja Anda.`,
            tombolText: "🔑 Masuk & Isi Data Meja",
            onAksi: () => {
                if (isDiBeranda) {
                    const regEl = document.getElementById("registrasi");
                    const inputMeja = document.getElementById("inputMeja");
                    const inputNama = document.getElementById("inputNama");
                    if (regEl) {
                        regEl.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                    setTimeout(() => {
                        if (inputMeja && !inputMeja.value) inputMeja.focus();
                        else if (inputNama) inputNama.focus();
                    }, 400);
                } else {
                    window.location.href = "index.html#registrasi";
                }
            },
            tombolTutupText: "Nanti Saja"
        });
    }

    /**
     * Tampilkan peringatan jika keranjang belanja masih kosong
     */
    function tampilkanPeringatanKeranjangKosong(meja) {
        window.tampilkanModalPeringatan({
            icon: "🛒",
            judul: "Keranjang Masih Kosong",
            pesan: "Anda belum memilih menu kopi atau camilan apapun.<br>Mohon <strong>memesan terlebih dahulu pada katalog menu</strong> untuk melanjutkan ke pembayaran!",
            tombolText: "☕ Buka Katalog Menu",
            tombolUrl: `menu.html?meja=${meja}`,
            tombolTutupText: "Tutup"
        });
    }

    /**
     * Tampilkan peringatan jika belum ada pesanan aktif
     */
    function tampilkanPeringatanBelumMemesan(meja) {
        window.tampilkanModalPeringatan({
            icon: "📋",
            judul: "Belum Ada Pesanan Aktif",
            pesan: `Belum ada pesanan aktif yang tercatat untuk <strong>Meja ${meja}</strong>.<br>Silakan pilih menu favorit Anda pada katalog dan selesaikan pemesanan terlebih dahulu!`,
            tombolText: "☕ Pesan Menu Sekarang",
            tombolUrl: `menu.html?meja=${meja}`,
            tombolTutupText: "Tutup"
        });
    }

    /**
     * Periksa flash notice dari sessionStorage (misal setelah redirect otomatis)
     */
    function periksaFlashNotice() {
        try {
            const flash = sessionStorage.getItem("kcs_flash_notice");
            if (flash) {
                sessionStorage.removeItem("kcs_flash_notice");
                const data = JSON.parse(flash);
                setTimeout(() => {
                    window.tampilkanModalPeringatan({
                        icon: data.icon || "ℹ️",
                        judul: data.judul || "Perhatian",
                        pesan: data.pesan || "",
                        tombolText: data.tombolText || "Mengerti",
                        tombolUrl: data.tombolUrl,
                        onAksi: () => {
                            if (data.scrollId) {
                                const el = document.getElementById(data.scrollId);
                                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                        }
                    });
                }, 350);
            }
        } catch (e) {
            console.error("Gagal membaca flash notice:", e);
        }
    }

    // ==================== HELPER PENYIMPANAN ====================
    function ambilDataPelanggan() {
        try {
            const raw = localStorage.getItem("kcs_pelanggan");
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function pelangganValid(p) {
        if (!p || !p.meja || !p.nama) return false;
        const namaTrim = p.nama.trim();
        const validMeja = typeof MEJA_VALID !== "undefined"
            ? MEJA_VALID.includes(p.meja)
            : true;
        return validMeja && namaTrim.length >= 3 && namaTrim.length <= 30;
    }

    function ambilKeranjangMeja(meja) {
        try {
            const key = `keranjang_meja${meja}`;
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function ambilPesananMeja(meja) {
        try {
            const raw = localStorage.getItem("daftar_pesanan") || localStorage.getItem("kcs_pesanan");
            if (!raw) return [];
            const list = JSON.parse(raw);
            if (!Array.isArray(list)) return [];
            return list.filter(item => String(item.meja) === String(meja));
        } catch (e) {
            return [];
        }
    }
})();
