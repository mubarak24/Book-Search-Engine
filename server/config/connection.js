const mongoose = require('mongoose');
// connection string
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/book-search-engine');

module.exports = mongoose.connection;
