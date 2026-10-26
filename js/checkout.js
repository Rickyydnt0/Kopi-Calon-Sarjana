/**
 * checkout.js — Logika Halaman Checkout & Pembayaran
 * Kopi Calon Sarjana
 * 
 * Fitur & Validasi Black Box Testing:
 * 1. Syarat Masuk:
 *    - Registrasi valid wajib ada (nama 3-30 karakter & meja valid 01-20), jika belum redirect ke index.html.
 *    - Keranjang tidak boleh kosong, jika kosong redirect ke menu.html.
 * 2. Pilihan Pembayaran: Tunai (bayar di kasir) & Non-Tunai (Transfer / E-Wallet).
 * 3. Area Upload Bukti (Kondisional):
 *    - Hanya tampil bila Non-Tunai dipilih.
 *    - TC-11: Jika Non-Tunai dan file kosong -> pesan "Bukti pembayaran wajib diunggah".
 *    - TC-21: Batas BVA ukuran file maksimal 5 MB (5 * 1024 * 1024 bytes).
 *             Jika > 5 MB -> pesan "Ukuran file maksimal 5 MB".
 * 4. Submit Pesanan:
 *    - Generate ID berurutan: KCS-001, KCS-002, dst.
 *    - Status awal: "Menunggu Konfirmasi" (Non-Tunai) atau "Diproses" (Tunai).
 *    - Disimpan ke array global daftar_pesanan di localStorage.
 *    - Keranjang meja dikosongkan.
 *    - Redirect ke status.html.
 */

// ==================== STATE GLOBAL ====================
let mejaAktif = null;
let namaPelangganAktif = "";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB = 5.242.880 bytes (BVA)

// ==================== INISIALISASI ====================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Inisialisasi data seed
    if (typeof initData === "function") {
        await initData();
    }

    // 2. Validasi syarat masuk
    const isValid = validasiSyaratMasuk();
    if (!isValid) return;

    // 3. Setup navbar mobile
    setupNavbarResponsive();

    // 4. Render ringkasan pesanan dari keranjang
    renderRingkasanPesanan();
});

/**
 * Validasi syarat masuk checkout.html:
 * - Registrasi nama & meja harus valid di index.html.
 * - Keranjang tidak boleh kosong.
 */
function validasiSyaratMasuk() {
    const params = new URLSearchParams(window.location.search);
    const mejaURL = params.get("meja");

    const pelanggan = typeof getPelanggan === "function" ? getPelanggan() : null;

    const isValidMeja = pelanggan && pelanggan.meja && typeof MEJA_VALID !== "undefined" && MEJA_VALID.includes(pelanggan.meja);
    const namaTrimmed = pelanggan && pelanggan.nama ? pelanggan.nama.trim() : "";
    const isValidNama = namaTrimmed.length >= 3 && namaTrimmed.length <= 30;

    if (!isValidMeja || !isValidNama) {
        sessionStorage.setItem("kcs_flash_notice", JSON.stringify({
            icon: "☕",
            judul: "Akses Meja Diperlukan",
            pesan: "Halo Kak! Mohon masukkan nomor meja dan nama Anda terlebih dahulu di Beranda sebelum checkout.",
            tombolText: "🔑 Masuk & Isi Data Meja",
            scrollId: "registrasi"
        }));
        const redirectUrl = (mejaURL && typeof MEJA_VALID !== "undefined" && MEJA_VALID.includes(mejaURL))
            ? `index.html?meja=${mejaURL}`
            : "index.html";
        window.location.replace(redirectUrl);
        return false;
    }

    mejaAktif = pelanggan.meja;
    namaPelangganAktif = pelanggan.nama;

    // Cek apakah keranjang memiliki item
    const keranjang = typeof getKeranjang === "function" ? getKeranjang(mejaAktif) : [];
    if (keranjang.length === 0) {
        sessionStorage.setItem("kcs_flash_notice", JSON.stringify({
            icon: "🛒",
            judul: "Keranjang Masih Kosong",
            pesan: "Keranjang belanja Anda masih kosong. Silakan pilih produk terlebih dahulu pada katalog menu!",
            tombolText: "☕ Buka Katalog Menu"
        }));
        window.location.replace(`menu.html?meja=${mejaAktif}`);
        return false;
    }

    // Perbarui display header & banner
    const displayNomorMeja = document.getElementById("displayNomorMeja");
    const displayNamaPelanggan = document.getElementById("displayNamaPelanggan");
    const navUserBadge = document.getElementById("navUserBadge");
    const checkoutNomorMejaText = document.getElementById("checkoutNomorMejaText");

    if (displayNomorMeja) displayNomorMeja.textContent = mejaAktif;
    if (displayNamaPelanggan) displayNamaPelanggan.textContent = `Pelanggan: ${namaPelangganAktif}`;
    if (navUserBadge) navUserBadge.textContent = `Meja ${mejaAktif} • ${namaPelangganAktif}`;
    if (checkoutNomorMejaText) checkoutNomorMejaText.textContent = mejaAktif;

    perbaruiTautanNavbar(mejaAktif);
    return true;
}

