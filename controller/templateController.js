// controllers/fileController.js
const con=require('../config')
const path = require('path');

// Function to handle file upload
const uploadFile = (req, res) => {
    const userid = req.params.id;
    console.log("upload called");
    console.log(userid);

    const localPath = req.file.path;

    // Convert backslashes to forward slashes and build the URL path
    const urlPath = `http://localhost:4700/${localPath.substring(localPath.indexOf('uploads')).replace(/\\/g, '/')}`;

    const newFile = {
        filename: req.file.originalname,
        filepath: localPath,  // Set filepath as URL with forward slashes
        urlPath:urlPath
    };

    // Insert into database with URL path
    const sql = 'INSERT INTO templates (userid, filename, filepath,urlpath) VALUES (?, ?,?, ?)';
    con.query(sql, [userid, newFile.filename, newFile.filepath,newFile.urlPath], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'File upload failed' });
        }
        res.json({ message: 'File uploaded successfully', file: newFile });
    });
};



// Function to get all files
const getFiles = (req, res) => {
    const userId = req.params.id;
    const search = req.query.searchTerm || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    console.log(userId);
    
    const sql = `
      SELECT * FROM templates
      WHERE userid = ? AND filename LIKE ?
      LIMIT ? OFFSET ?
    `;
    
    con.query(sql, [userId, `%${search}%`, limit, offset], (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to retrieve files' });
      
      // Get total count for pagination
      const countSql = 'SELECT COUNT(*) AS total FROM templates WHERE userid = ? AND filename LIKE ?';
      con.query(countSql, [userId, `%${search}%`], (countErr, countResults) => {
        if (countErr) return res.status(500).json({ error: 'Failed to retrieve file count' });
        console.log(results);
        
        const total = countResults[0].total;
        res.json({ data: results, totalPages:total });
      });
    });
  };
  

module.exports = {
    uploadFile,
    getFiles,
};
