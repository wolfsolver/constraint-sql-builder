#!/usr/bin/env bash

# setup db
sqlite3 test.db -cmd ".read test.db.sql" .exit

for fileName in test*.yaml
do
  echo "Testing: " ${fileName%.*}
  echo " source: " ${fileName%.*}.yaml
  echo "   dest: " ${fileName%.*}.sql
  node ../src/constraint-sql-builder-cli.js ../test/${fileName%.*}.yaml ../test/tmp_out
  if [ $? -eq 0 ];
  then
    diff -w ${fileName%.*}.sql tmp_out
#    sdiff -W ${fileName%.*}.sql tmp_out
    if [ $? -eq 0 ];
    then
      echo "test: ok"
      echo "SQL RESULT"
      sqlite3 test.db -cmd ".read tmp_out" .exit
      echo "-----"
    else
      echo "SQL RESULT"
      sqlite3 test.db -cmd ".read tmp_out" .exit
      echo "-----"
      exit 1
    fi
  else
    exit 1
  fi
done
