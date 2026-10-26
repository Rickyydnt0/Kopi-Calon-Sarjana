/**
 * pesanan.js — State machine & logika status pesanan Kopi Calon Sarjana
 * Mendukung Tahap 3 (Checkout/Status) dan Tahap 4 (Admin/Antrean/Verifikasi)
 */

// Urutan alur status pesanan standar
const URUTAN_STATUS = [
    "Menunggu Konfirmasi",
    "Diproses",
    "Siap Diambil",
    "Selesai"
];

/**
 * Validasi transisi status pesanan (hanya boleh maju 1 langkah berurutan)
 * @param {string} statusLama
 * @param {string} statusBaru
 * @returns {boolean}
 */
function isTransisiValid(statusLama, statusBaru) {
    if (!statusLama || !statusBaru) return false;
    if (statusLama === statusBaru) return false;

    const idxLama = URUTAN_STATUS.indexOf(statusLama);
    const idxBaru = URUTAN_STATUS.indexOf(statusBaru);

    if (idxLama === -1 || idxBaru === -1) return false;

    // Hanya boleh maju tepat 1 langkah
    return idxBaru === idxLama + 1;
}

/**
 * Mengubah status pesanan dan menyimpannya ke localStorage
 * @param {string} idPesanan - ID pesanan (misal KCS-001)
 * @param {string} statusBaru - Status tujuan
 * @param {string} [oleh="admin"] - Siapa yang mengubah status
 * @returns {{success: boolean, message: string, pesanan?: object}}
 */
function ubahStatus(idPesanan, statusBaru, oleh = "admin") {
    const daftar = typeof getPesanan === "function" ? getPesanan() : [];
    const idx = daftar.findIndex(p => p.idPesanan === idPesanan || p.id === idPesanan);

    if (idx === -1) {
        return { success: false, message: "Pesanan tidak ditemukan" };
    }

    const pesanan = daftar[idx];
    const statusLama = pesanan.status || "Menunggu Konfirmasi";

    if (!isTransisiValid(statusLama, statusBaru)) {
        return { success: false, message: "Perubahan status tidak valid" };
    }

    pesanan.status = statusBaru;
    pesanan.diperbaruiOleh = oleh;
    pesanan.diperbaruiPada = new Date().toISOString();

    if (!pesanan.riwayatStatus) {
        pesanan.riwayatStatus = [];
    }
    pesanan.riwayatStatus.push({
        status: statusBaru,
        waktu: pesanan.diperbaruiPada,
        oleh: oleh
    });

    daftar[idx] = pesanan;

    if (typeof savePesanan === "function") {
        savePesanan(daftar);
    } else {
        localStorage.setItem("daftar_pesanan", JSON.stringify(daftar));
        localStorage.setItem("kcs_pesanan", JSON.stringify(daftar));
    }

    return { success: true, message: `Status berhasil diubah menjadi ${statusBaru}`, pesanan };
}

/**
 * Verifikasi bukti pembayaran non-tunai (Terima atau Tolak)
 * @param {string} idPesanan
 * @param {"terima"|"tolak"} aksi
 * @param {string} [oleh="admin"]
 * @returns {{success: boolean, message: string, pesanan?: object}}
 */
