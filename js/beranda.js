/**
 * beranda.js — Logika Halaman Beranda & Registrasi Pelanggan Kopi Calon Sarjana
 * 
 * Fitur:
 * 1. Mendukung 2 cara masuk pelanggan:
 *    a. Lewat parameter URL (?meja=05) — simulasi scan barcode di meja.
 *    b. Ketik langsung nomor meja dan nama di form (layaknya login meja).
 * 2. Aturan Validasi Black Box Testing:
 *    - Kode meja valid: 01 sampai 20. Kode lain -> "Meja tidak ditemukan".
 *    - Nama pelanggan:
 *      * Kosong -> "Nama wajib diisi"
 *      * Kurang dari 3 atau lebih dari 30 karakter -> "Nama harus 3-30 karakter"
 * 3. Status login pelanggan tersinkronisasi di Navbar (badge meja & nama).
 */

// Variabel global nomor meja aktif
let mejaAktif = null;

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Inisialisasi data awal (menu, akun, meja)
    if (typeof initData === "function") {
        await initData();
    }

    // 2. Setup hamburger navbar responsif
    setupNavbarResponsive();

    // 2b. Setup slideshow foto hero pelanggan
    initHeroSlideshow();

    // 2c. Setup scroll-triggered fade-in animation
    setupScrollReveal();

    // 3. Baca parameter ?meja dari URL
    const params = new URLSearchParams(window.location.search);
    const kodeMejaURL = params.get("meja");

    const mejaErrorContainer = document.getElementById("mejaErrorContainer");
    const formRegistrasi = document.getElementById("formRegistrasi");
    const regSukses = document.getElementById("regSukses");
    const inputMeja = document.getElementById("inputMeja");
    const hintMeja = document.getElementById("hintMeja");

    // 4. Periksa apakah ada parameter meja di URL
    if (kodeMejaURL !== null && kodeMejaURL !== "") {
        // Normalisasi format meja 1-9 menjadi 01-09 jika diinput 1 digit
        const normalized = kodeMejaURL.length === 1 ? "0" + kodeMejaURL : kodeMejaURL;
        const isValid = typeof MEJA_VALID !== "undefined" && MEJA_VALID.includes(normalized);

        if (!isValid) {
            // Parameter meja tidak valid (contoh: ?meja=99)
            if (mejaErrorContainer) mejaErrorContainer.classList.remove("hidden");
            if (formRegistrasi) formRegistrasi.classList.add("hidden");
            if (regSukses) regSukses.classList.add("hidden");
            return;
        }

        // Meja valid dari URL (simulasi scan barcode)
        mejaAktif = normalized;
        inputMeja.value = mejaAktif;
        inputMeja.readOnly = true;
        inputMeja.classList.add("input-meja");
        if (hintMeja) {
            hintMeja.innerHTML = `✅ Terdeteksi otomatis dari barcode: <strong>Meja ${mejaAktif}</strong>`;
        }
        perbaruiTautanNavbar(mejaAktif);
    } else {
        // Tidak ada parameter URL: Pelanggan dapat mengetik nomor meja secara langsung
        inputMeja.readOnly = false;
        inputMeja.classList.remove("input-meja");
        if (hintMeja) {
            hintMeja.innerHTML = `Silakan ketik nomor meja Anda (<strong>01 sampai 20</strong>) atau scan barcode di meja.`;
        }
    }

    // 5. Cek apakah sudah ada sesi pelanggan aktif di localStorage
    const pelanggan = typeof getPelanggan === "function" ? getPelanggan() : null;
    if (pelanggan && pelanggan.nama && pelanggan.meja) {
        // Jika parameter meja sama dengan sesi yang ada, atau dibuka tanpa parameter meja
        if (!mejaAktif || mejaAktif === pelanggan.meja) {
            mejaAktif = pelanggan.meja;
            tampilkanStatusSukses(pelanggan.nama, pelanggan.meja);
            perbaruiTautanNavbar(mejaAktif);
            updateNavbarUserInfo(pelanggan.nama, pelanggan.meja);
            return;
        }
    }

    // Tampilkan form registrasi jika belum login
    if (mejaErrorContainer) mejaErrorContainer.classList.add("hidden");
    if (formRegistrasi) formRegistrasi.classList.remove("hidden");
    if (regSukses) regSukses.classList.add("hidden");
});

