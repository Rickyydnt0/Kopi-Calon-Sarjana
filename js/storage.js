/**
 * storage.js — Wrapper helper untuk localStorage Kopi Calon Sarjana
 * Mengarahkan dan menyelaraskan fungsi penyimpanan data
 */

// Menghubungkan fungsi jika data.js sudah dimuat atau berjalan independen
if (typeof getPelanggan === "undefined") {
    function getPelanggan() {
        const d = localStorage.getItem("kcs_pelanggan");
        return d ? JSON.parse(d) : null;
    }
}

if (typeof savePelanggan === "undefined") {
    function savePelanggan(p) {
        localStorage.setItem("kcs_pelanggan", JSON.stringify(p));
    }
}

if (typeof getKeranjang === "undefined") {
    function getKeranjang(meja) {
        const m = meja || (getPelanggan() ? getPelanggan().meja : "01");
        const key = `keranjang_meja${m}`;
        return JSON.parse(localStorage.getItem(key)) || [];
    }
}

if (typeof saveKeranjang === "undefined") {
    function saveKeranjang(k, meja) {
        const m = meja || (getPelanggan() ? getPelanggan().meja : "01");
        const key = `keranjang_meja${m}`;
        localStorage.setItem(key, JSON.stringify(k));
    }
}

if (typeof getPesanan === "undefined") {
    function getPesanan() {
        const d = localStorage.getItem("daftar_pesanan") || localStorage.getItem("kcs_pesanan");
        return d ? JSON.parse(d) : [];
    }
}

if (typeof savePesanan === "undefined") {
    function savePesanan(p) {
        localStorage.setItem("daftar_pesanan", JSON.stringify(p));
        localStorage.setItem("kcs_pesanan", JSON.stringify(p));
    }
}
