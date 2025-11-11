import os
import uuid
from typing import Dict, List, Tuple

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from dotenv import load_dotenv

try:
    import midtransclient
    from midtransclient.http_client import MidtransAPIError
    HAS_MIDTRANSCLIENT = True
except Exception:
    midtransclient = None
    MidtransAPIError = Exception  # type: ignore
    HAS_MIDTRANSCLIENT = False

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

PRODUCTS: List[Dict[str, object]] = [
    {
        "id": "keripik-pisang",
        "name": "Keripik Pisang Lampung",
        "category": "makanan",
        "price": 25000,
        "currency": "IDR",
        "stock": 20,
        "image": "https://down-id.img.susercontent.com/file/id-11134207-7r98w-lvts4lmly9hpe8",
        "description": "Keripik pisang gurih khas Lampung.",
    },
    {
        "id": "abon-cakalang",
        "name": "Abon Ikan Cakalang",
        "category": "makanan",
        "price": 45000,
        "currency": "IDR",
        "stock": 15,
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8PCVoJQojHOykfiLj4r2Zn2eHKnettsPipA&s",
        "description": "Abon ikan cakalang pedas manis dari Manado.",
    },
    {
        "id": "sabun-herbal",
        "name": "Sabun Herbal Bali",
        "category": "kecantikan",
        "price": 55000,
        "currency": "IDR",
        "stock": 10,
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4xdc4ga6kkmAu2pveUKhd75x64i5dOrgKcA&s",
        "description": "Sabun herbal alami dengan aroma spa Bali.",
    },
    {
        "id": "batik-pria",
        "name": "Batik Pria Pekalongan",
        "category": "pakaian",
        "price": 170000,
        "currency": "IDR",
        "stock": 7,
        "image": "https://img.lazcdn.com/g/ff/kf/S1145d8bbc71b4ecd92299200c6b994a6o.jpg_720x720q80.jpg",
        "description": "Batik tulis pria motif klasik Pekalongan.",
    },
    {
        "id": "tas-rotan",
        "name": "Tas Rotan Bali",
        "category": "kerajinan",
        "price": 150000,
        "currency": "IDR",
        "stock": 10,
        "image": "https://img.lazcdn.com/g/p/5fe28ffb68afafee0c578a444947581b.png_720x720q80.png_.webp",
        "description": "Tas rotan anyam tangan pengrajin Bali.",
    },
]

PRODUCT_INDEX: Dict[str, Dict[str, object]] = {product["id"]: product for product in PRODUCTS}

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)


def is_midtrans_mock_enabled() -> bool:
    return os.getenv("MIDTRANS_MOCK", "false").lower() in ("1", "true", "yes")


class ConfigurationError(RuntimeError):
    """Raised when required Midtrans configuration is missing."""


def _get_client_key(allow_blank: bool = False) -> str:
    client_key = os.getenv("MIDTRANS_CLIENT_KEY") or os.getenv("LSMIDTRANS_CLIENT_KEY")
    if client_key:
        return client_key
    if allow_blank:
        return ""
    raise ConfigurationError("MIDTRANS_CLIENT_KEY environment variable must be set.")


def _get_midtrans_client() -> Tuple["midtransclient.Snap", str]:
    if not HAS_MIDTRANSCLIENT:
        raise ConfigurationError("Library 'midtransclient' is not installed. Run 'pip install midtransclient'.")

    server_key = os.getenv("MIDTRANS_SERVER_KEY")
    if not server_key:
        raise ConfigurationError("MIDTRANS_SERVER_KEY environment variable must be set.")

    client_key = _get_client_key()
    is_production = os.getenv("MIDTRANS_IS_PRODUCTION", "false").lower() in ("1", "true", "yes")

    snap = midtransclient.Snap(
        is_production=is_production,
        server_key=server_key,
        client_key=client_key,
    )
    return snap, client_key


def _normalise_items(raw_items: List[dict]) -> List[Dict[str, object]]:
    if not isinstance(raw_items, list):
        raise ValueError("Items payload must be a list.")

    merged: Dict[str, Dict[str, object]] = {}
    for item in raw_items:
        if not isinstance(item, dict):
            raise ValueError("Each item must be an object.")
        product_id = item.get("id")
        if not product_id:
            raise ValueError("Each item must include an 'id'.")
        product = PRODUCT_INDEX.get(product_id)
        if not product:
            raise ValueError(f"Unknown product id '{product_id}'.")
        try:
            quantity = int(item.get("quantity", 1))
        except (TypeError, ValueError) as exc:
            raise ValueError("Item quantity must be an integer.") from exc
        if quantity <= 0:
            raise ValueError("Item quantity must be a positive integer.")

        existing = merged.get(product_id)
        if existing:
            existing["quantity"] = int(existing["quantity"]) + quantity
        else:
            merged[product_id] = {
                "id": product_id,
                "name": product["name"],
                "price": int(product["price"]),
                "quantity": quantity,
            }

    return list(merged.values())

