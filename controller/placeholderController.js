const fs = require('fs');
const con=require('../config')
const pdf = require('pdf-parse');
const { PDFDocument,rgb } = require('pdf-lib');
const mammoth = require('mammoth');
const path = require('path');

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
        //console.log(`PDF bytes length: ${pdfBytes.length}`); // Log length of bytes

        const data = await pdf(pdfBytes);
       // console.log(data);
        
        const text = data.text;
        //console.log('Extracted Text:', text); // Log the extracted text

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
    console.log(filePath);
    
    
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



// async function replacePlaceholders(req, res) {
//     const filePath = "C:\\Users\\TEMP\\Desktop\\template generator\\template-backend\\router\\uploads\\1730989161175-Rent Agreement Example Template.pdf";
//     const placeholdersWithValues = req.body.placeholder; // e.g., { name: 'John Doe', price: '1000' }
//     console.log(placeholdersWithValues);

//     try {
//         const pdfBytes = await fs.promises.readFile(filePath);
//         const pdfDoc = await PDFDocument.load(pdfBytes);
//         const pages = pdfDoc.getPages();

//         // Extract text to locate placeholders (if needed for positioning)
//         const data = await pdf(pdfBytes);
//         let text = data.text;

//         // Replace placeholders in text
//         Object.entries(placeholdersWithValues).forEach(([key, value]) => {
//             const placeholder = `{{${key}}}`;
//             text = text.replace(new RegExp(placeholder, 'g'), value);
//         });

//         // Draw text on each page based on updated content
//         pages.forEach((page) => {
//             page.drawText(text, {
//                 x: 50, // Set x position
//                 y: 500, // Set y position
//                 size: 12,
//                 color: rgb(0, 0, 0),
//             });
//         });

//         const modifiedPdfBytes = await pdfDoc.save();

//         // Get filename from the original file path and prepend with 'modified_'
//         const fileName = path.basename(filePath);
//         const outputPath = path.join(path.dirname(filePath), `modified_${fileName}`);
//         await fs.promises.writeFile(outputPath, modifiedPdfBytes);

//         return res.json({ message: 'Placeholders replaced successfully', outputPath });
//     } catch (error) {
//         console.error('Error replacing placeholders:', error);
//         return res.status(503).json({ error: 'Failed to replace placeholders in PDF' });
//     }
// }

// async function replacePlaceholders(req, res) {
//     const filePath = "C:\\Users\\TEMP\\Desktop\\template generator\\template-backend\\router\\uploads\\1730989161175-Rent Agreement Example Template.pdf";
//     const placeholdersWithValues = req.body.placeholder; // e.g., { name: 'John Doe', price: '1000' }
//     console.log(placeholdersWithValues);

//     try {
//         const pdfBytes = await fs.promises.readFile(filePath);
//         const data = await pdf(pdfBytes);
//         let text = data.text;

//         // Replace placeholders in the extracted text
//         Object.entries(placeholdersWithValues).forEach(([key, value]) => {
//             const placeholder = `{{${key}}}`;
//             text = text.replace(new RegExp(placeholder, 'g'), value);
//         });

//         // Create a new PDF document with a blank page
//         const newPdfDoc = await PDFDocument.create();
//         const page = newPdfDoc.addPage([595, 842]); // Standard A4 size

//         // Write the modified text onto the new blank page
//         page.drawText(text, {
//             x: 50, // X position for the text
//             y: 750, // Y position for the text (start near top)
//             size: 12,
//             color: rgb(0, 0, 0),
//             maxWidth: 500, // Optional: Set maximum width to wrap text within the page
//         });

//         const modifiedPdfBytes = await newPdfDoc.save();

//         // Save the new PDF with a modified filename
//         const fileName = path.basename(filePath);
//         const outputPath = path.join(path.dirname(filePath), `new_modified_${fileName}`);
//         await fs.promises.writeFile(outputPath, modifiedPdfBytes);

//         return res.json({ message: 'Placeholders replaced successfully', outputPath });
//     } catch (error) {
//         console.error('Error replacing placeholders:', error);
//         return res.status(503).json({ error: 'Failed to replace placeholders in PDF' });
//     }
// }



