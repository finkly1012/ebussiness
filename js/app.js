// Saldo awal dompet digital
let saldo = 500000;

// Fungsi untuk memformat angka ke bentuk rupiah
function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

// Fungsi untuk membeli produk
function tambahKeDompet(harga) {
  if (saldo >= harga) {
    saldo -= harga;
    alert("✅ Pembelian berhasil! Saldo berkurang " + formatRupiah(harga));
  } else {
    alert("⚠️ Saldo tidak cukup! Silakan isi saldo terlebih dahulu.");
  }
  updateSaldo();
}

// Fungsi untuk menambah saldo
function isiSaldo() {
  const tambah = prompt(
    "Masukkan jumlah saldo yang ingin ditambah (contoh: 100000):"
  );
  const jumlah = parseInt(tambah);

  if (!isNaN(jumlah) && jumlah > 0) {
    saldo += jumlah;
    alert("💰 Saldo berhasil ditambahkan sejumlah " + formatRupiah(jumlah));
  } else {
    alert("❌ Jumlah tidak valid! Mohon masukkan angka yang benar.");
  }

  updateSaldo();
}

// Fungsi untuk memperbarui tampilan saldo di halaman
function updateSaldo() {
  const saldoElement = document.getElementById("saldo");
  if (saldoElement) {
    saldoElement.innerText = formatRupiah(saldo);
  }
}

// Panggil saat halaman pertama kali dimuat
document.addEventListener("DOMContentLoaded", updateSaldo);
