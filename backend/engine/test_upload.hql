CREATE EXTERNAL TABLE IF NOT EXISTS test_upload (
    customer_id INT,
    credit_score INT,
    country STRING,
    gender STRING,
    age INT,
    tenure INT,
    balance FLOAT,
    products_number INT,
    credit_card INT,
    active_member INT,
    estimated_salary FLOAT,
    churn INT
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
TBLPROPERTIES ("skip.header.line.count"="1");