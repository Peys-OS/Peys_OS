"""
Peys Python SDK

Official Peys Payment SDK for Python.

Installation:
    pip install peys

Usage:
    from peys import Peys

    client = Peys(api_key="pk_live_xxx")

    # Create a payment
    payment = client.payments.create(
        amount="1000000",  # in USDC micro units
        currency="USDC",
        recipient="0x123..."
    )

    print(payment.id)
"""

import hashlib
import hmac
import json
import time
import uuid
from typing import Any, Optional
from urllib.parse import urlencode

import requests

__version__ = "1.0.0"
__author__ = "Peys"


class PeysError(Exception):
    """Base exception for Peys errors."""

    pass


class Peys:
    """Main Peys client."""

    BASE_URL = "https://api.peys.app"

    def __init__(
        self,
        api_key: str,
        base_url: Optional[str] = None,
        network: str = "base-sepolia",
        timeout: int = 30,
    ):
        """
        Initialize the Peys client.

        Args:
            api_key: Your Peys API key
            base_url: Optional custom API base URL
            network: Blockchain network (base-sepolia, polygon-amoy, celo-alfajores)
            timeout: Request timeout in seconds
        """
        if not api_key:
            raise ValueError("API key is required")

        self.api_key = api_key
        self.base_url = base_url or self.BASE_URL
        self.network = network
        self.timeout = timeout
        self._session = requests.Session()
        self._session.headers.update(
            {
                "Content-Type": "application/json",
                "x-api-key": api_key,
            }
        )

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[dict] = None,
    ) -> dict:
        """Make an API request."""
        url = f"{self.base_url}{endpoint}"

        try:
            response = self._session.request(
                method=method,
                url=url,
                json=data,
                timeout=self.timeout,
            )

            result = response.json()

            if not response.ok or result.get("status") == "error":
                raise PeysError(result.get("message", "Request failed"))

            return result.get("data", {})

        except requests.exceptions.Timeout:
            raise PeysError(f"Request timeout after {self.timeout}s")
        except requests.exceptions.RequestException as e:
            raise PeysError(str(e))

    @property
    def payments(self) -> "Payments":
        """Access payments API."""
        return Payments(self)

    @property
    def links(self) -> "PaymentLinks":
        """Access payment links API."""
        return PaymentLinks(self)

    @property
    def fiat(self) -> "FiatAPI":
        """Access fiat operations API."""
        return FiatAPI(self)

    @property
    def p2p(self) -> "P2PAPI":
        """Access P2P marketplace API."""
        return P2PAPI(self)

    @property
    def webhooks(self) -> "Webhooks":
        """Access webhooks API."""
        return Webhooks(self)


class Payments:
    """Payments API."""

    def __init__(self, client: Peys):
        self._client = client

    def create(
        self,
        amount: str,
        recipient: str,
        currency: str = "USDC",
        metadata: Optional[dict] = None,
    ) -> dict:
        """
        Create a new payment.

        Args:
            amount: Payment amount in USDC micro units
            recipient: Recipient wallet address
            currency: Payment currency (default: USDC)
            metadata: Optional metadata

        Returns:
            Payment details including id and claim link
        """
        data = {
            "amount": str(amount),
            "currency": currency,
            "recipientAddress": recipient,
            "network": self._client.network,
            "commitHash": self._generate_commit_hash(),
        }

        if metadata:
            data.update(metadata)

        result = self._client._request("POST", "/api/v1/payments/initiate", data)
        result["claimLink"] = f"{self._client.base_url}/claim/{result['id']}"
        return result

    def get(self, payment_id: str) -> dict:
        """Get payment details by ID."""
        return self._client._request("GET", f"/api/v1/payments/{payment_id}")

    def confirm(self, payment_id: str, secret: str) -> dict:
        """
        Confirm a payment using the reveal secret.

        Args:
            payment_id: Payment ID
            secret: Secret used to create the commit hash

        Returns:
            Updated payment details
        """
        return self._client._request(
            "POST",
            "/api/v1/payments/confirm",
            {
                "paymentId": payment_id,
                "revealSecret": secret,
            },
        )

    def refund(self, payment_id: str, reason: Optional[str] = None) -> dict:
        """Refund a payment."""
        data = {"paymentId": payment_id}
        if reason:
            data["reason"] = reason

        return self._client._request("POST", "/api/v1/payments/refund", data)

    def list(
        self,
        page: int = 1,
        limit: int = 20,
        status: Optional[str] = None,
    ) -> dict:
        """List payments with pagination."""
        params = {"page": page, "limit": limit}
        if status:
            params["status"] = status

        return self._client._request("GET", f"/api/v1/transactions?{urlencode(params)}")

    def _generate_commit_hash(self) -> str:
        """Generate a commit hash for payment security."""
        secret = str(uuid.uuid4())
        return hashlib.sha256(secret.encode("utf-8")).hexdigest()


