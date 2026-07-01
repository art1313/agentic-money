from __future__ import annotations

from typing import Any, Optional

import httpx


class AgenticMoney:
    def __init__(self, api_key: str, base_url: str = "http://localhost:3141"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(
            base_url=self.base_url,
            headers={"X-API-Key": api_key, "Content-Type": "application/json"},
        )

    def _request(self, method: str, path: str, json: Optional[dict] = None) -> Any:
        r = self._client.request(method, path, json=json)
        data = r.json()
        if not data.get("ok"):
            raise Exception(data.get("error", f"API error: {r.status_code}"))
        return data.get("data")

    # --- Wallets ---

    def create_wallet(
        self,
        asset: str = "bitcoin",
        chain: Optional[str] = None,
        network: str = "testnet",
        role: Optional[str] = None,
        name: Optional[str] = None,
        mnemonic: Optional[str] = None,
    ) -> dict:
        body: dict[str, Any] = {"asset": asset, "network": network}
        if chain:
            body["chain"] = chain
        if role:
            body["role"] = role
        if name:
            body["name"] = name
        if mnemonic:
            body["mnemonic"] = mnemonic
        return self._request("POST", "/v1/wallets", json=body)

    def list_wallets(self) -> list[dict]:
        return self._request("GET", "/v1/wallets")

    def get_wallet(self, wallet_id: str) -> dict:
        return self._request("GET", f"/v1/wallets/{wallet_id}")

    def delete_wallet(self, wallet_id: str) -> dict:
        return self._request("DELETE", f"/v1/wallets/{wallet_id}")

    # --- Balance ---

    def get_balance(self, wallet_id: str) -> dict:
        return self._request("GET", f"/v1/wallets/{wallet_id}/balance")

    # --- Send ---

    def send(self, wallet_id: str, to: str, amount: str) -> dict:
        return self._request("POST", f"/v1/wallets/{wallet_id}/send", json={"to": to, "amount": amount})

    # --- Receive ---

    def get_receive_address(self, wallet_id: str) -> dict:
        return self._request("GET", f"/v1/wallets/{wallet_id}/receive")

    # --- Health ---

    def health(self) -> dict:
        r = httpx.get(f"{self.base_url}/health")
        return r.json()

    def close(self):
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
