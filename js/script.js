let menuDipilih = "";
let hargaAwal = 0;

function tambahKeKeranjang(nama,harga){

    menuDipilih = nama;
    hargaAwal = harga;

    document.getElementById("judulMenu").innerHTML = nama;

    document.getElementById("customModal").classList.add("show");

    hitungHarga();
}

let kategoriAktif = "all";

function setCategory(kategori, tombol) {
    kategoriAktif = kategori;

    filterProducts();

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    tombol.classList.add("active");
}
function filterProducts() {
    const keyword = document
        .getElementById("searchInput")
        .value
        .toLowerCase();

    const products = document.querySelectorAll(".product-card");

    products.forEach(product => {
        const nama = product
            .querySelector("h4")
            .textContent
            .toLowerCase();

        const kategoriProduk = product.dataset.category;

        const cocokKategori =
            kategoriAktif === "all" ||
            kategoriProduk === kategoriAktif;

        const cocokNama =
            nama.includes(keyword);

        if (cocokKategori && cocokNama) {
            product.style.display = "block";
        } else {
            product.style.display = "none";
        }
    });
}
function toggleCart() {
    document
        .getElementById("cartPopup")
        .classList.toggle("show");

    document
        .getElementById("overlay")
        .classList.toggle("show");

    tampilkanKeranjang();
}
function tampilkanKeranjang() {
    const keranjang =
        JSON.parse(localStorage.getItem("keranjang")) || [];

    const cartItems =
        document.getElementById("cartItems");

    const cartTotal =
        document.getElementById("cartTotal");

    let total = 0;

    if (keranjang.length === 0) {
        cartItems.innerHTML =
            "<p class='empty-cart'>Keranjang kosong ☕</p>";

        cartTotal.textContent = "0";
        return;
    }

    let html = `
        <table class="cart-table">
            <thead>
                <tr>
                    <th>Menu</th>
                    <th>Harga</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
    `;

    keranjang.forEach((item, index) => {
        html += `
            <tr>
                <td>
                <b>${item.nama}</b><br>
                <small>
                ${item.size}<br>
                Gula : ${item.gula}<br>
                Es : ${item.ice}<br>
                Topping :${item.topping.length > 0? item.topping.map(t => t.nama).join(", "): "-"}
                Catatan : ${item.catatan || "-"}
                </small>
                </td>
                <td>Rp ${item.harga.toLocaleString("id-ID")}</td>
                <td>
                    <button class="hapus-btn"
                        onclick="hapusItem(${index})">
                        ✕
                    </button>
                </td>
            </tr>
        `;

        total += item.harga;
    });

    html += `
            </tbody>
        </table>
    `;

    cartItems.innerHTML = html;

    cartTotal.textContent =
        total.toLocaleString("id-ID");
}

window.onload = function () {
    const keranjang =
        JSON.parse(localStorage.getItem("keranjang")) || [];

    const badge = document.getElementById("cartCount");

    if (badge) {
        badge.textContent = keranjang.length;
    }

    if (typeof tampilkanKeranjang === "function") {
        tampilkanKeranjang();
    }
}
function hapusItem(index){

        let keranjang =
            JSON.parse(localStorage.getItem("keranjang")) || [];

        keranjang.splice(index,1);

        if (keranjang.length === 0) {
        localStorage.removeItem("keranjang");
    } else {
        localStorage.setItem(
            "keranjang",
            JSON.stringify(keranjang)
        );
    }

    updateCartCount();

    tampilkanKeranjang();
}
function checkout(){

    const keranjang =
        JSON.parse(localStorage.getItem("keranjang")) || [];

    console.log(keranjang);

    if(keranjang.length === 0){
        alert("Keranjang masih kosong ☕");
        return;
    }

    window.location.href = "struk.html";
}
function updateCartCount() {
    const keranjang =
        JSON.parse(localStorage.getItem("keranjang")) || [];

    const badge = document.getElementById("cartCount");

    if (badge) {
        badge.textContent = keranjang.length;
    }
}
function hitungHarga(){

    let total = hargaAwal;

    total += Number(document.getElementById("size").value);

    document
    .querySelectorAll(".topping-list input:checked")
    .forEach(item=>{

    total += Number(item.dataset.harga);

    });

    document.getElementById("hargaCustom").innerHTML=
    total.toLocaleString("id-ID");

}
document.addEventListener("change",function(e){

    if(
    e.target.id=="size" ||
    e.target.closest(".topping-list")
    ){
    hitungHarga();
    }

    });

function simpanCustom(){

    let keranjang =
    JSON.parse(localStorage.getItem("keranjang")) || [];

    let topping = [];
    let tambahan = 0;

    document.querySelectorAll(".topping-list input:checked")
    .forEach(item => {

        topping.push({
            nama: item.value,
            harga: Number(item.dataset.harga)
        });

        tambahan += Number(item.dataset.harga);

    });

    let total =
    hargaAwal +
    Number(document.getElementById("size").value)
    +
    tambahan;

    keranjang.push({

    nama: menuDipilih,

    hargaAwal: hargaAwal,

    tambahSize: Number(document.getElementById("size").value),

    harga: total,

    size: document.getElementById("size").selectedOptions[0].text,

    gula: document.getElementById("gula").value,

    ice: document.getElementById("ice").value,

    topping: topping,

    catatan: document.getElementById("catatan").value

});
localStorage.setItem("keranjang",JSON.stringify(keranjang));

    updateCartCount();

    tampilkanKeranjang();

    tutupCustom();

}
function tutupCustom() {

    document.getElementById("customModal").classList.remove("show");

    document.getElementById("catatan").value = "";

    document.getElementById("size").selectedIndex = 0;
    document.getElementById("gula").selectedIndex = 2;
    document.getElementById("ice").selectedIndex = 2;

    document.querySelectorAll(".topping-list input").forEach(item => {
        item.checked = false;
    });
    const notif = document.createElement("div");
    notif.innerText = "✔ Berhasil ditambahkan ke keranjang";
    notif.className = "toast";
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.remove();
    }, 2000);
    
    hitungHarga();
}
