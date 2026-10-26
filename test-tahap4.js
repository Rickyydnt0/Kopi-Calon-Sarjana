// Test harness for Tahap 4 logic verification

// Mock browser globals
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; }
};

// Load modules
const fs = require('fs');
const vm = require('vm');

function loadScript(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInThisContext(code, { filename: filePath });
}

loadScript('./js/storage.js');
loadScript('./js/data.js');
loadScript('./js/pesanan.js');
loadScript('./js/auth.js');

console.log("=== PENGUJIAN OTOMATIS TAHAP 4 ===");

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

// 1. Validasi Format Username (TC-19)
assert("Username 'adm' (< 6 char) ditolak", validasiFormatUsername("adm") === false);
assert("Username '1234567890123456' (> 15 char) ditolak", validasiFormatUsername("1234567890123456") === false);
assert("Username 'admin01' (7 char) diterima", validasiFormatUsername("admin01") === true);

const resU1 = login("adm", "Kopi12345");
assert("Login 'adm' menghasilkan error format username", resU1.success === false && resU1.field === "username" && resU1.error === "Format username tidak sesuai");

// 2. Validasi Format Password
assert("Password '123' (< 8 char) ditolak", validasiFormatPassword("123") === false);
assert("Password '123456789012345678901' (> 20 char) ditolak", validasiFormatPassword("123456789012345678901") === false);
assert("Password 'Kopi12345' (9 char) diterima", validasiFormatPassword("Kopi12345") === true);

// 3. Login Kredensial Salah (TC-05)
const resSalah = login("admin01", "SalahPassword1");
assert("Login password salah ditolak dengan 'Username atau password salah'", resSalah.success === false && resSalah.field === "global" && resSalah.error === "Username atau password salah");

// 4. Login Berhasil Admin (TC-04)
const resAdmin = login("admin01", "Kopi12345");
assert("Login admin01 / Kopi12345 berhasil dan mengarahkan ke admin.html", resAdmin.success === true && resAdmin.sesi.peran === "admin" && resAdmin.redirect === "admin.html");
assert("kcs_sesi tersimpan di localStorage", JSON.parse(localStorage.getItem("kcs_sesi")).peran === "admin");

// 5. Login Berhasil Kasir
const resKasir = login("kasir01", "Kasir12345");
assert("Login kasir01 / Kasir12345 berhasil dan mengarahkan ke kasir.html", resKasir.success === true && resKasir.sesi.peran === "kasir" && resKasir.redirect === "kasir.html");

// 6. Alur Transisi Status Pesanan (TC-13 & TC-23)
assert("Transisi: Menunggu Konfirmasi -> Diproses valid", isTransisiValid("Menunggu Konfirmasi", "Diproses") === true);
assert("Transisi: Diproses -> Siap Diambil valid", isTransisiValid("Diproses", "Siap Diambil") === true);
assert("Transisi: Siap Diambil -> Selesai valid", isTransisiValid("Siap Diambil", "Selesai") === true);

// TC-23: Lompat status ditolak
assert("TC-23: Menunggu Konfirmasi langsung ke Siap Diambil DITOLAK", isTransisiValid("Menunggu Konfirmasi", "Siap Diambil") === false);
assert("TC-23: Menunggu Konfirmasi langsung ke Selesai DITOLAK", isTransisiValid("Menunggu Konfirmasi", "Selesai") === false);
assert("TC-23: Mundur status Diproses -> Menunggu Konfirmasi DITOLAK", isTransisiValid("Diproses", "Menunggu Konfirmasi") === false);

// 7. Verifikasi Pesanan Non-Tunai (TC-12 & TC-22)
const dummyPesanan = [
  {
    idPesanan: "KCS-999",
    nama: "Budi",
    meja: "05",
    total: 50000,
    metodeBayar: "nontunai",
    statusBayar: "Menunggu Verifikasi",
    status: "Menunggu Konfirmasi",
    timestamp: new Date().toISOString()
  }
];
savePesanan(dummyPesanan);

// TC-22: Tolak Bukti
const resTolak = verifikasiPembayaran("KCS-999", "tolak", "admin01");
assert("TC-22: Verifikasi tolak berhasil, statusBayar menjadi 'Ditolak'", resTolak.success && resTolak.pesanan.statusBayar === "Ditolak");

// TC-12: Terima Bukti
dummyPesanan[0].statusBayar = "Menunggu Verifikasi";
dummyPesanan[0].status = "Menunggu Konfirmasi";
savePesanan(dummyPesanan);

const resTerima = verifikasiPembayaran("KCS-999", "terima", "admin01");
assert("TC-12: Verifikasi terima berhasil, statusBayar menjadi 'Lunas'", resTerima.success && resTerima.pesanan.statusBayar === "Lunas");
assert("TC-12: Status alur otomatis maju ke 'Diproses'", resTerima.pesanan.status === "Diproses");

// 8. Perubahan Status Berurutan pada Pesanan (TC-13)
const resMaju1 = ubahStatus("KCS-999", "Siap Diambil", "admin01");
assert("TC-13: Status maju dari Diproses ke Siap Diambil BERHASIL", resMaju1.success && resMaju1.pesanan.status === "Siap Diambil");

const resMaju2 = ubahStatus("KCS-999", "Selesai", "admin01");
assert("TC-13: Status maju dari Siap Diambil ke Selesai BERHASIL", resMaju2.success && resMaju2.pesanan.status === "Selesai");

// Coba lompat status saat sudah selesai
const resLompat = ubahStatus("KCS-999", "Menunggu Konfirmasi", "admin01");
assert("TC-23: Mencoba mundur atau lompat gagal via ubahStatus", resLompat.success === false && resLompat.message === "Perubahan status tidak valid");

// 9. Statistik Dasbor Hari Ini
const stats = getStatistikHariIni();
assert("Statistik Dasbor: Total pesanan hari ini dihitung (1)", stats.pesananHariIni === 1);
assert("Statistik Dasbor: Total penjualan status Lunas dihitung (Rp50.000)", stats.totalPenjualan === 50000);

console.log(`\nHASIL: ${passed} / ${total} pengujian BERHASIL.`);
