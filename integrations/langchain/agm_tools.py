"""LangChain tools for Agentic Money — let any AI agent manage wallets."""

from __future__ import annotations

import os
from typing import Optional, Type

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from agentic_money import AgenticMoney


def _get_client() -> AgenticMoney:
    api_key = os.environ.get("AGM_API_KEY", "")
    base_url = os.environ.get("AGM_BASE_URL", "http://localhost:3141")
    return AgenticMoney(api_key, base_url)


# --- Create Wallet ---

class CreateWalletInput(BaseModel):
    asset: str = Field(default="bitcoin", description="Asset type: bitcoin, usdc, or usdt")
    chain: Optional[str] = Field(default=None, description="Chain: bitcoin, solana, or base")
    network: str = Field(default="testnet", description="Network: mainnet or testnet")
    name: Optional[str] = Field(default=None, description="Human-readable wallet name")


class CreateWalletTool(BaseTool):
    name: str = "agm_create_wallet"
    description: str = (
        "Create a new cryptocurrency wallet. Use asset='bitcoin' for savings (store of value) "
        "or asset='usdc'/'usdt' for spending (payments). Chains: bitcoin for BTC, solana or base for stablecoins."
    )
    args_schema: Type[BaseModel] = CreateWalletInput

    def _run(self, asset: str = "bitcoin", chain: str | None = None, network: str = "testnet", name: str | None = None) -> str:
        agm = _get_client()
        result = agm.create_wallet(asset=asset, chain=chain, network=network, name=name)
        return f"Created {result['asset']} wallet '{result['name']}' (id: {result['id']}) on {result['chain']}. Address: {result['address']}"


# --- List Wallets ---

class ListWalletsTool(BaseTool):
    name: str = "agm_list_wallets"
    description: str = "List all wallets managed by Agentic Money."

    def _run(self) -> str:
        agm = _get_client()
        wallets = agm.list_wallets()
        if not wallets:
            return "No wallets found."
        lines = [f"- {w['name']} (id: {w['id']}, {w['asset']} on {w['chain']}, {w['network']}): {w['address']}" for w in wallets]
        return f"Found {len(wallets)} wallet(s):\n" + "\n".join(lines)


# --- Get Balance ---

class GetBalanceInput(BaseModel):
    wallet_id: str = Field(description="The wallet ID to check balance for")


class GetBalanceTool(BaseTool):
    name: str = "agm_get_balance"
    description: str = "Check the balance of a specific wallet."
    args_schema: Type[BaseModel] = GetBalanceInput

    def _run(self, wallet_id: str) -> str:
        agm = _get_client()
        bal = agm.get_balance(wallet_id)
        return f"Wallet {bal['walletId']} ({bal['asset']} on {bal['chain']}): {bal['balance']} {bal['unit']}"


# --- Send ---

class SendInput(BaseModel):
    wallet_id: str = Field(description="The wallet ID to send from")
    to: str = Field(description="Recipient address")
    amount: str = Field(description="Amount to send")


class SendTool(BaseTool):
    name: str = "agm_send"
    description: str = "Send cryptocurrency from a wallet to a recipient address."
    args_schema: Type[BaseModel] = SendInput

    def _run(self, wallet_id: str, to: str, amount: str) -> str:
        agm = _get_client()
        result = agm.send(wallet_id, to=to, amount=amount)
        return f"Sent {result['amount']} {result['asset']} from {result['from']} to {result['to']}. TX: {result['txid']}"


# --- Receive ---

class ReceiveInput(BaseModel):
    wallet_id: str = Field(description="The wallet ID to get a receive address for")


class ReceiveAddressTool(BaseTool):
    name: str = "agm_receive_address"
    description: str = "Get the deposit address for a wallet to receive funds."
    args_schema: Type[BaseModel] = ReceiveInput

    def _run(self, wallet_id: str) -> str:
        agm = _get_client()
        recv = agm.get_receive_address(wallet_id)
        return f"Send {recv['asset']} on {recv['chain']} ({recv['network']}) to: {recv['address']}"


def get_agm_tools() -> list[BaseTool]:
    """Return all Agentic Money tools for use with a LangChain agent."""
    return [
        CreateWalletTool(),
        ListWalletsTool(),
        GetBalanceTool(),
        SendTool(),
        ReceiveAddressTool(),
    ]
