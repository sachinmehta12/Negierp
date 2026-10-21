import { Response } from 'express';
import { InstituteSettings } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class SettingsController {
  static async getSettings(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      let settings = await InstituteSettings.findOne();
      if (!settings) {
        settings = await InstituteSettings.create({
          name: 'NEGI TUTORIALS',
          tagline: 'Learn • Grow • Succeed',
          phone: '+91 98765 43210',
          email: 'contact@negitutorials.com',
          address: 'Plot 12, Sector 4, Main Road, New Delhi, India'
        });
      }

      const raw = settings.get({ plain: true });
      const safeSettings = {
        ...raw,
        mailPassword: raw.mailPassword ? '••••••••' : ''
      };

      res.json({ success: true, settings: safeSettings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch settings', error: err.message });
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, tagline, phone, email, address, mailServer, mailPort, mailUsername, mailPassword } = req.body;

      let settings = await InstituteSettings.findOne();
      const dataToUpdate: any = {
        ...(name && { name: name.trim() }),
        ...(tagline && { tagline: tagline.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email && { email: email.trim().toLowerCase() }),
        ...(address && { address: address.trim() }),
        ...(mailServer && { mailServer: mailServer.trim() }),
        ...(mailPort && { mailPort: Number(mailPort) }),
        ...(mailUsername !== undefined && { mailUsername: mailUsername?.trim() || null })
      };

      if (mailPassword && mailPassword.trim() && mailPassword !== '••••••••') {
        dataToUpdate.mailPassword = mailPassword.trim();
      }

      if (settings) {
        await settings.update(dataToUpdate);
      } else {
        settings = await InstituteSettings.create(dataToUpdate);
      }

      res.json({ success: true, message: 'Institute settings updated successfully.', settings: settings.get({ plain: true }) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update settings', error: err.message });
    }
  }
}
