/**
 * status.js — Logika Halaman Pelacakan Status Pesanan Real-Time
 * Kopi Calon Sarjana
 * 
 * Fitur:
 * 1. Menampilkan detail pesanan terakhir dari meja aktif (ID: KCS-XXX, Nama, Meja, Total).
 * 2. Visual Status Timeline (State Machine):
 *    Menunggu Konfirmasi -> Diproses -> Siap Diambil -> Selesai
 *    - Highlight (warna utama cokelat) pada status aktif & status yang telah dilalui.
 *    - Warna pudar (abu-abu/krem) untuk status yang belum dilalui.
 * 3. Empty State: Jika belum ada pesanan aktif, tampilkan "Belum ada pesanan aktif"
 *    dan tombol "Mulai Memesan" mengarah ke menu.html.
 * 4. Tombol "Segarkan" (Refresh) untuk memuat ulang data terkini dari localStorage.
 */

// ==================== STATE GLOBAL ====================
let mejaAktif = null;
let namaPelangganAktif = "";

// Urutan status alur pesanan
const STATUS_STEPS = [
    "Menunggu Konfirmasi",
    "Diproses",
    "Siap Diambil",
    "Selesai"
];

// ==================== INISIALISASI ====================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Inisialisasi data seed jika perlu
    if (typeof initData === "function") {
        await initData();
    }

    // 2. Validasi sesi registrasi meja
    const valid = validasiSesiPelanggan();
    if (!valid) return;

    // 3. Setup navbar mobile
    setupNavbarResponsive();

    // 4. Muat dan render status pesanan terkini
    muatStatusPesanan(false);
});

/**
 * Validasi sesi pelanggan di status.html
 */
function validasiSesiPelanggan() {
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
            pesan: "Halo Kak! Mohon masukkan nomor meja dan nama Anda terlebih dahulu di Beranda sebelum memeriksa status pesanan.",
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

    // Perbarui display header & banner
    const displayNomorMeja = document.getElementById("displayNomorMeja");
    const displayNamaPelanggan = document.getElementById("displayNamaPelanggan");
    const navUserBadge = document.getElementById("navUserBadge");

    if (displayNomorMeja) displayNomorMeja.textContent = mejaAktif;
    if (displayNamaPelanggan) displayNamaPelanggan.textContent = `Pelanggan: ${namaPelangganAktif}`;
    if (navUserBadge) navUserBadge.textContent = `Meja ${mejaAktif} • ${namaPelangganAktif}`;

    perbaruiTautanNavbar(mejaAktif);
    return true;
}

/**
 * Memuat status pesanan terakhir dari localStorage untuk meja ini
 * @param {boolean} isManualRefresh - True jika dipanggil melalui klik tombol Segarkan
 */
function muatStatusPesanan(isManualRefresh = false) {
    const emptyOrderState = document.getElementById("emptyOrderState");
    const activeOrderContent = document.getElementById("activeOrderContent");

    // Ambil daftar pesanan dari localStorage (daftar_pesanan / kcs_pesanan)
    const semuaPesanan = typeof getPesanan === "function" ? getPesanan() : [];
    
    // Filter pesanan milik meja ini
    const pesananMeja = semuaPesanan.filter(p => p.meja === mejaAktif);

    if (pesananMeja.length === 0) {
        // Tampilkan State Kosong
        if (emptyOrderState) emptyOrderState.classList.remove("hidden");
        if (activeOrderContent) activeOrderContent.classList.add("hidden");

        const btnMulaiPesan = document.getElementById("btnMulaiPesan");
        if (btnMulaiPesan) btnMulaiPesan.href = `menu.html?meja=${mejaAktif}`;
        return;
    }

    // Ambil pesanan terakhir
    const pesananTerakhir = pesananMeja[pesananMeja.length - 1];

    if (emptyOrderState) emptyOrderState.classList.add("hidden");
    if (activeOrderContent) activeOrderContent.classList.remove("hidden");

    // Render detail informasi pesanan
    const teksIdPesanan = document.getElementById("teks-id-pesanan");
    const teksStatusTerbaru = document.getElementById("teks-status-terbaru");
    const detailMejaNamaText = document.getElementById("detailMejaNamaText");
    const detailMetodeBayarText = document.getElementById("detailMetodeBayarText");
    const detailTotalBayarText = document.getElementById("detailTotalBayarText");
    const badgeStatusTerkini = document.getElementById("badgeStatusTerkini");
    const keteranganStatusDetail = document.getElementById("keteranganStatusDetail");

    if (teksIdPesanan) teksIdPesanan.textContent = pesananTerakhir.idPesanan;
    if (teksStatusTerbaru) teksStatusTerbaru.textContent = pesananTerakhir.status;
    if (detailMejaNamaText) detailMejaNamaText.textContent = `Meja ${pesananTerakhir.meja} • ${pesananTerakhir.nama}`;
    if (detailMetodeBayarText) {
        detailMetodeBayarText.textContent = pesananTerakhir.metodePembayaran === "Non-Tunai"
            ? `Non-Tunai (${pesananTerakhir.namaFileBukti || 'Bukti Terlampir'})`
            : "Tunai (Bayar di Kasir)";
    }

    const formattedTotal = typeof formatRupiah === "function" 
        ? formatRupiah(pesananTerakhir.total) 
        : `Rp${Number(pesananTerakhir.total).toLocaleString("id-ID")}`;
    if (detailTotalBayarText) detailTotalBayarText.textContent = formattedTotal;

    // Badge styling & keterangan status
    updateBadgeDanKeterangan(pesananTerakhir.status, badgeStatusTerkini, keteranganStatusDetail);

    // Update Visual Timeline Alur Pesanan
    updateTimelineVisual(pesananTerakhir.status, pesananTerakhir.metodePembayaran);

    // Render daftar item menu pesanan
    renderItemPesananList(pesananTerakhir.items);

    if (isManualRefresh) {
        tampilkanToast("✅ Status pesanan berhasil diperbarui!");
    }
}

