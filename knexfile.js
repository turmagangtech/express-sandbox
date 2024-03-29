module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    }
  },

  staging: {
    client: 'sqlite3',
    connection: {
      filename: './staging.sqlite3'
    }
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: './prod.sqlite3'
    }
  }
};
