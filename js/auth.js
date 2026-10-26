/**
 * auth.js — Modul Autentikasi Statis & Manajemen Sesi
 * Kopi Calon Sarjana (Tahap 4)
 */

// Kredensial Statis Kopi Calon Sarjana
const KREDENSIAL_STATIS = [
    { username: "admin01", password: "Kopi12345", peran: "admin" },
    { username: "kasir01", password: "Kasir12345", peran: "kasir" }
];

/**
 * Validasi format username (6 - 15 karakter)
 * @param {string} username
 * @returns {boolean}
 */
function validasiFormatUsername(username) {
    if (typeof username !== "string") return false;
    const len = username.trim().length;
    return len >= 6 && len <= 15;
}

/**
 * Validasi format password (8 - 20 karakter)
 * @param {string} password
 * @returns {boolean}
 */
function validasiFormatPassword(password) {
    if (typeof password !== "string") return false;
    const len = password.length;
    return len >= 8 && len <= 20;
}

/**
 * Mengambil data sesi pengguna dari localStorage
 * @returns {{peran: "admin"|"kasir", username: string}|null}
 */
function getSesi() {
    try {
        const d = localStorage.getItem("kcs_sesi");
        return d ? JSON.parse(d) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Menyimpan data sesi ke localStorage
 * @param {{peran: "admin"|"kasir", username: string}|null} sesi
 */
function setSesi(sesi) {
    if (sesi) {
        localStorage.setItem("kcs_sesi", JSON.stringify(sesi));
    } else {
        localStorage.removeItem("kcs_sesi");
    }
}

/**
 * Proses login dengan validasi format dan pencocokan kredensial
 * @param {string} username
 * @param {string} password
 * @returns {{success: boolean, error?: string, field?: "username"|"password"|"global", sesi?: object, redirect?: string}}
 */
function login(username, password) {
    const u = (username || "").trim();
    const p = password || "";

    // 1. Validasi Format Username (6-15 karakter) - TC-19
    if (!validasiFormatUsername(u)) {
        return {
            success: false,
            field: "username",
            error: "Format username tidak sesuai"
        };
    }

    // 2. Validasi Format Password (8-20 karakter)
    if (!validasiFormatPassword(p)) {
        return {
            success: false,
            field: "password",
            error: "Format password tidak sesuai"
        };
    }

    // 3. Pencocokan Kredensial Statis - TC-04 & TC-05
    const akunDitemukan = KREDENSIAL_STATIS.find(
        akun => akun.username.toLowerCase() === u.toLowerCase() && akun.password === p
    );

    if (!akunDitemukan) {
        return {
            success: false,
            field: "global",
            error: "Username atau password salah"
        };
    }

    // 4. Buat objek sesi
    const sesi = {
        peran: akunDitemukan.peran,
        username: akunDitemukan.username
    };
    setSesi(sesi);

    const redirect = sesi.peran === "admin" ? "admin.html" : "kasir.html";

    return {
        success: true,
        sesi: sesi,
        redirect: redirect
    };
}

/**
 * Menghapus sesi dan mengarahkan kembali ke login.html
 */
function logout() {
    setSesi(null);
    window.location.replace("login.html");
}

/**
 * Guard Sesi: Mengecek apakah pengguna memiliki akses ke halaman ini
 * @param {"admin"|"kasir"|Array<string>} [peranYangDiizinkan]
 * @returns {object|null} Mengembalikan objek sesi jika valid
 */
function cekSesi(peranYangDiizinkan) {
    const sesi = getSesi();

    // Jika belum login
    if (!sesi || !sesi.peran) {
        window.location.replace("login.html");
        return null;
    }

    // Jika peran dibatasi (contoh: halaman admin hanya untuk admin)
    if (peranYangDiizinkan) {
        const diizinkan = Array.isArray(peranYangDiizinkan)
            ? peranYangDiizinkan.includes(sesi.peran)
            : sesi.peran === peranYangDiizinkan;

        if (!diizinkan) {
            // Khusus kasir yang mencoba mengakses admin.html (TC-06)
            if (sesi.peran === "kasir") {
                alert("Akses Ditolak, halaman khusus admin");
                window.location.replace("kasir.html");
                return null;
            } else {
                alert("Akses Ditolak: Anda tidak memiliki izin untuk halaman ini.");
                window.location.replace("login.html");
                return null;
            }
        }
    }

    return sesi;
}

/**
 * Guard untuk halaman login (jika sudah ada sesi, langsung arahkan)
 */
function guardHalamanLogin() {
    const sesi = getSesi();
    if (sesi && sesi.peran) {
        if (sesi.peran === "admin") {
            window.location.replace("admin.html");
        } else if (sesi.peran === "kasir") {
            window.location.replace("kasir.html");
        }
    }
}
