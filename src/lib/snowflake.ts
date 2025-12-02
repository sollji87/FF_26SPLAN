import snowflake from 'snowflake-sdk';

export interface SnowflakeConfig {
  account: string;
  username: string;
  password: string;
  warehouse: string;
  database: string;
  schema: string;
  role?: string;
}

export const getSnowflakeConnection = () => {
  const config: SnowflakeConfig = {
    account: process.env.SNOWFLAKE_ACCOUNT || '',
    username: process.env.SNOWFLAKE_USERNAME || '',
    password: process.env.SNOWFLAKE_PASSWORD || '',
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || '',
    database: process.env.SNOWFLAKE_DATABASE || '',
    schema: process.env.SNOWFLAKE_SCHEMA || '',
    role: process.env.SNOWFLAKE_ROLE,
  };

  return snowflake.createConnection(config);
};

export const executeQuery = <T = any>(
  query: string,
  binds?: any[]
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const connection = getSnowflakeConnection();

    connection.connect((err, conn) => {
      if (err) {
        console.error('Unable to connect to Snowflake:', err);
        reject(err);
        return;
      }

      conn.execute({
        sqlText: query,
        binds: binds,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Failed to execute statement:', err);
            reject(err);
          } else {
            resolve(rows as T[]);
          }

          connection.destroy((err) => {
            if (err) {
              console.error('Unable to disconnect from Snowflake:', err);
            }
          });
        },
      });
    });
  });
};