class PaymentLinks:
    """Payment Links API."""

    def __init__(self, client: Peys):
        self._client = client

    def create(
        self,
        title: str,
        amount: float,
        currency: str,
        recipient_address: str,
        description: Optional[str] = None,
        expires_at: Optional[str] = None,
    ) -> dict:
        """Create a payment link."""
        data = {
            "title": title,
            "amount": amount,
            "currency": currency,
            "recipientAddress": recipient_address,
            "network": self._client.network,
        }

        if description:
            data["description"] = description
        if expires_at:
            data["expiresAt"] = expires_at

        return self._client._request("POST", "/api/v1/payments/links", data)

    def get(self, link_id: str) -> dict:
        """Get payment link details."""
        return self._client._request("GET", f"/api/v1/payments/links/{link_id}")

    def list(self, page: int = 1, limit: int = 20) -> dict:
        """List payment links."""
        return self._client._request(
            "GET", f"/api/v1/payments/links?page={page}&limit={limit}"
        )


class FiatAPI:
    """Fiat operations API."""

    def __init__(self, client: Peys):
        self._client = client

    def withdraw(
        self,
        amount: float,
        currency: str,
        bank_code: str,
        account_number: str,
        account_name: str,
        narration: Optional[str] = None,
    ) -> dict:
        """Withdraw to African bank accounts."""
        return self._client._request(
            "POST",
            "/api/v1/fiat/withdraw",
            {
                "amount": amount,
                "currency": currency,
                "bankCode": bank_code,
                "accountNumber": account_number,
                "accountName": account_name,
                "narration": narration,
            },
        )

    def pay_bill(
        self,
        bill_type: str,
        provider: str,
        amount: float,
        phone: Optional[str] = None,
        **kwargs,
    ) -> dict:
        """Pay bills (airtime, data, TV, electricity)."""
        data = {
            "type": bill_type,
            "provider": provider,
            "amount": amount,
        }

        if phone:
            data["phone"] = phone

        data.update(kwargs)
        return self._client._request("POST", "/api/v1/fiat/bills", data)


class P2PAPI:
    """P2P Marketplace API."""

    def __init__(self, client: Peys):
        self._client = client

    def create_listing(
        self,
        type: str,
        fiat_currency: str,
        fiat_amount: float,
        crypto_amount: str,
        crypto_currency: str = "USDC",
        payment_methods: Optional[list] = None,
        exchange_rate: Optional[str] = None,
        min_amount: Optional[str] = None,
        max_amount: Optional[str] = None,
    ) -> dict:
        """Create a P2P listing."""
        data = {
            "type": type,
            "fiatCurrency": fiat_currency,
            "fiatAmount": fiat_amount,
            "cryptoAmount": crypto_amount,
            "cryptoCurrency": crypto_currency,
        }

        if payment_methods:
            data["paymentMethods"] = payment_methods
        if exchange_rate:
            data["exchangeRate"] = exchange_rate
        if min_amount:
            data["minAmount"] = min_amount
        if max_amount:
            data["maxAmount"] = max_amount

        return self._client._request("POST", "/api/v1/p2p/listings", data)

    def list(
        self,
        type: Optional[str] = None,
        currency: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> dict:
        """List P2P listings."""
        params = [f"page={page}", f"limit={limit}"]
        if type:
            params.append(f"type={type}")
        if currency:
            params.append(f"currency={currency}")

        return self._client._request("GET", f"/api/v1/p2p/listings?{'&'.join(params)}")

    def initiate_trade(self, listing_id: str, fiat_amount: float) -> dict:
        """Initiate a P2P trade."""
        return self._client._request(
            "POST",
            "/api/v1/p2p/trades",
            {
                "listingId": listing_id,
                "fiatAmount": fiat_amount,
            },
        )

    def confirm_payment(self, trade_id: str) -> dict:
        """Confirm payment for a trade."""
        return self._client._request("POST", f"/api/v1/p2p/trades/{trade_id}/confirm")

    def release_crypto(self, trade_id: str) -> dict:
        """Release crypto for a completed trade."""
        return self._client._request("POST", f"/api/v1/p2p/trades/{trade_id}/release")


class Webhooks:
    """Webhooks API."""

    def __init__(self, client: Peys):
        self._client = client

    def register(
        self,
        url: str,
        events: list,
        secret: Optional[str] = None,
    ) -> dict:
        """Register a webhook endpoint."""
        return self._client._request(
            "POST",
            "/api/v1/webhooks",
            {
                "url": url,
                "events": events,
                "secret": secret,
            },
        )


class WebhookVerifier:
    """Verify webhook signatures."""

    def __init__(self, secret: str):
        self.secret = secret.encode()

    def verify(self, payload: bytes, signature: str) -> bool:
        """Verify a webhook signature."""
        expected = hmac.new(
            self.secret,
            payload,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(expected, signature)


# Convenience function
def from_api_key(api_key: str, **kwargs) -> Peys:
    """Create a Peys client from an API key."""
    return Peys(api_key=api_key, **kwargs)
