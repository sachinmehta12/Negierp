import { Request, Response } from 'express';
import { Testimonial } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class TestimonialController {
  static async publicList(_req: Request, res: Response): Promise<void> {
    try {
      const testimonials = await Testimonial.findAll({
        where: { isFeatured: true },
        order: [['id', 'DESC']]
      });

      res.json({ success: true, count: testimonials.length, testimonials });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch testimonials', error: err.message });
    }
  }

  static async list(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const testimonials = await Testimonial.findAll({
        order: [['id', 'DESC']]
      });

      res.json({ success: true, count: testimonials.length, testimonials });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch testimonials', error: err.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { studentName, scoreBadge, batchInfo, quote, isFeatured } = req.body;
      if (!studentName || !quote) {
        res.status(400).json({ success: false, message: 'Student name and quote/testimonial are required.' });
        return;
      }

      const item = await Testimonial.create({
        studentName: studentName.trim(),
        scoreBadge: scoreBadge ? scoreBadge.trim() : 'CBSE Excellence',
        batchInfo: batchInfo ? batchInfo.trim() : 'Alumni Batch',
        quote: quote.trim(),
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : true
      });

      res.status(201).json({ success: true, message: 'Student result and testimonial published successfully.', testimonial: item });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to create testimonial', error: err.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { studentName, scoreBadge, batchInfo, quote, isFeatured } = req.body;

      const target = await Testimonial.findByPk(id);
      if (!target) {
        res.status(404).json({ success: false, message: 'Testimonial not found.' });
        return;
      }

      const dataToUpdate: any = {};
      if (studentName) dataToUpdate.studentName = studentName.trim();
      if (scoreBadge !== undefined) dataToUpdate.scoreBadge = scoreBadge.trim();
      if (batchInfo !== undefined) dataToUpdate.batchInfo = batchInfo.trim();
      if (quote) dataToUpdate.quote = quote.trim();
      if (isFeatured !== undefined) dataToUpdate.isFeatured = Boolean(isFeatured);

      await target.update(dataToUpdate);

      res.json({ success: true, message: 'Testimonial updated successfully.', testimonial: target });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update testimonial', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const target = await Testimonial.findByPk(id);
      if (!target) {
        res.status(404).json({ success: false, message: 'Testimonial not found.' });
        return;
      }

      await target.destroy();

      res.json({ success: true, message: 'Testimonial deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete testimonial', error: err.message });
    }
  }
}