/**
 * Validasi dan proses registrasi pelanggan (Login Meja)
 * Sesuai aturan EP (Equivalence Partitioning) & BVA (Boundary Value Analysis)
 */
function prosesRegistrasi(event) {
    event.preventDefault();

    const inputMeja = document.getElementById("inputMeja");
    const inputNama = document.getElementById("inputNama");
    const errorMeja = document.getElementById("errorMeja");
    const errorNama = document.getElementById("errorNama");

    let mejaVal = inputMeja.value.trim();
    const namaVal = inputNama.value.trim();

    // Reset status error
    errorMeja.textContent = "";
    errorNama.textContent = "";
    inputMeja.classList.remove("input-error");
    inputNama.classList.remove("input-error");

    // 1. Validasi Nomor Meja (01 sampai 20)
    // Format jika 1 digit (misal: "5" diubah jadi "05")
    if (mejaVal.length === 1 && mejaVal >= "1" && mejaVal <= "9") {
        mejaVal = "0" + mejaVal;
        inputMeja.value = mejaVal;
    }

    const isValidMeja = typeof MEJA_VALID !== "undefined" && MEJA_VALID.includes(mejaVal);
    if (!isValidMeja) {
        errorMeja.textContent = "Meja tidak ditemukan";
        inputMeja.classList.add("input-error");
        inputMeja.focus();
        return;
    }

    // 2. Validasi Nama Pelanggan (3-30 karakter)
    if (namaVal === "") {
        errorNama.textContent = "Nama wajib diisi";
        inputNama.classList.add("input-error");
        inputNama.focus();
        return;
    }

    if (namaVal.length < 3 || namaVal.length > 30) {
        errorNama.textContent = "Nama harus 3-30 karakter";
        inputNama.classList.add("input-error");
        inputNama.focus();
        return;
    }

    // Semua valid -> Simpan data pelanggan
    mejaAktif = mejaVal;
    if (typeof savePelanggan === "function") {
        savePelanggan({
            meja: mejaAktif,
            nama: namaVal
        });
    }

    // Reset keranjang belanja untuk sesi meja baru
    if (typeof saveKeranjang === "function") {
        saveKeranjang([]);
    }

    // Perbarui tampilan
    tampilkanStatusSukses(namaVal, mejaAktif);
    updateNavbarUserInfo(namaVal, mejaAktif);
    perbaruiTautanNavbar(mejaAktif);

    // Tampilkan notifikasi toast
    tampilkanToast(`Berhasil masuk! Meja ${mejaAktif} aktif untuk ${namaVal}.`);
}

/**
 * Tampilkan pesan sukses dan tombol lanjut ke menu
 */
function tampilkanStatusSukses(nama, meja) {
    const formRegistrasi = document.getElementById("formRegistrasi");
    const regSukses = document.getElementById("regSukses");
    const namaDisplay = document.getElementById("namaDisplay");
    const mejaDisplay = document.getElementById("mejaDisplay");
    const btnKeMenu = document.getElementById("btnKeMenu");

    if (formRegistrasi) formRegistrasi.classList.add("hidden");
    if (regSukses) regSukses.classList.remove("hidden");

    if (namaDisplay) namaDisplay.textContent = nama;
    if (mejaDisplay) mejaDisplay.textContent = meja;
    if (btnKeMenu) btnKeMenu.href = `menu.html?meja=${meja}`;
}

/**
 * Update info login pelanggan di pojok kanan Navbar
 */
