from flask import Flask, render_template, request, jsonify
try:
    import midtransclient
    HAS_MIDTRANSCLIENT = True
except Exception:
    midtransclient = None
    HAS_MIDTRANSCLIENT = False
import os
import time
import random
from datetime import datetime
from dotenv import load_dotenv
from flask_cors import CORS

# =====================================================
# 🔧 Load konfigurasi dan siapkan aplikasi Flask
# =====================================================
# Load .env and allow it to override existing environment variables so
# local edits to .env take effect even if variables were exported earlier.
load_dotenv(override=True)
# Print only non-sensitive debug info
print("DEBUG: MIDTRANS_MOCK=", os.getenv("MIDTRANS_MOCK"))
print("DEBUG: MIDTRANS_SERVER_KEY present=", bool(os.getenv("MIDTRANS_SERVER_KEY")))
print("DEBUG: MIDTRANS_CLIENT_KEY present=", bool(os.getenv("MIDTRANS_CLIENT_KEY") or os.getenv("LSMIDTRANS_CLIENT_KEY")))

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

# Mode mock untuk pengujian lokal tanpa kunci Midtrans
# NOTE: evaluate at runtime inside handlers to avoid issues with Flask's reloader
def is_midtrans_mock_enabled():
    return os.getenv("MIDTRANS_MOCK", "false").lower() in ("1", "true", "yes")

# =====================================================
# 🏠 ROUTE: Halaman utama
# =====================================================
@app.route("/")
def index():
    # Kirim Client Key ke HTML agar bisa dipakai Snap.js
    # Beberapa environment mungkin menyimpan client key di nama berbeda (LSMIDTRANS_CLIENT_KEY)
    client_key = os.getenv("MIDTRANS_CLIENT_KEY") or os.getenv("LSMIDTRANS_CLIENT_KEY") or "SB-Mid-client-6USQZh4TPIZkjHKN"
    return render_template("index.html", client_key=client_key)


# ===== Debug endpoint ringan (lokal only) =====
@app.route("/_debug")
def debug_info():
    # Hanya mengembalikan flag dan apakah server key ada (tidak menampilkan kunci penuh)
    return jsonify({
        "midtrans_mock": is_midtrans_mock_enabled(),
        "midtrans_server_key_present": bool(os.getenv("MIDTRANS_SERVER_KEY")),
        "midtrans_client_key_present": bool(os.getenv("MIDTRANS_CLIENT_KEY") or os.getenv("LSMIDTRANS_CLIENT_KEY"))
    })

# =====================================================
# 💳 ROUTE: Buat transaksi Midtrans
# =====================================================
@app.route("/create-transaction", methods=["POST"])
def create_transaction():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Data request kosong"}), 400

        total = int(float(data.get("total", 0)))
        nama = data.get("nama", "Pelanggan")
        email = data.get("email", "pelanggan@example.com")

        if total <= 0:
            return jsonify({"error": "Total pembayaran tidak valid."}), 400

        print("\n🧾 Membuat transaksi baru...")
        print(f"Nama: {nama} | Email: {email} | Total: Rp {total}")

        # =====================================================
        # 🔧 Inisialisasi Midtrans Snap (gunakan env jika tersedia)
        # =====================================================
        server_key = os.getenv("MIDTRANS_SERVER_KEY")
        # Jika midtransclient tidak terpasang, beri pesan jelas
        if not is_midtrans_mock_enabled() and not HAS_MIDTRANSCLIENT:
            return jsonify({
                "error": "Library 'midtransclient' tidak terpasang. Jalankan: pip install midtransclient",
            }), 500

        # Jika mock dimatikan tapi server_key tidak disediakan, beri pesan yang jelas
        if not is_midtrans_mock_enabled() and not server_key:
            return jsonify({
                "error": "MIDTRANS_SERVER_KEY tidak ditemukan di environment. Set MIDTRANS_SERVER_KEY pada file .env atau environment system.",
            }), 400

        # Gunakan midtransclient hanya saat tersedia dan mock mati
        snap = None
        if HAS_MIDTRANSCLIENT:
            snap = midtransclient.Snap(is_production=False, server_key=server_key)

        # =====================================================
        # 🧾 Buat ID transaksi unik
        # =====================================================
        order_id = f"order-{int(time.time())}-{random.randint(1000,9999)}"

        # =====================================================
        # 📦 Siapkan parameter transaksi
        # =====================================================
        param = {
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": total
            },
            "customer_details": {
                "first_name": nama,
                "email": email
            },
            "credit_card": {
                "secure": True
            },
            "expiry": {
                "start_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S +0700"),
                "unit": "minutes",
                "duration": 120  # Berlaku 2 jam
            }
        }

        # =====================================================
        # 🚀 Kirim request ke Midtrans (tangani error dengan jelas)
        # =====================================================
        # Jika mode mock aktif, kembalikan token palsu untuk pengujian lokal
        if is_midtrans_mock_enabled():
            fake_token = f"MOCKTOKEN-{order_id}"
            fake_redirect = f"https://example.com/mock-pay/{order_id}"
            print("⚠️ MIDTRANS_MOCK aktif - mengembalikan token palsu untuk testing lokal")
            return jsonify({
                "token": fake_token,
                "redirect_url": fake_redirect,
                "order_id": order_id,
                "mock": True,
            })

        try:
            if snap is None:
                # should not happen due to checks above, but guard anyway
                raise RuntimeError("midtransclient not available")
            transaction = snap.create_transaction(param)
        except Exception as mid_err:
            err_str = str(mid_err)
            print("❌ Midtrans error:", err_str)
            # Deteksi 401 Unauthorized dari Midtrans dan berikan pesan yang jelas
            if "401" in err_str or "unauthorized" in err_str.lower() or "access denied" in err_str.lower():
                return jsonify({
                    "error": "Midtrans unauthorized. Periksa MIDTRANS_SERVER_KEY (sandbox/server key) di environment .env atau pada konfigurasi.",
                    "detail": err_str
                }), 401
            return jsonify({"error": "Gagal berkomunikasi dengan Midtrans.", "detail": err_str}), 502

        token = transaction.get("token")
        redirect_url = transaction.get("redirect_url")

        if not token:
            # tampilkan respon penuh untuk debugging
            return jsonify({"error": "Gagal membuat token transaksi.", "detail": transaction}), 500

        print("✅ Transaksi berhasil dibuat!")
        print("🔹 Token:", token)
        print("🔹 Redirect URL:", redirect_url)

        return jsonify({
            "token": token,
            "redirect_url": redirect_url,
            "order_id": order_id
        })

    except Exception as e:
        print("❌ ERROR di Flask:", e)
        return jsonify({"error": str(e)}), 500


# =====================================================
# 🚀 Jalankan server Flask
# =====================================================
if __name__ == "__main__":
    print("🚀 Menjalankan server Flask di http://127.0.0.1:5000 ...")
    app.run(host="127.0.0.1", port=5000, debug=True)
