"""
AI Life OS — Clerk Authentication Middleware (Module 4)
Validates Clerk JWTs to secure FastAPI routes.
"""

import os
import jwt
from fastapi import Request
from fastapi.responses import JSONResponse
from cryptography.hazmat.primitives import serialization
from starlette.middleware.base import BaseHTTPMiddleware

class ClerkMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, public_key: str | None = None, public_routes: list[str] | None = None):
        super().__init__(app)
        self.public_key = public_key or os.getenv("CLERK_PEM_PUBLIC_KEY", "")
        if self.public_key and not self.public_key.startswith("-----BEGIN"):
            self.public_key = f"-----BEGIN PUBLIC KEY-----\n{self.public_key}\n-----END PUBLIC KEY-----"
        self.public_routes = public_routes or ["/health", "/models", "/docs", "/openapi.json"]

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.public_routes or request.method == "OPTIONS":
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Missing or invalid Authorization header"})

        token = auth_header.split(" ")[1]

        if not self.public_key:
            # For local dev without Clerk configured
            request.state.user_id = "default_dev_user"
            return await call_next(request)

        try:
            # Decode the JWT
            key = serialization.load_pem_public_key(self.public_key.encode())
            decoded = jwt.decode(token, key, algorithms=["RS256"])
            # Attach user ID to request state
            request.state.user_id = decoded.get("sub")
        except jwt.ExpiredSignatureError:
            return JSONResponse(status_code=401, content={"detail": "Token has expired"})
        except jwt.InvalidTokenError as e:
            return JSONResponse(status_code=401, content={"detail": f"Invalid token: {str(e)}"})

        return await call_next(request)
