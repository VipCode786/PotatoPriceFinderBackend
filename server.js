const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const csv = require("csv-parser");

const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const PORT = 8000;
app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.get("/test", (req, res) => {
  console.log({ req });
  res.send("Hello world");
});

// const mergeChunks = async (fileName, totalChunks) => {
//   const chunkDir = __dirname + "/chunks";
//   const mergedFilePath = __dirname + "/merged_files";

//   if (!fs.existsSync(mergedFilePath)) {
//     fs.mkdirSync(mergedFilePath);
//   }

//   const writeStream = fs.createWriteStream(`${mergedFilePath}/${fileName}`);
//   for (let i = 0; i < totalChunks; i++) {
//     const chunkFilePath = `${chunkDir}/${fileName}.part_${i}`;
//     const chunkBuffer = await fs.promises.readFile(chunkFilePath);
//     writeStream.write(chunkBuffer);
//     // fs.unlinkSync(chunkFilePath); // Delete the individual chunk file after merging
//   }

//   writeStream.end();
//   console.log("Chunks merged successfully");
// };

// app.post("/upload", upload.single("file"), async (req, res) => {
//   console.log("Hit");
//   const chunk = req.file.buffer;
//   const chunkNumber = Number(req.body.chunkNumber); // Sent from the client
//   const totalChunks = Number(req.body.totalChunks); // Sent from the client
//   const fileName = req.body.originalname;

//   const chunkDir = __dirname + "/chunks"; // Directory to save chunks

//   if (!fs.existsSync(chunkDir)) {
//     fs.mkdirSync(chunkDir);
//   }

//   const chunkFilePath = `${chunkDir}/${fileName}.part_${chunkNumber}`;

//   try {
//     await fs.promises.writeFile(chunkFilePath, chunk);
//     console.log(`Chunk ${chunkNumber}/${totalChunks} saved`);

//     if (chunkNumber === totalChunks - 1) {
//       // If this is the last chunk, merge all chunks into a single file
//       await mergeChunks(fileName, totalChunks);
//       console.log("File merged successfully");
//     }

//     res.status(200).json({ message: "Chunk uploaded successfully" });
//   } catch (error) {
//     console.error("Error saving chunk:", error);
//     res.status(500).json({ error: "Error saving chunk" });
//   }
// });

const processCSV = async (fileName, pounds,res) => {
    const filePath = __dirname + "/merged_files/" + fileName;
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        console.log("pounds",pounds)
        const poundsAvailable = pounds;

      const filteredResults = results.filter(
        (supplier) => parseInt(supplier["unit quanitiy"]) >= poundsAvailable
      );

      filteredResults.sort((a, b) => {
        const pricePerPoundA = parseFloat(a["unit price"]) / parseInt(a["unit weight"]);
        const pricePerPoundB = parseFloat(b["unit price"]) / parseInt(b["unit weight"]);
        return pricePerPoundA - pricePerPoundB;
      });

      const cheapestSellers = filteredResults.slice(0, 3);

      if (cheapestSellers.length > 0) {
        res.status(200).json(cheapestSellers);
      } else {
        res.status(200).json({ message: "Cheapest sellers not available for the given pounds" });
      }
    //   res.status(200).json(cheapestSellers);
        // Process the CSV data here
        // For simplicity, let's just send back the entire data for now
        // res.status(200).json(results);
      });

 // Clean up: Delete the uploaded file
 fs.unlinkSync(filePath);
      
  };
  

  const mergeChunks = async (fileName, totalChunks) => {
  const chunkDir = __dirname + "/chunks";
  const mergedFilePath = __dirname + "/merged_files";

  if (!fs.existsSync(mergedFilePath)) {
    fs.mkdirSync(mergedFilePath);
  }

 
  
  const writeStream = fs.createWriteStream(`${mergedFilePath}/${fileName}`);
  for (let i = 1; i < totalChunks+1; i++) {
    const chunkFilePath = `${chunkDir}/${fileName}.part_${i}`;
    const chunkBuffer = await fs.promises.readFile(chunkFilePath);
    writeStream.write(chunkBuffer);
    fs.unlinkSync(chunkFilePath); // Delete the individual chunk file after merging
  }

  writeStream.end();
  console.log("Chunks merged successfully");
  // await  processCSV(fileName, pounds,res);
};


  
  app.post("/upload", upload.single("file"), async (req, res) => {
    console.log("Hit");
    const chunk = req.file.buffer;
    const chunkNumber = Number(req.body.chunkNumber); // Sent from the client
    const totalChunks = Number(req.body.totalChunks); // Sent from the client
    const fileName = req.body.originalname;
    const pounds = req.body.poundsAvailable;
    const chunkDir = __dirname + "/chunks"; // Directory to save chunks
  
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir);
    }
  
    const chunkFilePath = `${chunkDir}/${fileName}.part_${chunkNumber}`;
  
    try {
      // Check if the chunk file already exists
      if (!fs.existsSync(chunkFilePath)) {
        await fs.promises.writeFile(chunkFilePath, chunk);
        console.log(`Chunk ${chunkNumber}/${totalChunks} saved`);
  
        if (chunkNumber === totalChunks) {
          // If this is the last chunk, merge all chunks into a single file
          await mergeChunks(fileName, totalChunks);
          console.log("File merged successfully");
           // Now that the file is uploaded and merged, process the CSV data
        await processCSV(fileName, pounds, res);
        return; // Return to avoid sending multiple responses
        }
      } else {
        console.log(`Chunk ${chunkNumber}/${totalChunks} already exists`);
      }

      
      // // await  processCSV(fileName, pounds,res);
      res.status(200).json({ message: "Chunk uploaded successfully" });
    } catch (error) {
      console.error("Error saving chunk:", error);
      res.status(500).json({ error: "Error saving chunk" });
    }
  });

  

app.listen(PORT, () => {
  console.log(`Port listening on ${PORT}`);
});