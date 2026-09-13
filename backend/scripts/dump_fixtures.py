"""Run locally ONCE (on your PC, not on Render) to snapshot external API
data as fixtures, so Render deploys never depend on a live 3rd-party call
that might get IP-blocked. After running this, commit the generated
'fixtures' folder to git.
"""
import json
import os
import urllib.request

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
os.makedirs(FIXTURES_DIR, exist_ok=True)

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

SOURCES = {
    "fakestore_products.json": "https://fakestoreapi.com/products",
    "fakestore_mens_clothing.json": "https://fakestoreapi.com/products/category/men's%20clothing",
    "fakestore_womens_clothing.json": "https://fakestoreapi.com/products/category/women's%20clothing",
    "dummyjson_products.json": "https://dummyjson.com/products?limit=24&skip=0",
    "platzi_products.json": "https://api.escuelajs.co/api/v1/products?limit=24&offset=0",
}

for filename, url in SOURCES.items():
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as response:
        data = json.loads(response.read().decode())
    path = os.path.join(FIXTURES_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f)
    print(f"Saved {filename}")

print("Done. Now run: git add fixtures && git commit -m 'add API fixtures' && git push")