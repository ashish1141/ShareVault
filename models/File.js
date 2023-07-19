const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: String,
    originalName: String,
    filePath: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    shared: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    sharedLinkActive: {
      type: Boolean,
      default: false
    },
    token: {
      type: String,
      unique: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  });


const File = mongoose.model('File', fileSchema);

module.exports = File;
