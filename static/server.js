const express = require('express');
const fileUpload = require('express-fileupload');
const ImageKit = require('imagekit');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '/')));

// Middleware for handling file uploads
app.use(fileUpload());

// ImageKit configuration
const imagekit = new ImageKit({
  publicKey: "public_ARts5MML/ERiyKDEUtgXx1VzUSI=",
  privateKey: "private_ZMB1vkeatCK90ZLk46RczGA306s=",
  urlEndpoint: "https://ik.imagekit.io/AjsalSparky/"
});

// API endpoint for image upload
app.post('/upload', (req, res) => {
  if (!req.files || !req.files.image) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const file = req.files.image;
  imagekit.upload(
    {
      file: file.data, // Pass the file buffer
      fileName: file.name
    },
    (error, result) => {
      if (error) {
        console.error('Upload Error:', error);
        return res.status(500).json({ error: 'Upload failed' });
      }
      res.json({ url: result.url });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
