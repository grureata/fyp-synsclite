
const { z } = require('zod');
const ApiResponse = require('../../utils/ApiResponse');
const { createContactMessage } = require('./contact.service');

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  subject: z.enum(['general', 'technical', 'privacy', 'partnership', 'feedback']),
  message: z.string().trim().min(10).max(2000),
});

async function createMessage(req, res, next) {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return ApiResponse.error(res, 400, 'Invalid contact form data.', parsed.error.issues);
    }

    const message = await createContactMessage({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
      status: 'NEW',
    });

    return ApiResponse.success(res, {
      id: message.id,
      status: message.status,
      createdAt: message.createdAt,
    }, 'Message received', 201);
  } catch (error) {
    return next(error);
  }
}

module.exports = { createMessage };
