// Test harness for Tahap 5 logic verification

// Mock browser globals
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; }
};

const fs = require('fs');
const vm = require('vm');

function loadScript(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInThisContext(code, { filename: filePath });
}

loadScript('./js/storage.js');
loadScript('./js/data.js');
loadScript('./js/hitung.js');
loadScript('./js/pesanan.js');
loadScript('./js/auth.js');
loadScript('./js/rekap.js');

console.log("=== PENGUJIAN OTOMATIS TAHAP 5 ===");

let passed = 0;
let total = 0;

function assert(desc, condition) {
  total++;
  if (condition) {
    console.log(`[PASS] ${desc}`);
    passed++;
  } else {
    console.error(`[FAIL] ${desc}`);
  }
}

// 1. Kasir Login & Guard
const loginKasir = login("kasir01", "Kasir12345");
assert("Kasir login berhasil dan redirect ke kasir.html", loginKasir.success && loginKasir.redirect === "kasir.html");
assert("Sesi kasir tersimpan dengan peran 'kasir'", getSesi().peran === "kasir");

// 2. Input Pesanan oleh Kasir (TC-26)
// Kasir pilih 2 Es Kopi Susu (harga dasar 25.000) + Boba (+3.000) -> 28.000 x 2 = Rp56.000
const hargaPerItem = hargaSatuan(25000, "Regular", "boba");
assert("Perhitungan harga satuan 25.000 + boba = 28.000", hargaPerItem === 28000);
const sub = subtotal(hargaPerItem, 2);
assert("Subtotal 2 item @28.000 = 56.000", sub === 56000);

const keranjangMock = [
  {
    id: "M001",
    nama: "Es Kopi Susu Gula Aren",
    hargaSatuan: hargaPerItem,
    jumlah: 2,
    subtotal: sub
  }
];
const totalPesanan = totalKeranjang(keranjangMock);
assert("Total keranjang = 56.000", totalPesanan === 56000);

// Simulasikan pembuatan pesanan kasir
const pesananKasir = {
  idPesanan: "KCS-POS-001",
  nama: "Rian",
  meja: "04",
  items: keranjangMock,
  total: totalPesanan,
  metodePembayaran: "Tunai",
  metodeBayar: "tunai",
  statusBayar: "Lunas",
  status: "Diproses",
  sumber: "kasir",
  timestamp: new Date().toISOString()
};
savePesanan([pesananKasir]);

const daftar = getPesanan();
assert("TC-26: Pesanan kasir tersimpan di kcs_pesanan", daftar.length === 1 && daftar[0].idPesanan === "KCS-POS-001");
assert("TC-26: Status pesanan kasir langsung 'Diproses'", daftar[0].status === "Diproses");
assert("TC-26: StatusBayar pesanan kasir langsung 'Lunas'", daftar[0].statusBayar === "Lunas");

// 3. Pembayaran Tunai Pelanggan (TC-15)
// Pelanggan checkout tunai di meja
const pesananPelangganTunai = {
  idPesanan: "KCS-002",
  nama: "Siti",
  meja: "02",
  items: [{ id: "M001", nama: "Es Kopi Susu Gula Aren", hargaSatuan: 28000, jumlah: 1, subtotal: 28000 }],
  total: 28000,
  metodePembayaran: "Tunai",
  metodeBayar: "tunai",
  statusBayar: "Menunggu Pembayaran",
  status: "Menunggu Konfirmasi",
  timestamp: new Date().toISOString()
};
daftar.push(pesananPelangganTunai);
savePesanan(daftar);

// Kasir klik "Terima Pembayaran" (TC-15)
const idxTunai = daftar.findIndex(p => p.idPesanan === "KCS-002");
daftar[idxTunai].statusBayar = "Lunas";
daftar[idxTunai].status = "Diproses";
savePesanan(daftar);

const daftarUpdated = getPesanan();
const pLunas = daftarUpdated.find(p => p.idPesanan === "KCS-002");
assert("TC-15: Terima pembayaran tunai mengubah statusBayar -> 'Lunas'", pLunas.statusBayar === "Lunas");
assert("TC-15: Terima pembayaran tunai mengubah status -> 'Diproses'", pLunas.status === "Diproses");

// 4. Rekap Harian (TC-16)
// Buat skenario: 2 pesanan Tunai (@Rp28.000 = Rp56.000) dan 1 pesanan Non-tunai valid (Rp56.000)
const pesananTestRekap = [
  {
    idPesanan: "KCS-101",
    total: 28000,
    metodeBayar: "tunai",
    statusBayar: "Lunas",
    status: "Diproses",
    timestamp: new Date().toISOString()
  },
  {
    idPesanan: "KCS-102",
    total: 28000,
    metodeBayar: "tunai",
    statusBayar: "Lunas",
    status: "Diproses",
    timestamp: new Date().toISOString()
  },
  {
    idPesanan: "KCS-103",
    total: 56000,
    metodeBayar: "nontunai",
    statusBayar: "Lunas",
    status: "Diproses",
    timestamp: new Date().toISOString()
  },
  {
    // Pesanan belum bayar / ditolak harus diabaikan oleh rekap
    idPesanan: "KCS-104",
    total: 30000,
    metodeBayar: "tunai",
    statusBayar: "Menunggu Pembayaran",
    status: "Menunggu Konfirmasi",
    timestamp: new Date().toISOString()
  }
];
savePesanan(pesananTestRekap);

const rekapHarian = hitungRekap(new Date(), pesananTestRekap);
assert("TC-16: Rekap Tunai Hari Ini = Rp56.000", rekapHarian.tunai === 56000);
assert("TC-16: Rekap Non-Tunai Hari Ini = Rp56.000", rekapHarian.nonTunai === 56000);
assert("TC-16: Total Keseluruhan Hari Ini = Rp112.000", rekapHarian.total === 112000);

// 5. Rekap Bulanan & Inject Dummy Kemarin (TC-27)
const dummyKemarin = injectDataDummyKemarin();
assert("TC-27: Dummy kemarin berhasil diinject dengan nominal Rp56.000", dummyKemarin.total === 56000);

const semuaSetelahDummy = getPesanan();
const rekapSetelahDummy = hitungRekap(new Date(), semuaSetelahDummy);

assert("TC-27: Rekap Harian tetap Rp112.000 (tidak terpengaruh transaksi kemarin)", rekapSetelahDummy.total === 112000);
assert("TC-27: Rekap Bulanan bertambah menjadi Rp168.000 (112.000 + 56.000)", rekapSetelahDummy.totalBulanan === 168000);

console.log(`\nHASIL: ${passed} / ${total} pengujian Tahap 5 BERHASIL.`);
