/**
 * rekap.js — Modul Perhitungan Rekap Penjualan (Harian & Bulanan)
 * Kopi Calon Sarjana (Tahap 5)
 * 
 * Aturan:
 * - Menghitung data penjualan hanya dari pesanan yang berstatusBayar === "Lunas"
 * - Digunakan bersama oleh kasir.html dan admin.html
 */

/**
 * Menghitung rekap penjualan harian dan bulanan berdasarkan tanggal dan array pesanan
 * @param {Date|string} tanggal - Tanggal acuan (default hari ini)
 * @param {Array} arrayPesanan - Daftar objek pesanan
 * @returns {{
 *   tunai: number,
 *   nonTunai: number,
 *   total: number,
 *   totalBulanan: number,
 *   jumlahPesananHarian: number,
 *   jumlahPesananBulanan: number,
 *   harian: { tunai: number, nonTunai: number, total: number },
 *   bulanan: { tunai: number, nonTunai: number, total: number }
 * }}
 */
function hitungRekap(tanggal, arrayPesanan) {
    const list = Array.isArray(arrayPesanan) ? arrayPesanan : [];
    const tglAcuan = tanggal ? new Date(tanggal) : new Date();

    const targetY = tglAcuan.getFullYear();
    const targetM = tglAcuan.getMonth();
    const targetD = tglAcuan.getDate();

    let tunaiHarian = 0;
    let nonTunaiHarian = 0;
    let countHarian = 0;

    let tunaiBulanan = 0;
    let nonTunaiBulanan = 0;
    let countBulanan = 0;

    list.forEach(p => {
        if (!p) return;

        // Hanya pesanan dengan statusBayar "Lunas" yang dihitung (abaikan Ditolak / Belum Bayar)
        const statusBayar = (p.statusBayar || "").toLowerCase();
        if (statusBayar !== "lunas") return;

        const w = p.timestamp ? new Date(p.timestamp) : new Date();
        const pY = w.getFullYear();
        const pM = w.getMonth();
        const pD = w.getDate();

        const totalNominal = Number(p.total) || 0;

        // Cek metode bayar (tunai atau nontunai)
        const metode = (p.metodeBayar || p.metodePembayaran || "").toLowerCase();
        const isNonTunai = metode.includes("non") || metode.includes("qris") || metode.includes("transfer");

        // Cek apakah masuk bulan berjalan
        if (pY === targetY && pM === targetM) {
            countBulanan++;
            if (isNonTunai) {
                nonTunaiBulanan += totalNominal;
            } else {
                tunaiBulanan += totalNominal;
            }

            // Cek apakah masuk hari ini
            if (pD === targetD) {
                countHarian++;
                if (isNonTunai) {
                    nonTunaiHarian += totalNominal;
                } else {
                    tunaiHarian += totalNominal;
                }
            }
        }
    });

    const totalHarian = tunaiHarian + nonTunaiHarian;
    const totalBulanan = tunaiBulanan + nonTunaiBulanan;

    return {
        // Properti langsung (kompatibel dengan berbagai destructuring)
        tunai: tunaiHarian,
        nonTunai: nonTunaiHarian,
        total: totalHarian,
        totalBulanan: totalBulanan,
        jumlahPesananHarian: countHarian,
        jumlahPesananBulanan: countBulanan,

        // Struktur bersarang
        harian: {
            tunai: tunaiHarian,
            nonTunai: nonTunaiHarian,
            total: totalHarian
        },
        bulanan: {
            tunai: tunaiBulanan,
            nonTunai: nonTunaiBulanan,
            total: totalBulanan
        }
    };
}

/**
 * Menyuntikkan 1 pesanan dummy selesai di hari kemarin (H-1)
 * Digunakan untuk menguji perbedaan Rekap Harian vs Rekap Bulanan (TC-27)
 * @returns {object} Objek pesanan dummy yang baru dibuat
 */
function injectDataDummyKemarin() {
    const kemarin = new Date();
    kemarin.setDate(kemarin.getDate() - 1); // Mundur 1 hari
    kemarin.setHours(14, 30, 0, 0);

    const idDummy = "KCS-DUMMY-" + String(Date.now()).slice(-4);
    const pesananDummy = {
        idPesanan: idDummy,
        id: idDummy,
        nama: "Pelanggan Uji Kemarin",
        meja: "05",
        items: [
            {
                id: "M001",
                nama: "Es Kopi Susu Gula Aren",
                ukuran: "Regular",
                boba: "boba",
                hargaSatuan: 28000,
                jumlah: 2,
                subtotal: 56000
            }
        ],
        total: 56000,
        metodePembayaran: "Tunai",
        metodeBayar: "tunai",
        statusBayar: "Lunas",
        status: "Selesai",
        sumber: "dummy_test",
        timestamp: kemarin.toISOString()
    };

    const daftar = typeof getPesanan === "function" ? getPesanan() : [];
    daftar.push(pesananDummy);

    if (typeof savePesanan === "function") {
        savePesanan(daftar);
    } else {
        localStorage.setItem("daftar_pesanan", JSON.stringify(daftar));
        localStorage.setItem("kcs_pesanan", JSON.stringify(daftar));
    }

    return pesananDummy;
}

// Ekspor untuk pengujian Node.js jika ada
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        hitungRekap,
        injectDataDummyKemarin
    };
}
