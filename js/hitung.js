/**
 * hitung.js — Logika Perhitungan & Validasi
 * Kopi Calon Sarjana
 * 
 * Aturan:
 * - Pure functions, TANPA akses DOM.
 * - Digunakan oleh menu.js dan uji-hitung.html.
 */

/**
 * Menghitung harga satuan item
 * Harga satuan = harga menu + Rp5.000 jika Large + Rp3.000 jika topping Boba
 * @param {number} hargaMenu - Harga dasar menu
 * @param {string} ukuran - "Regular" atau "Large"
 * @param {boolean|string} boba - true/"boba" jika menambah boba
 * @returns {number} Harga satuan
 */
function hargaSatuan(hargaMenu, ukuran, boba) {
    let total = Number(hargaMenu) || 0;
    if (ukuran && String(ukuran).toLowerCase() === "large") {
        total += 5000;
    }
    if (boba === true || boba === "boba" || boba === "Boba") {
        total += 3000;
    }
    return total;
}

/**
 * Menghitung subtotal = harga satuan x jumlah
 * @param {number} hargaSatuanItem - Harga per satuan
 * @param {number} jumlahItem - Jumlah item
 * @returns {number} Subtotal
 */
function subtotal(hargaSatuanItem, jumlahItem) {
    return (Number(hargaSatuanItem) || 0) * (Number(jumlahItem) || 0);
}

/**
 * Menghitung total semua subtotal di dalam keranjang
 * @param {Array} items - Daftar item keranjang
 * @returns {number} Total harga keranjang
 */
function totalKeranjang(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
        if (!item) return sum;
        if (typeof item.subtotal === "number") {
            return sum + item.subtotal;
        }
        const unitPrice = typeof item.hargaSatuan === "number"
            ? item.hargaSatuan
            : hargaSatuan(item.hargaDasar || item.harga || 0, item.ukuran, item.boba);
        return sum + subtotal(unitPrice, item.jumlah || 1);
    }, 0);
}

/**
 * Validasi jumlah pesanan (harus integer 1 sampai 20)
 * 1 dan 20 valid, 0 dan 21 tidak valid
 * @param {any} jumlah - Nilai jumlah yang divalidasi
 * @returns {boolean} true jika valid (1-20), false jika tidak valid
 */
function validasiJumlah(jumlah) {
    if (jumlah === null || jumlah === undefined) return false;
    const str = String(jumlah).trim();
    if (str === "") return false;
    const n = Number(str);
    if (!Number.isInteger(n)) return false;
    return n >= 1 && n <= 20;
}

/**
 * Memformat angka ke format Rupiah (contoh: 56000 -> "Rp56.000")
 * @param {number} angka - Nilai nominal
 * @returns {string} Format Rupiah
 */
function formatRupiah(angka) {
    return "Rp" + (Number(angka) || 0).toLocaleString("id-ID");
}

// Kompatibilitas Node.js untuk modular testing jika diperlukan
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        hargaSatuan,
        subtotal,
        totalKeranjang,
        validasiJumlah,
        formatRupiah
    };
}
