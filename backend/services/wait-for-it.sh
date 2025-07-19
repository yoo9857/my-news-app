#!/usr/bin/env bash
#   Use this script to test if a given TCP host/port are available

echoerr() { echo "$@" 1>&2; }

WAITFORIT_cmdname=${0##*/}

WAITFORIT_timeout=15
WAITFORIT_quiet=0
WAITFORIT_child_pid=
WAITFORIT_host=
WAITFORIT_port=

usage() {
    cat << USAGE >&2
Usage:
    $WAITFORIT_cmdname host:port [-s] [-t timeout] [-- command args]
    -h HOST | --host=HOST       Host or IP under test
    -p PORT | --port=PORT       TCP port under test
                                Alternatively, you specify the host and port as host:port
    -s | --strict               Only execute subcommand if the test succeeds
    -q | --quiet                Don't output any status messages
    -t TIMEOUT | --timeout=TIMEOUT
                                Timeout in seconds, zero for no timeout
    -- COMMAND ARGS             Execute command with args after the test finishes
USAGE
    exit 1
}

wait_for() {
    if [[ $WAITFORIT_timeout -gt 0 ]]; then
        TIMEOUT_START=$(date +%s)
        while :; do
            (echo > /dev/tcp/$WAITFORIT_host/$WAITFORIT_port) >/dev/null 2>&1
            WAITFORIT_result=$?
            if [[ $WAITFORIT_result -eq 0 ]]; then
                break
            fi
            if [[ $(($(date +%s) - TIMEOUT_START)) -ge $WAITFORIT_timeout ]]; then
                WAITFORIT_result=1
                break
            fi
            sleep 1
        done
    else
        while ! (echo > /dev/tcp/$WAITFORIT_host/$WAITFORIT_port) >/dev/null 2>&1; do
            sleep 1
        done
    fi
    return $WAITFORIT_result
}

wait_for_wrapper() {
    # In order to support SIGINT during timeout, we need to wait for the wait_for() function to finish in a subshell
    # Otherwise, the SIGINT is not passed to the child process (timeout)
    (wait_for)
    WAITFORIT_result=$?
    if [[ $WAITFORIT_quiet -eq 0 ]]; then echo "$WAITFORIT_cmdname: $WAITFORIT_host:$WAITFORIT_port is available after `date +%s` seconds" ; fi
    return $WAITFORIT_result
}

# process arguments
while [[ $# -gt 0 ]]
do
    case "$1" in
        *:* )
        WAITFORIT_hostport=(${1//:/ })
        WAITFORIT_host=${WAITFORIT_hostport[0]}
        WAITFORIT_port=${WAITFORIT_hostport[1]}
        shift 1
        ;;
        --child)
        WAITFORIT_child=1
        shift 1
        ;;
        -q | --quiet)
        WAITFORIT_quiet=1
        shift 1
        ;;
        -s | --strict)
        WAITFORIT_strict=1
        shift 1
        ;;
        -h) 
        WAITFORIT_host="$2"
        if [[ $WAITFORIT_host == "" ]]; then break; fi
        shift 2
        ;;
        --host=*) 
        WAITFORIT_host="${1#*=}"
        shift 1
        ;;
        -p) 
        WAITFORIT_port="$2"
        if [[ $WAITFORIT_port == "" ]]; then break; fi
        shift 2
        ;;
        --port=*) 
        WAITFORIT_port="${1#*=}"
        shift 1
        ;;
        -t) 
        WAITFORIT_timeout="$2"
        if [[ $WAITFORIT_timeout == "" ]]; then break; fi
        shift 2
        ;;
        --timeout=*) 
        WAITFORIT_timeout="${1#*=}"
        shift 1
        ;;
        --)
        shift
        WAITFORIT_cmd=($@)
        break
        ;;
        --help)
        usage
        ;;
        *)
        echoerr "Unknown argument: $1"
        usage
        ;;
    esac
done

if [[ "$WAITFORIT_host" == "" || "$WAITFORIT_port" == "" ]]; then
    echoerr "Error: you need to provide a host and port to test."
    usage
fi

wait_for_wrapper
WAITFORIT_result=$?

if [[ $WAITFORIT_child -eq 1 ]]; then
    exit $WAITFORIT_result
fi

if [[ "${WAITFORIT_cmd[@]}" != "" ]]; then
    if [[ $WAITFORIT_result -ne 0 && $WAITFORIT_strict -eq 1 ]]; then
        echoerr "$WAITFORIT_cmdname: strict mode, refusing to execute subprocess"
        exit $WAITFORIT_result
    fi
    exec "${WAITFORIT_cmd[@]}"
else
    exit $WAITFORIT_result
fi
