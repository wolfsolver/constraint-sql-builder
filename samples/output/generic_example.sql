SELECT ROW_NUMBER() over( order by 1 ) as RowNum
  , 'SAMPLE_TABLE1_FIELD1 NOT_NULL' AS ID
  , 'E' AS SEVERITY
  , 'TABLE1' AS TABLE_NAME_VALUE
  , 'TABLE1PK' AS TABLE_PK_NAME
  , __LEFT_TABLE.TABLE1PK AS TABLE_PK_VALUE
  , 'FIELD1' AS TABLE_FIELD_NAME
  , __LEFT_TABLE.FIELD1 AS TABLE_FIELD_VALUE
  , null AS FIX
  , '$source.field of $source.table is null' AS MESSAGE
FROM TABLE1 AS __LEFT_TABLE

;
SELECT ROW_NUMBER() over( order by 1 ) as RowNum
  , 'SAMPLE_TABLE1_FIELD1 NOT_NULL with success' AS ID
  , 'E' AS SEVERITY
  , 'TABLE1' AS TABLE_NAME_VALUE
  , 'TABLE1PK' AS TABLE_PK_NAME
  , __LEFT_TABLE.TABLE1PK AS TABLE_PK_VALUE
  , 'FIELD1' AS TABLE_FIELD_NAME
  , __LEFT_TABLE.FIELD1 AS TABLE_FIELD_VALUE
  , null AS FIX
  , '$source.field of $source.table is null' AS MESSAGE
FROM TABLE1 AS __LEFT_TABLE

;
SELECT ROW_NUMBER() over( order by 1 ) as RowNum
  , 'SAMPLE_TABLE1_FIELD1 values check' AS ID
  , 'E' AS SEVERITY
  , 'TABLE1' AS TABLE_NAME_VALUE
  , 'TABLE1PK' AS TABLE_PK_NAME
  , __LEFT_TABLE.TABLE1PK AS TABLE_PK_VALUE
  , 'FIELD1' AS TABLE_FIELD_NAME
  , __LEFT_TABLE.FIELD1 AS TABLE_FIELD_VALUE
  , null AS FIX
  , '$source.field of $source.table is not in $check.value' AS MESSAGE
FROM TABLE1 AS __LEFT_TABLE
WHERE NOT ( ( __LEFT_TABLE.FIELD1 (valore1, valore2) ) )
;
SELECT ROW_NUMBER() over( order by 1 ) as RowNum
  , 'SAMPLE_TABLE1_FIELD1 values check between two field' AS ID
  , 'E' AS SEVERITY
  , 'TABLE1' AS TABLE_NAME_VALUE
  , 'TABLE1PK' AS TABLE_PK_NAME
  , __LEFT_TABLE.TABLE1PK AS TABLE_PK_VALUE
  , 'FIELD1' AS TABLE_FIELD_NAME
  , __LEFT_TABLE.FIELD1 AS TABLE_FIELD_VALUE
  , null AS FIX
  , '$source.field of $source.table is not correct' AS MESSAGE
FROM TABLE1 AS __LEFT_TABLE
WHERE NOT ( ( __LEFT_TABLE.FIELD1 = __LEFT_TABLE.FIELD2 * __LEFT_TABLE.FIELD3 ) )
;
SELECT ROW_NUMBER() over( order by 1 ) as RowNum
  , 'SAMPLE_TABLE1_FIELD1 values check between two field using on_success' AS ID
  , 'E' AS SEVERITY
  , 'TABLE1' AS TABLE_NAME_VALUE
  , 'TABLE1PK' AS TABLE_PK_NAME
  , __LEFT_TABLE.TABLE1PK AS TABLE_PK_VALUE
  , 'FIELD1' AS TABLE_FIELD_NAME
  , __LEFT_TABLE.FIELD1 AS TABLE_FIELD_VALUE
  , null AS FIX
  , '$source.field of $source.table is not correct' AS MESSAGE
