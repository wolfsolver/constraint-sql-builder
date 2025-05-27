#!/usr/bin/env bash

for fileName in test*.yaml
do
  echo "Testing: " ${fileName%.*}
  echo " source: " ${fileName%.*}.yaml
  echo "   dest: " ${fileName%.*}.sql
  echo " generate tmp file"
  node ../src/constraint-sql-builder-cli.js ../test/${fileName%.*}.yaml ../test/tmp_out
  if [ $? -eq 0 ];
  then
    sdiff -W ${fileName%.*}.sql tmp_out
    if [ $? -eq 0 ];
    then
      echo "test: ok"
    else
      exit 1
    fi
  else
    exit 1
  fi
done
