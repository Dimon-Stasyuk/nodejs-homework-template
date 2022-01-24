const express = require("express");
const { User } = require("../../model");
const router = express.Router();
const path = require("path");
const { NotFound, BadRequest } = require("http-errors");
const fs = require("fs/promises");
const Jimp = require("jimp");
const { sendEmail } = require("../../helpers");
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

router.get("/verify/:verificationToken", async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });
    if (!user) {
      throw new NotFound("User not found");
    }
    await User.findByIdAndUpdate(user._id, {
      verificationToken: null,
      verify: true,
    });
    res.json({
      message: "Verification successful",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/varify", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new BadRequest("missing required field email");
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new NotFound("User not found");
    }
    if (user.verify) {
      throw new BadRequest("Verification has already been passed");
    }
    const { verificationToken } = user;
    const data = {
      to: "dimon.stasyuk@gmail.com",
      from: "dimon.stasyuk@gmail.com",
      subject: "Новая заявка с сайта",
      html: `<a target="_blank" href="https://sitename.com/users/verify/${verificationToken}">Подтвердиь email</a>`,
    };

    await sendEmail(data);

    res.json({ message: "Verification email sent" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
