
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const { z } = require('zod');
const db = require('../../config/db');

const documentSchema = z.object({
  title: z.string().trim().min(2).max(200),
  sections: z.array(z.object({
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(10000),
  }).strict()).min(1).max(100),
  effectiveDate: z.coerce.date(),
}).strict();

async function getLegalDocument(req, res, next) {
  try {
    const document = await db.legalDocument.findUnique({ where: { slug: req.params.slug } });
    if (!document) throw new ApiError(404, 'Legal document not found.');
    return ApiResponse.success(res, document, 'Legal document retrieved.');
  } catch (error) {
    return next(error);
  }
}

async function updateLegalDocument(req, res, next) {
  try {
    const parsed = documentSchema.safeParse(req.body);
    if (!parsed.success) {
      return ApiResponse.error(res, 400, 'Invalid legal document.', parsed.error.issues);
    }

    const document = await db.legalDocument.upsert({
      where: { slug: req.params.slug },
      create: { ...parsed.data, slug: req.params.slug, lastUpdated: new Date() },
      update: { ...parsed.data, lastUpdated: new Date() },
    });
    return ApiResponse.success(res, document, 'Legal document updated.');
  } catch (error) {
    return next(error);
  }
}

module.exports = { getLegalDocument, updateLegalDocument };