# =====================================================
# 🏠 ROUTE: Halaman utama
# =====================================================
@app.route("/")
def index():
    try:
        client_key = _get_client_key(allow_blank=False)
    except ConfigurationError as exc:
        return f"Midtrans client key is not configured: {exc}", 500
    return render_template("index.html", client_key=client_key)


@app.route("/_debug")
def debug_info():
    return jsonify(
        {
            "midtrans_mock": is_midtrans_mock_enabled(),
            "midtrans_server_key_present": bool(os.getenv("MIDTRANS_SERVER_KEY")),
            "midtrans_client_key_present": bool(os.getenv("MIDTRANS_CLIENT_KEY") or os.getenv("LSMIDTRANS_CLIENT_KEY")),
        }
    )


@app.get("/api/products")
def list_products():
    return jsonify({"products": PRODUCTS})


@app.get("/api/config")
def midtrans_config():
    try:
        _, client_key = _get_midtrans_client()
    except ConfigurationError as exc:
        return jsonify({"error": str(exc)}), 500
    return jsonify({"clientKey": client_key})

# =====================================================
# 💳 ROUTE: Buat transaksi Midtrans
# =====================================================
@app.post("/api/checkout")
@app.post("/create-transaction")
def checkout():
    try:
        payload = request.get_json(silent=True) or {}
    except Exception:
        return jsonify({"error": "Invalid JSON payload."}), 400

    raw_items = payload.get("items")
    if not raw_items:
        return jsonify({"error": "Cart is empty."}), 400

    try:
        normalised_items = _normalise_items(raw_items)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    customer_payload = payload.get("customer") or {}
    try:
        first_name = customer_payload["first_name"]
        email = customer_payload["email"]
    except KeyError:
        return jsonify({"error": "Customer first_name and email are required."}), 400

    last_name = customer_payload.get("last_name", "")
    phone = customer_payload.get("phone", "")

    gross_amount = sum(int(item["price"]) * int(item["quantity"]) for item in normalised_items)
    if gross_amount <= 0:
        return jsonify({"error": "Gross amount must be positive."}), 400

    order_id = payload.get("order_id") or f"ORDER-{uuid.uuid4().hex[:12].upper()}"

    transaction_details = {
        "order_id": order_id,
        "gross_amount": gross_amount,
    }

    customer_details = {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone": phone,
    }

    if is_midtrans_mock_enabled():
        return jsonify(
            {
                "orderId": order_id,
                "grossAmount": gross_amount,
                "token": f"MOCKTOKEN-{order_id}",
                "redirectUrl": f"https://example.com/mock-pay/{order_id}",
                "mock": True,
            }
        )

    try:
        snap_client, _ = _get_midtrans_client()
        transaction = snap_client.create_transaction(
            {
                "transaction_details": transaction_details,
                "item_details": normalised_items,
                "customer_details": customer_details,
            }
        )
    except ConfigurationError as exc:
        return jsonify({"error": str(exc)}), 500
    except MidtransAPIError as exc:
        return (
            jsonify(
                {
                    "error": "Midtrans API error.",
                    "details": getattr(exc, "message", str(exc)),
                }
            ),
            502,
        )
    except Exception as exc:
        return jsonify({"error": "Unexpected error while creating transaction.", "details": str(exc)}), 500

    token = transaction.get("token")
    redirect_url = transaction.get("redirect_url")

    if not token:
        return jsonify({"error": "Midtrans did not return a token.", "details": transaction}), 502

    return jsonify(
        {
            "orderId": order_id,
            "grossAmount": gross_amount,
            "token": token,
            "redirectUrl": redirect_url,
        }
    )


# =====================================================
# 🚀 Jalankan server Flask
# =====================================================
if __name__ == "__main__":
    print("🚀 Menjalankan server Flask di http://127.0.0.1:5000 ...")
    app.run(host="127.0.0.1", port=5000, debug=True)