async function replacePlaceholders(req, res) {
    const filePath = req.body.fp;
    const userid = req.body.userid;
    const placeholdersWithValues = req.body.placeholder; // e.g., { name: 'John Doe', price: '1000' }
    console.log(placeholdersWithValues);

    try {
        const pdfBytes = await fs.promises.readFile(filePath);
        const data = await pdf(pdfBytes);
        let text = data.text;

        // Replace placeholders with values, adding a space before and after if not already present
        Object.entries(placeholdersWithValues).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            const regex = new RegExp(`(${placeholder})(?!\\s)`, 'g');
            text = text.replace(regex, ` ${value} `); // Add a trailing space to prevent concatenation
        });

        // Create a new PDF document with a blank page
        const newPdfDoc = await PDFDocument.create();
        const page = newPdfDoc.addPage([595, 842]); // Standard A4 size

        // Split text into lines to ensure it fits on the page and avoids word overlap
        const lines = text.match(/(.{1,90})(\s|$)/g) || []; // Wrap text every 90 characters or at whitespace
        let yPosition = 750; // Starting Y position near the top of the page

        // Draw each line on the page with proper spacing
        lines.forEach((line) => {
            page.drawText(line.trim(), {
                x: 50,  // X position for the text
                y: yPosition,
                size: 12,
                color: rgb(0, 0, 0),
            });
            yPosition -= 15; // Move Y position down for each line
        });

        const modifiedPdfBytes = await newPdfDoc.save();

        // Save the new PDF with a modified filename
        const fileName = path.basename(filePath);
        const outputPath = path.join(path.dirname(filePath), `modified_${fileName}`);
        await fs.promises.writeFile(outputPath, modifiedPdfBytes);

        // Construct the URL path
        const urlPath = `http://localhost:4700/${outputPath.substring(outputPath.indexOf('uploads')).replace(/\\/g, '/')}`;
        const uploadsFolder = 'router\\uploads';

// Extract the relative path from the `uploads` directory onward
const filename = path.relative(uploadsFolder, outputPath);

        // Prepare the insert query and use a promise to handle the result
        const insertQuery = 'INSERT INTO document_info (user_id,filename,filepath, urlpath) VALUES (?,?, ?, ?)';
        const values = [userid,filename, outputPath, urlPath];

        // Create a promise-based wrapper for the MySQL query
        const insertQueryPromise = new Promise((resolve, reject) => {
            con.query(insertQuery, values, (err, results) => {
                if (err) {
                    reject('Error inserting into document_info table: ' + err);
                } else {
                    resolve(results);
                }
            });
        });

        // Wait for the query to finish before sending the response
        await insertQueryPromise;

        // Respond with the URL after the DB operation has been completed
        console.log(urlPath);
        return res.json({
            message: 'Placeholders replaced successfully',
            urlpath: urlPath
        });

    } catch (error) {
        console.error('Error replacing placeholders:', error);
        return res.status(503).json({ error: 'Failed to replace placeholders in PDF' });
    }
}


// async function replacePlaceholders(req, res) {
//     const filePath = "C:\\Users\\TEMP\\Desktop\\template generator\\template-backend\\router\\uploads\\1730989161175-Rent Agreement Example Template.pdf";
//     const placeholdersWithValues = req.body.placeholder; // e.g., { name: 'John Doe', price: '1000' }
//     console.log(placeholdersWithValues);

//     try {
//         const pdfBytes = await fs.promises.readFile(filePath);
//         const pdfDoc = await PDFDocument.load(pdfBytes);

//         // Define the fixed coordinates for each placeholder
//         const placeholderPositions = {
//             name: { page: 0, x: 100, y: 700 },
//             price: { page: 0, x: 100, y: 650 },
//             agreementDate: { page: 0, x: 100, y: 600 },
//             // Add more placeholders as needed
//         };

//         // Replace each placeholder with the corresponding value at specified coordinates
//         Object.entries(placeholdersWithValues).forEach(([key, value]) => {
//             const position = placeholderPositions[key];
//             if (position) {
//                 const page = pdfDoc.getPages()[position.page];
//                 page.drawText(value, {
//                     x: position.x,
//                     y: position.y,
//                     size: 12,
//                     color: rgb(0, 0, 0),
//                 });
//             }
//         });

//         const modifiedPdfBytes = await pdfDoc.save();

//         // Save the new PDF with a modified filename
//         const fileName = path.basename(filePath);
//         const outputPath = path.join(path.dirname(filePath), `new_modified_${fileName}`);
//         await fs.promises.writeFile(outputPath, modifiedPdfBytes);

//         return res.json({ message: 'Placeholders replaced successfully', outputPath });
//     } catch (error) {
//         console.error('Error replacing placeholders:', error);
//         return res.status(503).json({ error: 'Failed to replace placeholders in PDF' });
//     }
// }






module.exports = {
    extractPlaceholders,
    replacePlaceholders,
};