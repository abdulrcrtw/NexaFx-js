import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class StellarService implements OnModuleInit {
  private readonly logger = new Logger(StellarService.name);
  private readonly horizonUrl: string;
  private readonly network: string;
  private readonly timeoutMs = 5000;

  constructor(private readonly config: ConfigService) {
    this.horizonUrl = this.config.get<string>(
      'STELLAR_HORIZON_URL',
      'https://horizon-testnet.stellar.org',
    );
    this.network = this.config
      .get<string>('STELLAR_NETWORK', 'TESTNET')
      .toUpperCase();
  }

  async onModuleInit(): Promise<void> {
    await this.checkHorizonHealth();
  }

  async checkHorizonHealth(): Promise<void> {
    try {
      await axios.get(this.horizonUrl, { timeout: this.timeoutMs });
      this.logger.log(
        `Stellar Horizon reachable at ${this.horizonUrl} (${this.network})`,
      );
    } catch (err) {
      const message = `Stellar Horizon unreachable at ${this.horizonUrl}: ${(err as Error).message}`;
      if (this.network === 'PUBLIC') {
        throw new Error(`[STARTUP BLOCKED] ${message}`);
      }
      this.logger.warn(`[TESTNET] ${message} — startup continues`);
    }
  }
}
