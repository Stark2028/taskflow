"""Domain errors raised by the service layer.

Services describe *what* went wrong; main.py decides which HTTP status code each error becomes.
That keeps business logic independent of HTTP.
"""


class DomainError(Exception):
    """Base class for expected, client-visible errors. `detail` is safe to send to the client."""

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class NotFoundError(DomainError):
    """The resource does not exist, or the caller is not allowed to know it exists."""


class ConflictError(DomainError):
    """The request conflicts with existing data (e.g. duplicate email)."""


class AuthenticationError(DomainError):
    """The caller's identity could not be established (bad credentials or token)."""


class PermissionDeniedError(DomainError):
    """The caller is authenticated but not allowed to perform this action."""


class InvalidOperationError(DomainError):
    """The request is well-formed but breaks a business rule."""
