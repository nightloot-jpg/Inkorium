#!/bin/bash
set -e
npm run build
npx tsc --noEmit
