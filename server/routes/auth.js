const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// SIGNUP
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = new User({
      username,
      password: await bcrypt.hash(password, 10),
    });

    await user.save();

    res.json({ message: "ok" });

  } catch (err) {
    res.status(400).json({ message: "signup error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) return res.status(400).json({ message: "no user" });

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) return res.status(400).json({ message: "wrong password" });

    const token = jwt.sign({ id: user._id }, "secret");

    res.json({ token });

  } catch (err) {
    res.status(500).json({ message: "login error" });
  }
});

module.exports = router;