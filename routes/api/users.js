const express = require("express");
const { User } = require("../../model");
const router = express.Router();
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
const { authenticate, upload } = require("../../midlwares");

router.get("/current", authenticate, async (req, res, next) => {
  const { email, subscription } = req.user;
  res.json({
    user: {
      email,
      subscription,
    },
  });
});

router.get("/logout", authenticate, async (req, res, next) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });
  res.status(204).send();
});

const avatarsDir = path.join(__dirname, "../../", "public", "avatars");

router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  async (req, res) => {
    const { path: tempUpload, filename } = req.file;
    const [extention] = filename.split(".").reverse();

    const newFileName = `${req.user._id}.${extention}`;
    const fileUpload = path.join(avatarsDir, newFileName);
    const tempDir = path.join(__dirname, "../../", "tmp", filename);

    Jimp.read(tempDir, (err, avatar) => {
      if (err) throw err;
      avatar
        .resize(250, 250) // resize
        .write(fileUpload); // save
    });

    fs.rename(tempUpload, fileUpload);
    const avatarURL = path.join("avatars", newFileName);
    await User.findByIdAndUpdate(req.user._id, { avatarURL }, { new: true });
    res.json({ avatarURL });
  },
);

module.exports = router;
