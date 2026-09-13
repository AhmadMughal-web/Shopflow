"""Shared fetch helper with local-fixture fallback for cloud-blocked APIs."""
import json
import os
import time
import urllib.request

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


def fetch_json_with_fallback(url, fixture_filename, retries=3, timeout=15):
    """Try live fetch (with retries), fall back to a bundled fixture file on failure."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "application/json",
    }
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            request = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return json.loads(response.read().decode())
        except Exception as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(1.5 * attempt)

    fixture_path = os.path.join(FIXTURES_DIR, fixture_filename)
    if os.path.exists(fixture_path):
        print(f"Live fetch failed for {url} ({last_error}); using cached fixture {fixture_filename}")
        with open(fixture_path, "r", encoding="utf-8") as f:
            return json.load(f)

    print(f"Live fetch failed for {url} ({last_error}); no fixture found at {fixture_path}, skipping")
    return None