"""CSV streaming response helper."""

import csv
import io
from typing import AsyncIterator, Sequence

from starlette.responses import StreamingResponse


def csv_streaming_response(
    rows: Sequence[dict],
    headers: list[str],
    filename: str,
) -> StreamingResponse:
    """Create a StreamingResponse with CSV content."""

    def generate() -> AsyncIterator[str]:
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()
        yield buf.getvalue()
        buf.seek(0)
        buf.truncate(0)

        for row in rows:
            writer.writerow(row)
            yield buf.getvalue()
            buf.seek(0)
            buf.truncate(0)

    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