/**
 * Render daftar item keranjang & kalkulasi total
 */
function renderRingkasanPesanan() {
    const keranjang = typeof getKeranjang === "function" ? getKeranjang(mejaAktif) : [];
    const container = document.getElementById("checkoutItemsList");
    const subtotalEl = document.getElementById("checkoutSubtotalText");
    const totalEl = document.getElementById("checkoutTotalText");
    const rekeningNominalEl = document.getElementById("rekeningNominalText");

    if (!container) return;

    container.innerHTML = "";

    const grandTotal = typeof totalKeranjang === "function"
        ? totalKeranjang(keranjang)
        : keranjang.reduce((sum, it) => sum + (it.subtotal || 0), 0);

    const formattedTotal = typeof formatRupiah === "function" ? formatRupiah(grandTotal) : `Rp${grandTotal.toLocaleString("id-ID")}`;

    if (subtotalEl) subtotalEl.textContent = formattedTotal;
    if (totalEl) totalEl.textContent = formattedTotal;
    if (rekeningNominalEl) rekeningNominalEl.textContent = formattedTotal;

    keranjang.forEach(item => {
        const row = document.createElement("div");
        row.className = "order-item-row";

        const left = document.createElement("div");
        left.className = "order-item-left";

        const name = document.createElement("h4");
        name.className = "order-item-name";
        name.textContent = item.nama;
        left.appendChild(name);

        if (item.kategori !== "Makanan") {
            const meta = document.createElement("p");
            meta.className = "order-item-meta";
            let metaArr = [item.ukuran, item.suhu, `Sugar ${item.sugar}`, `Ice ${item.ice}`];
            if (item.boba) metaArr.push("Boba");
            meta.textContent = metaArr.join(" • ");
            left.appendChild(meta);
        }

        // Tampilkan catatan aman sebagai textContent
        if (item.catatan) {
            const note = document.createElement("p");
            note.className = "order-item-note";
            note.textContent = `📝 Catatan: "${item.catatan}"`;
            left.appendChild(note);
        }

        const right = document.createElement("div");
        right.className = "order-item-right";

        const qty = document.createElement("span");
        qty.className = "order-item-qty";
        qty.textContent = `${item.jumlah} × ${typeof formatRupiah === "function" ? formatRupiah(item.hargaSatuan) : item.hargaSatuan}`;
        right.appendChild(qty);

        const price = document.createElement("div");
        price.className = "order-item-price";
        price.textContent = typeof formatRupiah === "function" ? formatRupiah(item.subtotal) : item.subtotal;
        right.appendChild(price);

        row.appendChild(left);
        row.appendChild(right);
        container.appendChild(row);
    });
}

