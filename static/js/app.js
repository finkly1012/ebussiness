// ========================================================
// 🧾 Data Awal
// ========================================================
let saldo = 500000;
let keranjang = [];
// Guard to prevent calling snap.pay while a popup is already open
let snapOpen = false;

// ========================================================
// 📦 Daftar Produk Lokal
// ========================================================
const produkList = [
  {
    nama: "Keripik Pisang Lampung",
    kategori: "makanan",
    harga: 25000,
    stok: 20,
    gambar:
      "https://down-id.img.susercontent.com/file/id-11134207-7r98w-lvts4lmly9hpe8",
  },
  {
    nama: "Abon Ikan Cakalang",
    kategori: "makanan",
    harga: 45000,
    stok: 15,
    gambar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8PCVoJQojHOykfiLj4r2Zn2eHKnettsPipA&s",
  },
  {
    nama: "Sabun Herbal Bali",
    kategori: "kecantikan",
    harga: 55000,
    stok: 10,
    gambar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4xdc4ga6kkmAu2pveUKhd75x64i5dOrgKcA&s",
  },
  {
    nama: "Lulur Tradisional Jawa",
    kategori: "kecantikan",
    harga: 45000,
    stok: 8,
    gambar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcST7xxyJ5LSOkvB_oQqBaFkZcHj3H5P-gRFvQ&s",
  },
  {
    nama: "Batik Pria Pekalongan",
    kategori: "pakaian",
    harga: 170000,
    stok: 7,
    gambar:
      "https://img.lazcdn.com/g/ff/kf/S1145d8bbc71b4ecd92299200c6b994a6o.jpg_720x720q80.jpg",
  },
  {
    nama: "Rok Lilit Batik",
    kategori: "pakaian",
    harga: 85000,
    stok: 5,
    gambar:
      "https://www.riantybatik.co.id/wp-content/uploads/2024/06/RIANTY-BATIK-ROK-LILIT-DEYANA-SOGAN-1.webp",
  },
  {
    nama: "Taplak Meja Tenun",
    kategori: "rumah tangga",
    harga: 140000,
    stok: 6,
    gambar:
      "https://www.tokotenun.com/wp-content/uploads/2025/04/A1252-TT-TAPLAK-MEJA-BIRU.jpeg",
  },
  {
    nama: "Bantal Tenun Etnik",
    kategori: "rumah tangga",
    harga: 85000,
    stok: 9,
    gambar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpfSJzQUp9as8vtIqkSvzAgRsswB0GvAaWlw&s",
  },
  {
    nama: "Tas Rotan Bali",
    kategori: "kerajinan",
    harga: 150000,
    stok: 10,
    gambar:
      "https://img.lazcdn.com/g/p/5fe28ffb68afafee0c578a444947581b.png_720x720q80.png_.webp",
  },
  {
    nama: "Keranjang Rotan Lombok",
    kategori: "kerajinan",
    harga: 220000,
    stok: 7,
    gambar:
      "https://www.kerajinan-bali.com/image-product/img1412-1642496793.jpg",
  },
];

// ========================================================
// 💰 Format Rupiah
// ========================================================
function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
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
      : produkList.filter((p) => p.kategori === kategori);

  if (produkFilter.length === 0) {
    container.innerHTML = `<p style="color:#d72638;text-align:center;">Tidak ada produk untuk kategori ${kategori}</p>`;
    return;
  }

  produkFilter.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "produk produk-card";
    div.setAttribute("data-kategori", p.kategori);

    div.innerHTML = `
      <img src="${p.gambar}" alt="${p.nama}" />
      <h3>${p.nama}</h3>
      <p>${formatRupiah(p.harga)}</p>
      <p><small>Stok: ${p.stok}</small></p>
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
  if (p.stok <= 0) return alert("Stok habis!");
  keranjang.push({ ...p });
  p.stok--;
  tampilkanKeranjang();
  tampilkanProduk();
  alert(`${p.nama} ditambahkan ke keranjang!`);
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
    total += p.harga;
    const item = document.createElement("div");
    item.className = "cart-item";
    item.innerHTML = `
      <span>${p.nama} - ${formatRupiah(p.harga)}</span>
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
  const produk = produkList.find((p) => p.nama === item.nama);
  if (produk) produk.stok++;
  keranjang.splice(index, 1);
  tampilkanKeranjang();
  tampilkanProduk();
}

// ========================================================
// 💳 Bayar via Midtrans Snap
// ========================================================
async function bayar() {
  if (keranjang.length === 0) return alert("Keranjang kosong!");
  const total = keranjang.reduce((sum, p) => sum + p.harga, 0);

  const btn = document.getElementById("btn-bayar");
  if (btn) btn.disabled = true;

  try {
    // Use relative path so the app works on any host/port (dev or deployed)
    const response = await fetch("/create-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        total: total,
        nama: "Pelanggan Lokal",
        email: "pelanggan@example.com",
      }),
    });

    if (!response.ok) throw new Error("Gagal menghubungi server Flask");

    const data = await response.json();
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
          transaction_id: data.order_id || `MOCK-${Date.now()}`,
          order_id: data.order_id || null,
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
      alert("⚠️ Token transaksi tidak ditemukan. Cek server Flask!");
      console.error("Response tanpa token:", data);
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    console.error("❌ Error koneksi:", err);
    alert("Gagal terhubung ke server Flask. Pastikan server berjalan!");
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
  tampilkanProduk();
  tampilkanKeranjang();
  updateSaldo();
  // Pasang handler pembayaran dari fungsi `bayar` di file ini
  const btnBayar = document.getElementById("btn-bayar");
  if (btnBayar) {
    btnBayar.addEventListener("click", bayar);
  }
});
