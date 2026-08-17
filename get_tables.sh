#!/bin/bash
psql $DATABASE_URL -c "\dt public.*"
