import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { MailService } from '../mail/mail.service';
import { OtpPurpose } from './otp.entity';

jest.mock('nodemailer', () => ({
  createTransport: () => ({ sendMail: jest.fn().mockResolvedValue(undefined) }),
}));

describe('OtpService.generate localization', () => {
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'otp.secret') return 'secret';
      if (key === 'otp.expiry') return 300;
      return undefined;
    }),
  } as unknown as ConfigService;

  function buildService(mailService: MailService) {
    const otpRepo = {
      delete: jest.fn(),
      create: jest.fn((v) => v),
      save: jest.fn(),
    } as any;
    return new OtpService(otpRepo, config, mailService);
  }

  it('renders the French template and subject when preferredLanguage is fr', async () => {
    const mailService = {
      renderEmailVerification: jest.fn().mockReturnValue('<html>fr</html>'),
    } as unknown as MailService;
    const service = buildService(mailService);
    const sendMail = jest.fn().mockResolvedValue(undefined);
    (service as any).transporter = { sendMail };

    await service.generate('user-1', OtpPurpose.EMAIL_VERIFY, 'a@b.com', 'Amina', 'fr');

    expect(mailService.renderEmailVerification).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Amina' }),
      'fr',
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining('NexaFx') }),
    );
  });

  it('falls back to English when no language is given', async () => {
    const mailService = {
      renderEmailVerification: jest.fn().mockReturnValue('<html>en</html>'),
    } as unknown as MailService;
    const service = buildService(mailService);
    (service as any).transporter = { sendMail: jest.fn().mockResolvedValue(undefined) };

    await service.generate('user-1', OtpPurpose.EMAIL_VERIFY, 'a@b.com');

    expect(mailService.renderEmailVerification).toHaveBeenCalledWith(
      expect.anything(),
      'en',
    );
  });
});
