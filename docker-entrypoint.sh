#!/bin/sh
set -eu
# Required: CELLD_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.
# Optional: S3_ENDPOINT (e.g. R2 or MinIO), AWS_REGION.
: "${CELLD_BUCKET:?set CELLD_BUCKET, e.g. s3://my-bucket}"
ENDPOINT=${S3_ENDPOINT:+--endpoint "$S3_ENDPOINT"}
celld deploy . --bucket "$CELLD_BUCKET" $ENDPOINT --region "${AWS_REGION:-auto}"
exec celld --bucket "$CELLD_BUCKET" $ENDPOINT --region "${AWS_REGION:-auto}" \
  --listen 0.0.0.0:8080 --internal-listen 127.0.0.1:0
