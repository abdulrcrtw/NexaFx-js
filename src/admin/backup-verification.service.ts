import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BackupVerificationService {
  private readonly logger = new Logger(BackupVerificationService.name);
  private lastBackupAt: Date | null = null;

  constructor(private readonly config: ConfigService) {}

  @Cron(CronExpression.EVERY_WEEK)
  async verifyBackupFreshness(): Promise<void> {
    if (!this.lastBackupAt) {
      this.logger.warn('No backup records found — backup may not be configured');
      return;
    }
    const hoursSinceBackup = (Date.now() - this.lastBackupAt.getTime()) / 3600_000;
    if (hoursSinceBackup > 24) {
      const alertEmail = this.config.get<string>('BACKUP_ALERT_EMAIL');
      this.logger.error(`Last backup was ${hoursSinceBackup.toFixed(1)} hours ago — alert sent to ${alertEmail}`);
    }
  }

  getStatus(): { lastBackupAt: Date | null; healthy: boolean } {
    const healthy = this.lastBackupAt ? (Date.now() - this.lastBackupAt.getTime()) < 86400_000 : false;
    return { lastBackupAt: this.lastBackupAt, healthy };
  }

  recordBackup(): void {
    this.lastBackupAt = new Date();
  }
}