/**
 * Update kelas badge dan teks penjelasan status
 */
function updateBadgeDanKeterangan(status, badgeEl, keteranganEl) {
    if (!badgeEl) return;

    badgeEl.className = "status-badge-header";
    badgeEl.textContent = status;

    if (status === "Menunggu Konfirmasi") {
        badgeEl.classList.add("status-badge-menunggu");
        if (keteranganEl) keteranganEl.textContent = "Bukti pembayaran Anda telah dikirim dan sedang menunggu verifikasi kasir/admin.";
    } else if (status === "Diproses") {
        badgeEl.classList.add("status-badge-diproses");
        if (keteranganEl) keteranganEl.textContent = "Pesanan telah dikonfirmasi dan sedang diracik oleh barista kami.";
    } else if (status === "Siap Diambil") {
        badgeEl.classList.add("status-badge-siap");
        if (keteranganEl) keteranganEl.textContent = "Minuman & camilan Anda sudah siap! Silakan ambil di konter barista.";
    } else if (status === "Selesai") {
        badgeEl.classList.add("status-badge-selesai");
        if (keteranganEl) keteranganEl.textContent = "Pesanan telah selesai disajikan. Terima kasih telah memesan di Kopi Calon Sarjana!";
    }
}

/**
 * Update highlight timeline visual (Menunggu Konfirmasi -> Diproses -> Siap Diambil -> Selesai)
 * @param {string} statusSaatIni - Status aktif pesanan
 * @param {string} metode - "Tunai" atau "Non-Tunai"
 */
function updateTimelineVisual(statusSaatIni, metode) {
    const stepIds = ["step-menunggu", "step-diproses", "step-siap", "step-selesai"];
    const timelineProgressLine = document.getElementById("timelineProgressLine");

    // Tentukan indeks status saat ini dalam alur
    let activeIndex = STATUS_STEPS.indexOf(statusSaatIni);
    if (activeIndex === -1) {
        // Fallback jika status tidak dikenal
        activeIndex = statusSaatIni.toLowerCase().includes("selesai") ? 3 : 1;
    }

    stepIds.forEach((id, index) => {
        const stepEl = document.getElementById(id);
        if (!stepEl) return;

        stepEl.classList.remove("active", "completed");

        if (index < activeIndex) {
            // Step yang sudah dilewati
            stepEl.classList.add("completed");
            const node = stepEl.querySelector(".step-node");
            if (node) node.textContent = "✓";
        } else if (index === activeIndex) {
            // Step aktif saat ini
            stepEl.classList.add("active");
            const node = stepEl.querySelector(".step-node");
            if (node) node.textContent = index + 1;
        } else {
            // Step belum dilalui
            const node = stepEl.querySelector(".step-node");
            if (node) node.textContent = index + 1;
        }
    });

    // Sesuaikan garis progres
    if (timelineProgressLine) {
        const isMobile = window.innerWidth <= 600;
        const percent = (activeIndex / (STATUS_STEPS.length - 1)) * 100;
        if (isMobile) {
            timelineProgressLine.style.width = "4px";
            timelineProgressLine.style.height = `${percent}%`;
        } else {
            timelineProgressLine.style.height = "4px";
            timelineProgressLine.style.width = `${percent}%`;
        }
    }
}

/**
 * Render item-item pesanan
 */
function renderItemPesananList(items) {
    const container = document.getElementById("statusItemsList");
    if (!container || !Array.isArray(items)) return;

    container.innerHTML = "";

    items.forEach(it => {
        const row = document.createElement("div");
        row.className = "order-item-row";

        const left = document.createElement("div");
        left.className = "order-item-left";

        const name = document.createElement("h4");
        name.className = "order-item-name";
        name.textContent = it.nama;
        left.appendChild(name);

        if (it.kategori !== "Makanan") {
            const meta = document.createElement("p");
            meta.className = "order-item-meta";
            let metaArr = [it.ukuran, it.suhu, `Sugar ${it.sugar}`, `Ice ${it.ice}`];
            if (it.boba) metaArr.push("Boba");
            meta.textContent = metaArr.join(" • ");
            left.appendChild(meta);
        }

        if (it.catatan) {
            const note = document.createElement("p");
            note.className = "order-item-note";
            note.textContent = `📝 Catatan: "${it.catatan}"`;
            left.appendChild(note);
        }

        const right = document.createElement("div");
        right.className = "order-item-right";

        const qty = document.createElement("span");
        qty.className = "order-item-qty";
        qty.textContent = `${it.jumlah} item`;
        right.appendChild(qty);

        const price = document.createElement("div");
        price.className = "order-item-price";
        price.textContent = typeof formatRupiah === "function" ? formatRupiah(it.subtotal) : it.subtotal;
        right.appendChild(price);

        row.appendChild(left);
        row.appendChild(right);
        container.appendChild(row);
    });
}

// ==================== NAVIGASI & HELPER ====================
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
