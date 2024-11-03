const fs = require('fs');
const pdf = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');
const mammoth = require('mammoth');

function extractPlaceholdersFromText(text) {
    const regex = /{{(.*?)}}/g; // Regex to find {{placeholder}}
    const placeholders = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        placeholders.push(match[0]); // Add the full match (including the curly braces)
    }
    return placeholders;
}

async function extractFromPdf(filePath) {
    try {
        const pdfBytes = await fs.promises.readFile(filePath);
        console.log(`PDF bytes length: ${pdfBytes.length}`); // Log length of bytes

        const data = await pdf(pdfBytes);
        const text = data.text;
        console.log('Extracted Text:', text); // Log the extracted text

        return extractPlaceholdersFromText(text);
    } catch (error) {
        console.error('Error parsing PDF:', error);
    }
}

async function extractFromDocx(filePath) {
    const { value: text } = await mammoth.extractRawText({ path: filePath });
    return extractPlaceholdersFromText(text);
}

async function extractPlaceholders(req, res) {
    const filePath = req.body.fp;
    
    
    if (!filePath) {
        return res.status(400).json({ error: 'Template ID is required' });
    }
    try {
        const ext = filePath.split('.').pop().toLowerCase();
        let placeholders;
       
        
        if (ext === 'pdf') {
            placeholders = await extractFromPdf(filePath);
        } else if (ext === 'docx') {
            placeholders = await extractFromDocx(filePath);
        } else {
            return res.status(400).json({ error: 'Unsupported file type. Only PDF and DOCX are supported.' });
        }
        console.log(placeholders);
        
        return res.json({ placeholders });
    } catch (error) {
        return res.status(503).json({ error: error.message });
    }
}

module.exports = {
    extractPlaceholders,
};