"""
Turns away an upload that is too large before any of it is read. FastAPI reads
the whole form before it checks who sent it, so without this anyone, signed in
or not, could make the server store gigabytes before being refused.
"""

from fastapi.responses import JSONResponse

from backend.admin import uploads

IMPORT_PATH = "/api/admin/import"


class UploadSizeLimit:
    """
    Rejects an import whose stated size is over the limit with 413, and one
    that does not state its size with 411. The server reads no more than the
    stated size, so a request cannot send more than it declared.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope["method"] == "POST" and scope["path"] == IMPORT_PATH:
            refusal = self.refusal(dict(scope["headers"]))
            if refusal is not None:
                await refusal(scope, receive, send)
                return
        await self.app(scope, receive, send)

    @staticmethod
    def refusal(headers):
        """The response for a request over the limit, or None to let it through."""

        length = headers.get(b"content-length", b"")
        # A body sent in chunks has no size up front, and browsers never send a form that way
        if b"transfer-encoding" in headers or not length.isdigit():
            return JSONResponse({"detail": {"reason": "lengthRequired"}}, status_code=411)
        if int(length) > uploads.MAX_UPLOAD_BYTES:
            return JSONResponse(
                {"detail": {"reason": "uploadTooLarge", "maxMegabytes": uploads.MAX_UPLOAD_MEGABYTES}},
                status_code=413,
            )
        return None
