#!/usr/bin/env bash
# Stages the files the browser needs into dist/ (no tests, tooling or screenshots).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

rm -rf dist
mkdir -p dist/images
cp index.html script.js style.css dist/
cp images/favicon.ico dist/images/
find src -name '*.js' ! -name '*.test.js' -exec cp --parents {} dist/ \;

echo "Built dist/ ($(find dist -type f | wc -l) files)"