/**
 * Mengubah pilihan metode pembayaran (Tunai vs Non-Tunai)
 * Mengontrol tampilan area upload bukti
 * @param {string} metode - "Tunai" atau "Non-Tunai"
 */
function ubahMetodePembayaran(metode) {
    const areaUpload = document.getElementById("area-upload");
    const labelTunai = document.getElementById("labelTunai");
    const labelNonTunai = document.getElementById("labelNonTunai");
    const pesanError = document.getElementById("pesan-error-bukti");
    const inputBukti = document.getElementById("input-bukti");

    if (pesanError) pesanError.textContent = "";

    if (metode === "Tunai") {
        if (labelTunai) labelTunai.classList.add("selected");
        if (labelNonTunai) labelNonTunai.classList.remove("selected");
        if (areaUpload) areaUpload.classList.add("hidden");
        if (inputBukti) inputBukti.value = "";
        const fileInfo = document.getElementById("fileInfoDetail");
        if (fileInfo) fileInfo.textContent = "Format didukung: .jpg, .jpeg, .png (Maksimal 5 MB)";
    } else {
        if (labelNonTunai) labelNonTunai.classList.add("selected");
        if (labelTunai) labelTunai.classList.remove("selected");
        if (areaUpload) areaUpload.classList.remove("hidden");
    }
}

/**
 * Handler saat file bukti dipilih pengguna
 * Validasi BVA langsung ketika file dipilih
 * @param {HTMLInputElement} input 
 */
function onFileBuktiDipilih(input) {
    const pesanError = document.getElementById("pesan-error-bukti");
    const fileInfo = document.getElementById("fileInfoDetail");

    if (pesanError) pesanError.textContent = "";

    if (!input.files || input.files.length === 0) {
        if (fileInfo) fileInfo.textContent = "Format didukung: .jpg, .jpeg, .png (Maksimal 5 MB)";
        return;
    }

    const file = input.files[0];
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

    // Cek batas BVA 5 MB
    if (file.size > MAX_FILE_SIZE) {
        if (pesanError) pesanError.textContent = "Ukuran file maksimal 5 MB";
        if (fileInfo) fileInfo.innerHTML = `<span style="color: var(--color-error);">⚠️ ${file.name} (${sizeInMB} MB) — Melebihi batas maksimal</span>`;
    } else {
        if (fileInfo) fileInfo.innerHTML = `<span style="color: var(--color-success);">✅ ${file.name} (${sizeInMB} MB) — Siap diunggah</span>`;
    }
}

/**
 * Proses pembuatan pesanan baru (Submit)
 * Memeriksa validasi pembayaran & ukuran file (TC-10, TC-11, TC-21)
 */