function updateNavbarUserInfo(nama, meja) {
    const navUserInfo = document.getElementById("navUserInfo");
    const navUserBadge = document.getElementById("navUserBadge");
    const navBtnLogin = document.getElementById("navBtnLogin");

    if (navUserInfo && navUserBadge && navBtnLogin) {
        navUserBadge.textContent = `Meja ${meja} • ${nama}`;
        navUserInfo.classList.remove("hidden");
        navBtnLogin.classList.add("hidden");
    }
}

/**
 * Keluar dari sesi meja (Ganti Meja / Ganti Nama)
 */
function keluarSesiPelanggan() {
    if (typeof savePelanggan === "function") {
        localStorage.removeItem("kcs_pelanggan");
    }

    const navUserInfo = document.getElementById("navUserInfo");
    const navBtnLogin = document.getElementById("navBtnLogin");
    const formRegistrasi = document.getElementById("formRegistrasi");
    const regSukses = document.getElementById("regSukses");
    const inputMeja = document.getElementById("inputMeja");
    const inputNama = document.getElementById("inputNama");

    if (navUserInfo) navUserInfo.classList.add("hidden");
    if (navBtnLogin) navBtnLogin.classList.remove("hidden");
    if (regSukses) regSukses.classList.add("hidden");
    if (formRegistrasi) formRegistrasi.classList.remove("hidden");

    if (inputNama) inputNama.value = "";
    if (inputMeja && !inputMeja.readOnly) inputMeja.value = "";

    tampilkanToast("Sesi meja direset. Silakan masukkan nomor meja dan nama baru.");
}

/**
 * Tampilkan form manual jika pengguna sebelumnya membuka URL dengan meja yang salah
 */
function tampilkanFormManual() {
    const mejaErrorContainer = document.getElementById("mejaErrorContainer");
    const formRegistrasi = document.getElementById("formRegistrasi");
    const inputMeja = document.getElementById("inputMeja");

    if (mejaErrorContainer) mejaErrorContainer.classList.add("hidden");
    if (formRegistrasi) formRegistrasi.classList.remove("hidden");
    if (inputMeja) {
        inputMeja.readOnly = false;
        inputMeja.classList.remove("input-meja");
        inputMeja.value = "";
        inputMeja.focus();
    }
}

/**
 * Perbarui semua tautan navbar agar menyertakan parameter meja aktif
 */
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

/**
 * Setup hamburger menu untuk tampilan mobile
 */
function setupNavbarResponsive() {
    const hamburger = document.getElementById("navHamburger");
    const navLinks = document.getElementById("navLinks");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            navLinks.classList.toggle("show");
        });
    }
}

/**
 * Tampilkan notifikasi toast ringkas
 */
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

/**
 * Konfirmasi reset data uji (mengembalikan seed data awal)
 */
function konfirmasiReset() {
    const yakin = confirm("Reset semua data uji ke kondisi awal?\nSemua keranjang, pesanan, dan sesi pelanggan akan dibersihkan.");
    if (yakin && typeof resetData === "function") {
        resetData().then(() => {
            alert("Data uji berhasil direset ke kondisi awal.");
            window.location.href = "index.html";
        });
    }
}

/**
 * Inisialisasi rotasi otomatis slideshow background hero (4 foto kopi)
 */
function initHeroSlideshow() {
    const slides = document.querySelectorAll(".hero-slide");
    if (!slides || slides.length === 0) return;
    let idx = 0;
    setInterval(() => {
        slides[idx].classList.remove("active");
        idx = (idx + 1) % slides.length;
        slides[idx].classList.add("active");
    }, 4500);
}

/**
 * Setup animasi fade-in saat pengguna scroll ke bawah
 */
function setupScrollReveal() {
    const revealElements = document.querySelectorAll(".scroll-reveal");
    if (!revealElements || revealElements.length === 0) return;

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: "0px 0px -40px 0px"
        });

        revealElements.forEach(el => observer.observe(el));
    } else {
        // Fallback jika browser lama tidak mendukung IntersectionObserver
        revealElements.forEach(el => el.classList.add("is-visible"));
    }
}

