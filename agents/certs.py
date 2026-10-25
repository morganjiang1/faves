"""Imported first by every agent: Python from python.org on a Mac has no root certificates
of its own, so point TLS at certifi's (before aiohttp builds its SSL context)."""
import os

try:
    import certifi

    os.environ.setdefault("SSL_CERT_FILE", certifi.where())
    os.environ.setdefault("REQUESTS_CA_BUNDLE", certifi.where())
except ImportError:
    pass
