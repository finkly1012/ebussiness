// ========================================================
// 🧾 Data Awal
// ========================================================
let saldo = 500000;
let keranjang = [];
// Guard to prevent calling snap.pay while a popup is already open
let snapOpen = false;

const DEFAULT_PRODUCTS = [
  {
    id: "keripik-pisang",
    name: "Keripik Pisang Lampung",
    category: "makanan",
    price: 25000,
    stock: 20,
    image:
      "https://down-id.img.susercontent.com/file/id-11134207-7r98w-lvts4lmly9hpe8",
  },
  {
    id: "abon-cakalang",
    name: "Abon Ikan Cakalang",
    category: "makanan",
    price: 45000,
    stock: 15,
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8PCVoJQojHOykfiLj4r2Zn2eHKnettsPipA&s",
  },
  {
    id: "sabun-herbal",
    name: "Sabun Herbal Bali",
    category: "kecantikan",
    price: 55000,
    stock: 10,
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4xdc4ga6kkmAu2pveUKhd75x64i5dOrgKcA&s",
  },
  {
    id: "batik-pria",
    name: "Batik Pria Pekalongan",
    category: "pakaian",
    price: 170000,
    stock: 7,
    image:
      "https://img.lazcdn.com/g/ff/kf/S1145d8bbc71b4ecd92299200c6b994a6o.jpg_720x720q80.jpg",
  },
  {
    id: "tas-rotan",
    name: "Tas Rotan Bali",
    category: "kerajinan",
    price: 150000,
    stock: 10,
    image:
      "https://img.lazcdn.com/g/p/5fe28ffb68afafee0c578a444947581b.png_720x720q80.png_.webp",
  },
];

let produkList = DEFAULT_PRODUCTS.map((item) => ({ ...item }));

// ========================================================
// 💰 Format Rupiah
// ========================================================
function formatRupiah(angka) {
  const value = Number(angka) || 0;
  return "Rp " + value.toLocaleString("id-ID");
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("Gagal memuat daftar produk dari server");
    const data = await response.json();
    if (Array.isArray(data.products) && data.products.length > 0) {
      produkList = data.products.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category || "umum",
        price: Number(item.price) || 0,
        stock: Number(item.stock) || 0,
        image: item.image,
      }));
    } else {
      produkList = DEFAULT_PRODUCTS.map((item) => ({ ...item }));
    }
  } catch (err) {
    console.warn("Gagal memuat data produk dari API, menggunakan fallback lokal", err);
    produkList = DEFAULT_PRODUCTS.map((item) => ({ ...item }));
  }
  tampilkanProduk();
}

