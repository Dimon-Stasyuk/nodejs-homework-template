const express = require("express");
const { BadRequest, Conflict, Unauthorized } = require("http-errors");
const bcrypt = require("bcryptjs");
const { User } = require("../../model");
const { joiSchema } = require("../../model/user");
const jwt = require("jsonwebtoken");

const router = express.Router();
const { SECRET_KEY } = process.env;

router.post("/signup", async (req, resp, next) => {
  try {
    const { error } = joiSchema.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw new Conflict("User already exist");
    }
    const salt = await bcrypt.genSalt(10);

    const hashPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({ email, password: hashPassword });
    resp.status(201).json({
      user: {
        email: newUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { error } = joiSchema.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw Unauthorized("Email or password is wrong");
    }
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      throw Unauthorized("Email or password is wrong");
    }
    const { _id } = user;
    const payload = {
      id: _id,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
    await User.findByIdAndUpdate(_id, { token });

    res.json({
      token,
      user: {
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;