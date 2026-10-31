#!/bin/sh
# Fails if anything private would go public, or the build reaches for an external host.
set -e
cd "$(dirname "$0")/.."
status=0
SIGNATURE="Lu Hu""a Ping"
EMAIL_USER="hsiliang""2020"
if git ls-files | grep -q '^Roles/'; then echo "FAIL: Roles originals are tracked"; status=1; fi
for term in "$SIGNATURE" "$EMAIL_USER"; do
  if git grep -nIi "$term" -- . >/dev/null; then echo "FAIL: found private term"; git grep -nIil "$term" -- .; status=1; fi
done
if [ -d dist ]; then
  if grep -rnoE "https?://[^\"' )]+" dist --include=*.html --include=*.js --include=*.css | grep -v "www.w3.org" | grep -q .; then
    echo "FAIL: external URL in build"; grep -rnoE "https?://[^\"' )]+" dist --include=*.html --include=*.js --include=*.css | grep -v "www.w3.org"; status=1
  fi
fi
[ $status -eq 0 ] && echo "privacy scan clean"
exit $status