// ========================================================
// 🛍️ Tampilkan Produk
// ========================================================
function tampilkanProduk(kategori = "semua") {
  const container = document.getElementById("daftar-produk");
  container.innerHTML = "";

  const produkFilter =
    kategori === "semua"
      ? produkList
      : produkList.filter((p) => p.category === kategori);

  if (produkFilter.length === 0) {
    container.innerHTML = `<p style="color:#d72638;text-align:center;">Tidak ada produk untuk kategori ${kategori}</p>`;
    return;
  }

  produkFilter.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "produk produk-card";
    div.setAttribute("data-kategori", p.category);

    div.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p>${formatRupiah(p.price)}</p>
      <p><small>Stok: ${p.stock}</small></p>
      <button onclick="tambahKeranjang(${i})">+ Keranjang</button>
    `;
    container.appendChild(div);
  });
}

// ========================================================
// 🛒 Tambahkan ke Keranjang
// ========================================================
function tambahKeranjang(i) {
  const p = produkList[i];
  if (!p) return;
  if (p.stock <= 0) return alert("Stok habis!");
  keranjang.push({ ...p });
  p.stock--;
  tampilkanKeranjang();
  tampilkanProduk();
  alert(`${p.name} ditambahkan ke keranjang!`);
}

// ========================================================
// 🧾 Tampilkan Keranjang
// ========================================================
function tampilkanKeranjang() {
  const container = document.getElementById("daftar-keranjang");
  container.innerHTML = "";

  if (keranjang.length === 0) {
    container.innerHTML = "<p>Keranjang masih kosong.</p>";
    document.getElementById("total-harga").innerText = "Total: Rp 0";
    return;
  }

  let total = 0;
  keranjang.forEach((p, i) => {
    total += p.price;
    const item = document.createElement("div");
    item.className = "cart-item";
    item.innerHTML = `
      <span>${p.name} - ${formatRupiah(p.price)}</span>
      <button onclick="hapusDariKeranjang(${i})" class="hapus-btn">Hapus</button>
    `;
    container.appendChild(item);
  });

  document.getElementById("total-harga").innerText =
    "Total: " + formatRupiah(total);

  // Pastikan tombol Bayar aktif (penanganan klik ditangani di script.js)
  const btnBayar = document.getElementById("btn-bayar");
  if (btnBayar) btnBayar.disabled = false;
}

// ========================================================
// ❌ Hapus dari Keranjang
// ========================================================
function hapusDariKeranjang(index) {
  const item = keranjang[index];
  if (!item) return;
  const produk = produkList.find((p) => p.id === item.id);
  if (produk) produk.stock++;
  keranjang.splice(index, 1);
  tampilkanKeranjang();
  tampilkanProduk();
}

// ========================================================
// 💳 Bayar via Midtrans Snap
// ========================================================
async function bayar() {
  if (keranjang.length === 0) return alert("Keranjang kosong!");
  const total = keranjang.reduce((sum, p) => sum + p.price, 0);

  const grouped = {};
  keranjang.forEach((item) => {
    if (!grouped[item.id]) {
      grouped[item.id] = { id: item.id, quantity: 0 };
    }
    grouped[item.id].quantity += 1;
  });

  const checkoutItems = Object.values(grouped);

  const btn = document.getElementById("btn-bayar");
  if (btn) btn.disabled = true;

  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: checkoutItems,
        customer: {
          first_name: "Pelanggan",
          last_name: "Lokal",
          email: "pelanggan@example.com",
          phone: "+628123456789",
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data.error || "Gagal menghubungi server Flask";
      throw new Error(message);
    }
    if (data.error) {
      throw new Error(data.error);
    }
    console.log("🎫 Token Midtrans:", data);

    // Jalankan Snap popup
    if (data.token) {
      // If backend signalled a mock response, skip calling Midtrans Snap and
      // simulate the payment flow locally. Real Midtrans tokens must be
      // generated by the server using a valid MIDTRANS_SERVER_KEY; calling
      // window.snap.pay with a fake token will cause 404/POST errors from
      // Midtrans (seen when MIDTRANS_MOCK=true previously).
      if (data.mock) {
        console.log("Mock token received — simulating Snap flow locally", data);
        // Simulate success result object similar to what Snap would return
        const fakeResult = {
          status_message: "Success (mock)",
          transaction_id: data.orderId || `MOCK-${Date.now()}`,
          order_id: data.orderId || null,
          payment_type: "mock",
        };
        alert("✅ (Mock) Pembayaran berhasil (simulasi)");
        console.log("(mock) result:", fakeResult);
        keranjang = [];
        tampilkanKeranjang();
        tampilkanProduk();
        if (btn) btn.disabled = false;
        return;
      }

      // Not a mock response: proceed to call real Snap
      if (typeof window.snap === "undefined") {
        alert(
          "⚠️ Snap.js belum dimuat. Pastikan script Midtrans ada di index.html"
        );
        // Re-enable button because we cannot proceed
        if (btn) btn.disabled = false;
        return;
      }

      if (snapOpen) {
        console.warn(
          "Snap popup already open - ignoring duplicate pay request"
        );
        if (btn) btn.disabled = false;
        return;
      }

      // mark popup as open and call snap.pay
      snapOpen = true;
      window.snap.pay(data.token, {
        onSuccess: function (result) {
          alert("✅ Pembayaran berhasil!");
          console.log(result);
          keranjang = [];
          tampilkanKeranjang();
          tampilkanProduk();
          snapOpen = false;
          if (btn) btn.disabled = false;
        },
        onPending: function (result) {
          alert("⌛ Pembayaran pending.");
          console.log(result);
          snapOpen = false;
          if (btn) btn.disabled = false;
        },
        onError: function (result) {
          alert("❌ Terjadi kesalahan saat pembayaran.");
          console.error(result);
          snapOpen = false;
          if (btn) btn.disabled = false;
        },
        onClose: function () {
          alert("❕ Popup ditutup tanpa menyelesaikan pembayaran.");
          snapOpen = false;
          if (btn) btn.disabled = false;
        },
      });
    } else {
      const message = data.error || "⚠️ Token transaksi tidak ditemukan. Cek server Flask!";
      alert(message);
      console.error("Response tanpa token:", data);
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    console.error("❌ Error koneksi:", err);
    alert(err.message || "Gagal terhubung ke server Flask. Pastikan server berjalan!");
    if (btn) btn.disabled = false;
  } finally {
    // don't re-enable here; button will be re-enabled by snap callbacks
  }
}

// ========================================================
// 💵 Isi Saldo
// ========================================================
function isiSaldo() {
  const tambah = prompt("Masukkan jumlah saldo yang ingin ditambah:");
  const jumlah = parseInt(tambah);
  if (!isNaN(jumlah) && jumlah > 0) {
    saldo += jumlah;
    updateSaldo();
    alert("Saldo berhasil ditambahkan!");
  } else {
    alert("Jumlah tidak valid!");
  }
}

// ========================================================
// 🔄 Update Saldo
// ========================================================
function updateSaldo() {
  const elm = document.getElementById("saldo");
  elm.innerText = formatRupiah(saldo);
}

// ========================================================
// 🚀 Inisialisasi Saat Halaman Dimuat
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  tampilkanKeranjang();
  updateSaldo();
  // Pasang handler pembayaran dari fungsi `bayar` di file ini
  const btnBayar = document.getElementById("btn-bayar");
  if (btnBayar) {
    btnBayar.addEventListener("click", bayar);
  }
});
