CREATE EXTERNAL TABLE IF NOT EXISTS netflix_titles (
    show_id STRING,
    type STRING,
    title STRING,
    director STRING,
    cast STRING,
    country STRING,
    date_added STRING,
    release_year INT,
    rating STRING,
    duration STRING,
    listed_in STRING,
    description STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
TBLPROPERTIES ("skip.header.line.count"="1");