#!/bin/bash

set -o allexport
source .env
set +o allexport

LOCALTUNNEL_COMMAND="lt --port $PORT"

echo $LOCALTUNNEL_COMMAND

$LOCALTUNNEL_COMMAND
