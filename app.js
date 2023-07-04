const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');

//////////////////////for upload and download/////////////////////////
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const File = require("./models/File");
const User = require("./models/User");
/////////////////////////////////////////////////////////////////////

const app = express();

// middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

// view engine
app.set('view engine', 'ejs');

// database connection
async function main(){
await mongoose.connect("mongodb://127.0.0.1:27017/fileTransfer")
  .then((result) => app.listen(3000,()=>{console.log("server started at port 3000")}))
  .catch((err) => console.log(err));
}

main();

// routes
app.get('*', checkUser);
app.get('/', (req, res) => res.render('home'));

app.use(authRoutes);














///////////////////////////////////////////////////////////////////////////////////////////////////////////////


//Note:  can access userId by -> req.userId <- if add middleware -> checkUser <-
// my uploads rendering page
app.get('/myuploads', requireAuth, checkUser, async (req,res) => {
  const userFiles = await File.find({userId: req.userId});
  // console.log(userFiles);
  res.render('myuploads',{userFiles});
});


app.get("/upload",requireAuth,(req,res)=>{
  res.render("upload");
});



// Set up storage for uploaded files
const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    const userId = req.userId;

    const userFolderPath = path.join('uploads', userId.toString());  // Create a folder based on user ID

    fs.mkdirSync(userFolderPath, { recursive: true });               // Create the user folder if it doesn't exist
    
    cb(null, userFolderPath);
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }

});


// Create the Multer instance
const upload = multer({ storage: storage });


app.post('/upload',requireAuth , checkUser, upload.single('file'), async (req, res) => {
  try {
    const file = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      userId: req.userId
    });

    await file.save();

    res.redirect("/myuploads");
    // res.send('File uploaded');
  } catch (error) {
    console.error('Error uploading file', error);
    res.status(500).send('Error uploading file');
  }
});


//  download route
app.get('/download',checkUser,  async (req, res) => {

  try {
    const file = await File.findOne({ _id: req.query.fileId, userId: req.userId });
    
    if (!file) {
      return res.status(404).send('File not found');
    }

    const filePath = path.join(__dirname, file.filePath);

    // console.log(filePath);

    res.download(filePath,file.originalName);

  } catch (error) {
    console.error('Error downloading file', error);
    res.status(500).send('Error downloading file');
  }
});


//  rename route
app.get("/rename",checkUser, async (req, res) => {
  try{
    const file = await File.findOneAndUpdate({_id : req.query.fileId, userId: req.userId},{originalName : req.query.newName});

    if(!file){
      return res.status(404).send("File not Found");
    }
    res.redirect("/myuploads");
  } catch (error) {
    console.error('Error renaming file',error);
    res.status(500).send('Error renameing file');
  }
});




app.get('/delete',checkUser, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.query.fileId }).populate('userId');

    if (!file) {
      return res.status(404).send('File not found');
    }

    // Check if the requesting user is the owner of the file
    if (file.userId._id.toString() !== req.userId.toString()) {
      return res.status(403).send('You do not have permission to delete this file');
    }

    // Delete the file from the database
    await File.deleteOne({_id : req.query.fileId});

    // Delete the file from the filesystem
    const filePath = path.join(__dirname, file.filePath);
    fs.unlinkSync(filePath);

    res.redirect("/myuploads");

  } catch (error) {
    console.error('Error deleting file', error);
    res.status(500).send('Error deleting file');
  }
});


// POST route to add users to the sharedWith array
app.post("/share/:fileId", async (req, res) => {
  try {
    
    const fileId = req.params.fileId;
    const { userEmails } = req.body;

    
    // Find the file by ID
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).send('File not found');
    }

    // Find the users by email addresses
    const users = await User.find({ email: { $in: userEmails } });

    if (!users || users.length === 0) {
      return res.status(404).send('No users found with the provided email addresses');
    }

    // Add the user IDs to the sharedWith array
    file.sharedWith.push(...users.map(user => user._id));
    file.shared = true;
    await file.save();

    res.send('Users added to the sharedWith array successfully');
  } catch (error) {
    console.error('Error sharing file:', error);
    res.status(500).send('Error sharing file');
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////


// shared get route shows the files shared with user

app.get("/shared",requireAuth,checkUser, async (req,res) =>{
  
});