FROM TABLE1 AS __LEFT_TABLE
WHERE ( __LEFT_TABLE.FIELD1 != __LEFT_TABLE.FIELD2 * __LEFT_TABLE.FIELD3 )
;
SELECT ROW_NUMBER() over( order by 1 ) as RowNum
  , 'SAMPLE_TABLE1_FIELD1 Simple FK on TABLE2 PK' AS ID
  , 'E' AS SEVERITY
  , 'TABLE1' AS TABLE_NAME_VALUE
  , 'TABLE1PK' AS TABLE_PK_NAME
  , __LEFT_TABLE.TABLE1PK AS TABLE_PK_VALUE
  , 'FIELD1' AS TABLE_FIELD_NAME
  , __LEFT_TABLE.FIELD1 AS TABLE_FIELD_VALUE
  , null AS FIX
  , '$source.field of $source.table is not in table $fk.table' AS MESSAGE
FROM TABLE1 AS __LEFT_TABLE
LEFT JOIN TABLE2 AS __RIGHT_TABLE ON __RIGHT_TABLE.TABLE2PK = __LEFT_TABLE.FIELD1
WHERE NOT ( ( __RIGHT_TABLE.TABLE2PK is null )  )
;
SELECT ROW_NUMBER() over( order by 1 ) as RowNum
  , 'SAMPLE_TABLE1_FIELD1 Simple FK on TABLE2 on different field' AS ID
  , 'E' AS SEVERITY
  , 'TABLE1' AS TABLE_NAME_VALUE
  , 'TABLE1PK' AS TABLE_PK_NAME
  , __LEFT_TABLE.TABLE1PK AS TABLE_PK_VALUE
  , 'FIELD1' AS TABLE_FIELD_NAME
  , __LEFT_TABLE.FIELD1 AS TABLE_FIELD_VALUE
  , null AS FIX
  , 'FIELD1 of TABLE1 is not in table TABLE2 by TABLE2PK' AS MESSAGE
FROM TABLE1 AS __LEFT_TABLE
LEFT JOIN TABLE2 AS __RIGHT_TABLE ON __RIGHT_TABLE.TABLE2PK = __LEFT_TABLE.FIELD1
WHERE ( __RIGHT_TABLE.TABLE2PK is null ) 
;
SELECT ROW_NUMBER() over( order by 1 ) as RowNum
  , 'SAMPLE_TABLE1_FIELD1 with FK checking two field correlation as message' AS ID
  , 'E' AS SEVERITY
  , 'TABLE1' AS TABLE_NAME_VALUE
  , 'TABLE1PK' AS TABLE_PK_NAME
  , __LEFT_TABLE.TABLE1PK AS TABLE_PK_VALUE
  , 'FIELD1' AS TABLE_FIELD_NAME
  , __LEFT_TABLE.FIELD1 AS TABLE_FIELD_VALUE
  , null AS FIX
  , '$source.field of $source.table cannot be before $fk.table.$fk.field' AS MESSAGE
FROM TABLE1 AS __LEFT_TABLE
LEFT JOIN TABLE2 AS __RIGHT_TABLE ON __RIGHT_TABLE.TABLE2PK = __LEFT_TABLE.FIELD1
WHERE ( __LEFT_TABLE.FIELD1 < __RIGHT_TABLE.TABLE2FIELD )
;
SELECT ROW_NUMBER() over( order by 1 ) as RowNum
  , 'SAMPLE_TABLE1_FIELD1 with FK checking two field correlation as message and fix' AS ID
  , 'E' AS SEVERITY
  , 'TABLE1' AS TABLE_NAME_VALUE
  , 'TABLE1PK' AS TABLE_PK_NAME
  , __LEFT_TABLE.TABLE1PK AS TABLE_PK_VALUE
  , 'FIELD1' AS TABLE_FIELD_NAME
  , __LEFT_TABLE.FIELD1 AS TABLE_FIELD_VALUE
  , null AS FIX
  , '$source.field of $source.table cannot be before $fk.table.$fk.field' AS MESSAGE