function verifikasiPembayaran(idPesanan, aksi, oleh = "admin") {
    const daftar = typeof getPesanan === "function" ? getPesanan() : [];
    const idx = daftar.findIndex(p => p.idPesanan === idPesanan || p.id === idPesanan);

    if (idx === -1) {
        return { success: false, message: "Pesanan tidak ditemukan" };
    }

    const pesanan = daftar[idx];

    if (aksi === "terima") {
        pesanan.statusBayar = "Lunas";
        // Jika status masih Menunggu Konfirmasi, majukan ke Diproses
        if (pesanan.status === "Menunggu Konfirmasi") {
            pesanan.status = "Diproses";
        }
        pesanan.diverifikasiOleh = oleh;
        pesanan.diverifikasiPada = new Date().toISOString();
    } else if (aksi === "tolak") {
        pesanan.statusBayar = "Ditolak";
        pesanan.diverifikasiOleh = oleh;
        pesanan.diverifikasiPada = new Date().toISOString();
    } else {
        return { success: false, message: "Aksi verifikasi tidak dikenali" };
    }

    daftar[idx] = pesanan;

    if (typeof savePesanan === "function") {
        savePesanan(daftar);
    } else {
        localStorage.setItem("daftar_pesanan", JSON.stringify(daftar));
        localStorage.setItem("kcs_pesanan", JSON.stringify(daftar));
    }

    return {
        success: true,
        message: aksi === "terima" ? "Pembayaran diverifikasi (Lunas)" : "Pembayaran ditolak",
        pesanan
    };
}

/**
 * Normalisasi objek pesanan lama agar memiliki atribut lengkap
 * @param {object} p
 * @returns {object}
 */
function normalisasiPesanan(p) {
    if (!p) return null;
    const item = { ...p };

    // Metode bayar normalisasi
    if (!item.metodeBayar) {
        if (item.metodePembayaran) {
            item.metodeBayar = item.metodePembayaran.toLowerCase().includes("non") ? "nontunai" : "tunai";
        } else {
            item.metodeBayar = "tunai";
        }
    }

    // Status bayar normalisasi
    if (!item.statusBayar) {
        if (item.metodeBayar === "nontunai") {
            item.statusBayar = item.status === "Menunggu Konfirmasi" ? "Menunggu Verifikasi" : "Lunas";
        } else {
            item.statusBayar = item.status === "Selesai" ? "Lunas" : "Menunggu Pembayaran";
        }
    }

    return item;
}

/**
 * Ambil semua pesanan ternormalisasi, diurutkan dari terbaru
 * @returns {Array}
 */
function getSemuaPesananTernormalisasi() {
    const mentah = typeof getPesanan === "function" ? getPesanan() : [];
    const normal = mentah.map(normalisasiPesanan);
    // Urutkan terbaru berdasarkan timestamp / nomor id
    return normal.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
    });
}

/**
 * Ambil ringkasan statistik pesanan hari ini untuk Dasbor
 * 1. Pesanan Hari Ini (total order)
 * 2. Menunggu Konfirmasi (jumlah pesanan dengan status 'Menunggu Konfirmasi')
 * 3. Total Penjualan Hari Ini (hanya menjumlahkan pesanan dengan statusBayar 'Lunas')
 * @returns {{pesananHariIni: number, menungguKonfirmasi: number, totalPenjualan: number}}
 */
function getStatistikHariIni() {
    const semua = getSemuaPesananTernormalisasi();
    const sekarang = new Date();
    const tglSekarang = sekarang.toDateString();

    // Filter pesanan hari ini berdasarkan tanggal timestamp
    const hariIni = semua.filter(p => {
        if (!p.timestamp) return true; // jika tidak ada timestamp, anggap hari ini
        const tglPesanan = new Date(p.timestamp).toDateString();
        return tglPesanan === tglSekarang;
    });

    const totalHariIni = hariIni.length;
    const menungguKonfirmasi = hariIni.filter(p => p.status === "Menunggu Konfirmasi").length;
    const totalPenjualan = hariIni
        .filter(p => p.statusBayar === "Lunas")
        .reduce((sum, p) => sum + (Number(p.total) || 0), 0);

    return {
        pesananHariIni: totalHariIni,
        menungguKonfirmasi: menungguKonfirmasi,
        totalPenjualan: totalPenjualan
    };
}

/**
 * Format string ISO waktu ke format jam:menit
 * @param {string} isoString
 * @returns {string}
 */
function formatWaktu(isoString) {
    if (!isoString) return "-";
    try {
        const d = new Date(isoString);
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
        return "-";
    }
}

