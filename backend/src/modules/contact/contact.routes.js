
const express = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../../utils/asyncHandler');
const { createMessage } = require('./contact.controller');

const router = express.Router();
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many contact messages. Please try again later.' },
});

router.post('/', contactLimiter, asyncHandler(createMessage));

module.exports = router;