FROM TABLE1 AS __LEFT_TABLE
LEFT JOIN TABLE2 AS __RIGHT_TABLE ON __RIGHT_TABLE.TABLE2PK = __LEFT_TABLE.FIELD1
WHERE ( __LEFT_TABLE.FIELD1 < __RIGHT_TABLE.TABLE2FIELD )
;
SELECT ROW_NUMBER() over( order by 1 ) as RowNum
  , 'SAMPLE_TABLE1_FIELD1 NOT_NULL with simple fix update' AS ID
  , 'E' AS SEVERITY
  , 'TABLE1' AS TABLE_NAME_VALUE
  , 'TABLE1PK' AS TABLE_PK_NAME
  , __LEFT_TABLE.TABLE1PK AS TABLE_PK_VALUE
  , 'FIELD1' AS TABLE_FIELD_NAME
  , __LEFT_TABLE.FIELD1 AS TABLE_FIELD_VALUE
  , null AS FIX
  , '$source.field of $source.table is null' AS MESSAGE
FROM TABLE1 AS __LEFT_TABLE

;
SELECT ROW_NUMBER() over( order by 1 ) as RowNum
  , 'SAMPLE_TABLE1_FIELD1 NOT_NULL with simple fix DELETE' AS ID
  , 'E' AS SEVERITY
  , 'TABLE1' AS TABLE_NAME_VALUE
  , 'TABLE1PK' AS TABLE_PK_NAME
  , __LEFT_TABLE.TABLE1PK AS TABLE_PK_VALUE
  , 'FIELD1' AS TABLE_FIELD_NAME
  , __LEFT_TABLE.FIELD1 AS TABLE_FIELD_VALUE
  , null AS FIX
  , '$source.field of $source.table is null' AS MESSAGE
FROM TABLE1 AS __LEFT_TABLE

;
SELECT ROW_NUMBER() over( order by 1 ) as RowNum
  , 'SAMPLE_TABLE1_FIELD1 NOT_NULL with copmplex sql' AS ID
  , 'E' AS SEVERITY
  , 'TABLE1' AS TABLE_NAME_VALUE
  , 'TABLE1PK' AS TABLE_PK_NAME
  , __LEFT_TABLE.TABLE1PK AS TABLE_PK_VALUE
  , 'FIELD1' AS TABLE_FIELD_NAME
  , __LEFT_TABLE.FIELD1 AS TABLE_FIELD_VALUE
  , null AS FIX
  , '$source.field of $source.table is null' AS MESSAGE
FROM TABLE1 AS __LEFT_TABLE

;
SELECT ROW_NUMBER() over( order by 1 ) as RowNum
  , 'FREE FORM CHECK' AS ID
  , 'E' AS SEVERITY
  , 'TABLE1' AS TABLE_NAME_VALUE
  , 'TABLE1PK' AS TABLE_PK_NAME
  , __LEFT_TABLE.TABLE1PK AS TABLE_PK_VALUE
  , null AS TABLE_FIELD_NAME
  , null AS TABLE_FIELD_VALUE
  , null AS FIX
  , '$source.field of $source.table con condizioni custom' AS MESSAGE
FROM TABLE1 AS __LEFT_TABLE

;
SELECT ROW_NUMBER() over( order by 1 ) as RowNum
  , 'FREE FORM CHECK con FK' AS ID
  , 'E' AS SEVERITY
  , 'TABLE1' AS TABLE_NAME_VALUE
  , 'TABLE1PK' AS TABLE_PK_NAME
  , __LEFT_TABLE.TABLE1PK AS TABLE_PK_VALUE
  , 'FIELD1' AS TABLE_FIELD_NAME
  , __LEFT_TABLE.FIELD1 AS TABLE_FIELD_VALUE
  , null AS FIX
  , '$source.field of $source.table con condizioni custom' AS MESSAGE
FROM TABLE1 AS __LEFT_TABLE
LEFT JOIN TABLE2 AS __RIGHT_TABLE ON __RIGHT_TABLE.TABLE2PK = __LEFT_TABLE.FIELD1

;
