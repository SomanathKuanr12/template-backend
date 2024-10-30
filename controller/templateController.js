// controllers/fileController.js
const con=require('../config')
const path = require('path');

// Function to handle file upload
const uploadFile = (req, res) => {
    const newFile = {
        filename: req.file.originalname,
        filepath: req.file.path,
    };

    const sql = 'INSERT INTO files (filename, filepath) VALUES (?, ?)';
    con.query(sql, [newFile.filename, newFile.filepath], (err, result) => {
        if (err) return res.status(500).json({ error: 'File upload failed' });
        res.json({ message: 'File uploaded successfully', file: newFile });
    });
};

// Function to get all files
const getFiles = (req, res) => {
    const sql = 'SELECT * FROM files';
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to retrieve files' });
        res.json(results);
    });
};

module.exports = {
    uploadFile,
    getFiles,
};
