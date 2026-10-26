/**
 * keranjang.js — Kelola Keranjang Belanja per Meja di localStorage
 * Kunci penyimpanan: "keranjang_meja{nomor}" agar antar-meja tidak tercampur.
 */

/**
 * Dapatkan kunci localStorage untuk keranjang meja tertentu.
 * @param {string} meja - Nomor meja (contoh: "05")
 * @returns {string}
 */
function kunciKeranjang(meja) {
  return "keranjang_meja" + meja;
}

/**
 * Baca isi keranjang dari localStorage.
 * @param {string} meja
 * @returns {Array} Daftar item keranjang
 */
function bacaKeranjang(meja) {
  try {
    return JSON.parse(localStorage.getItem(kunciKeranjang(meja))) || [];
  } catch (e) {
    return [];
  }
}

/**
 * Simpan seluruh isi keranjang ke localStorage.
 * @param {string} meja
 * @param {Array} data
 */
function simpanKeranjang(meja, data) {
  localStorage.setItem(kunciKeranjang(meja), JSON.stringify(data));
}

/**
 * Tambah satu item baru ke keranjang (selalu baris baru, tidak digabung).
 * @param {string} meja
 * @param {object} item - Objek item keranjang lengkap
 */
function tambahItemKeranjang(meja, item) {
  var cart = bacaKeranjang(meja);
  cart.push(item);
  simpanKeranjang(meja, cart);
}

/**
 * Hapus satu item dari keranjang berdasarkan ID unik.
 * @param {string} meja
 * @param {string} itemId
 */
function hapusItemKeranjang(meja, itemId) {
  var cart = bacaKeranjang(meja);
  cart = cart.filter(function (i) { return i.id !== itemId; });
  simpanKeranjang(meja, cart);
}

/**
 * Ubah jumlah item di keranjang dan hitung ulang subtotal.
 * @param {string} meja
 * @param {string} itemId
 * @param {number} jumlahBaru
 */
function ubahJumlahItemKeranjang(meja, itemId, jumlahBaru) {
  var cart = bacaKeranjang(meja);
  var item = cart.find(function (i) { return i.id === itemId; });
  if (item) {
    item.jumlah = jumlahBaru;
    item.subtotal = item.hargaSatuan * jumlahBaru;
  }
  simpanKeranjang(meja, cart);
}

/**
 * Kosongkan seluruh keranjang meja.
 * @param {string} meja
 */
function kosongkanKeranjang(meja) {
  localStorage.removeItem(kunciKeranjang(meja));
}

/**
 * Hitung ringkasan keranjang: total item dan total harga.
 * @param {string} meja
 * @returns {{ totalItem: number, totalHarga: number }}
 */
function ringkasanKeranjang(meja) {
  var cart = bacaKeranjang(meja);
  var totalItem = cart.reduce(function (s, i) { return s + i.jumlah; }, 0);
  var totalHarga = cart.reduce(function (s, i) { return s + i.subtotal; }, 0);
  return { totalItem: totalItem, totalHarga: totalHarga };
}
