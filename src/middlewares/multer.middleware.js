import multer from "multer";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // cb(null, file.fieldname + "-" + uniqueSuffix);
    // We can change the filename of the file uploaded by the user

    // Here, we r not changing it yet.
    cb(null, file.originalname); // originalname-> returns the original name of the uploaded by user
  },
});

export const upload = multer({ storage: storage });