function prosesBuatPesanan() {
    const keranjang = typeof getKeranjang === "function" ? getKeranjang(mejaAktif) : [];
    if (keranjang.length === 0) {
        alert("Keranjang pesanan masih kosong.");
        window.location.href = `menu.html?meja=${mejaAktif}`;
        return;
    }

    // Baca radio button yang terpilih
    const radioNonTunai = document.getElementById("radio-nontunai");
    const isNonTunai = radioNonTunai ? radioNonTunai.checked : false;
    const metode = isNonTunai ? "Non-Tunai" : "Tunai";

    const inputBukti = document.getElementById("input-bukti");
    const pesanError = document.getElementById("pesan-error-bukti");

    if (pesanError) pesanError.textContent = "";

    let namaFileBukti = null;

    // VALIDASI KETAT BLACK BOX TESTING UNTUK NON-TUNAI
    if (isNonTunai) {
        // TC-11: Non-tunai tanpa bukti
        if (!inputBukti || !inputBukti.files || inputBukti.files.length === 0) {
            if (pesanError) pesanError.textContent = "Bukti pembayaran wajib diunggah";
            if (inputBukti) inputBukti.focus();
            return;
        }

        const file = inputBukti.files[0];

        // TC-21: Batas BVA Ukuran Bukti Pembayaran (> 5 MB ditolak, <= 5 MB diterima)
        if (file.size > MAX_FILE_SIZE) {
            if (pesanError) pesanError.textContent = "Ukuran file maksimal 5 MB";
            if (inputBukti) inputBukti.focus();
            return;
        }

        namaFileBukti = file.name;
    }

    // HITUNG TOTAL
    const total = typeof totalKeranjang === "function"
        ? totalKeranjang(keranjang)
        : keranjang.reduce((sum, it) => sum + (it.subtotal || 0), 0);

    // GENERATE ID UNIK (KCS-001, KCS-002, dst)
    const idPesanan = typeof generateNomorPesanan === "function"
        ? generateNomorPesanan()
        : "KCS-" + String(Date.now()).slice(-4);

    // STATUS AWAL SESUAI SPESIFIKASI:
    // "Menunggu Konfirmasi" untuk Non-Tunai; "Diproses" untuk Tunai
    const statusAwal = isNonTunai ? "Menunggu Konfirmasi" : "Diproses";

    // BUAT OBJEK PESANAN LENGKAP
    const pesananBaru = {
        idPesanan: idPesanan,
        nama: namaPelangganAktif,
        meja: mejaAktif,
        items: keranjang,
        total: total,
        metodePembayaran: metode,
        metodeBayar: isNonTunai ? "nontunai" : "tunai",
        statusBayar: isNonTunai ? "Menunggu Verifikasi" : "Menunggu Pembayaran",
        namaFileBukti: namaFileBukti,
        status: statusAwal,
        timestamp: new Date().toISOString()
    };

    // SIMPAN KE ARRAY GLOBAL daftar_pesanan DI LOCALSTORAGE
    const daftarPesanan = typeof getPesanan === "function" ? getPesanan() : [];
    daftarPesanan.push(pesananBaru);
    if (typeof savePesanan === "function") {
        savePesanan(daftarPesanan);
    }

    // KOSONGKAN KERANJANG MEJA TERSEBUT
    if (typeof saveKeranjang === "function") {
        saveKeranjang([], mejaAktif);
    }

    // NOTIFIKASI TOAST SUKSES & REDIRECT KE STATUS.HTML
    tampilkanToast(`✅ Pesanan ${idPesanan} berhasil dibuat! Mengalihkan...`);

    const btnSubmit = document.getElementById("btn-buat-pesanan");
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span>⏳</span> <span>Memproses Pesanan...</span>`;
    }

    setTimeout(() => {
        window.location.href = `status.html?meja=${mejaAktif}`;
    }, 800);
}

// ==================== NAVIGASI & MODAL HELPER ====================
function bukaGantiMeja() {
    window.location.href = "index.html";
}

function perbaruiTautanNavbar(meja) {
    const linkBeranda = document.getElementById("linkBeranda");
    const linkMenu = document.getElementById("linkMenu");
    const linkKeranjang = document.getElementById("linkKeranjang");
    const linkStatus = document.getElementById("linkStatus");

    if (linkBeranda) linkBeranda.href = `index.html?meja=${meja}`;
    if (linkMenu) linkMenu.href = `menu.html?meja=${meja}`;
    if (linkKeranjang) linkKeranjang.href = `checkout.html?meja=${meja}`;
    if (linkStatus) linkStatus.href = `status.html?meja=${meja}`;
}

function setupNavbarResponsive() {
    const hamburger = document.getElementById("navHamburger");
    const navLinks = document.getElementById("navLinks");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            navLinks.classList.toggle("show");
        });
    }
}

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

function konfirmasiReset() {
    const yakin = confirm("Reset semua data uji ke kondisi awal?\nSemua keranjang dan pesanan akan dikembalikan ke kondisi awal.");
    if (yakin && typeof resetData === "function") {
        resetData().then(() => {
            alert("Data uji berhasil direset ke kondisi awal.");
            window.location.href = "index.html";
        });
    }
}
