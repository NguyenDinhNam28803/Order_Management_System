import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notification-module/email.service';
import { ProcessAutomationDto } from './dto/process-automation.dto';

interface AutomationConfig {
  contractThreshold: number;
  defaultContractDays: number;
  autoSendEmail: boolean;
}

@Injectable()
export class POAutomationService {
  private readonly logger = new Logger(POAutomationService.name);
  private config: AutomationConfig = {
    contractThreshold: 50000000,
    defaultContractDays: 365,
    autoSendEmail: true,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async updateConfig(config: Partial<AutomationConfig>): Promise<AutomationConfig> {
    this.config = { ...this.config, ...config };
    this.logger.log(`Config updated: ${JSON.stringify(this.config)}`);
    return this.config;
  }

  async processPOAutomation(poId: string) {
    try {
      const po = await this.prisma.purchaseOrder.findUnique({
        where: { id: poId },
        include: {
          supplier: true,
          items: true,
        },
      });

      if (!po) {
        throw new Error(`PO not found: ${poId}`);
      }

      const totalAmount = Number(po.totalAmount);
      this.logger.log(`Processing PO ${po.poNumber} with value: ${totalAmount}`);

      if (totalAmount < this.config.contractThreshold) {
        return {
          success: true,
          poId: po.id,
          contractCreated: false,
          message: `PO ${po.poNumber} below threshold ${this.config.contractThreshold.toLocaleString('vi-VN')} VND`,
        };
      }

      if (po.contractId) {
        const existingContract = await this.prisma.contract.findUnique({
          where: { id: po.contractId },
        });

        if (existingContract) {
          return {
            success: true,
            poId: po.id,
            contractCreated: false,
            contractId: existingContract.id,
            message: `PO ${po.poNumber} already has contract ${existingContract.contractNumber}`,
          };
        }
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + this.config.defaultContractDays);

      const contractNumber = await this.generateContractNumber(po.orgId);

      const contract = await this.prisma.contract.create({
        data: {
          contractNumber,
          title: `Contract from ${po.poNumber}`,
          description: `Auto-generated contract from PO ${po.poNumber} value ${totalAmount.toLocaleString('vi-VN')} VND`,
          orgId: po.orgId,
          supplierId: po.supplierId,
          value: totalAmount,
          currency: 'VND',
          startDate,
          endDate,
          status: 'DRAFT',
          milestones: {
            create: [
              {
                title: 'Contract Signing',
                description: 'Both parties sign the contract',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                paymentPct: 0,
                status: 'PENDING',
              },
              {
                title: 'Delivery Completion',
                description: 'Supplier completes delivery per PO',
                dueDate: endDate,
                paymentPct: 100,
                status: 'PENDING',
              },
            ],
          },
        },
        include: {
          supplierOrg: true,
          milestones: true,
        },
      });

      // Link PO to contract
      await this.prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { contractId: contract.id },
      });

      this.logger.log(`Created contract ${contract.contractNumber} from PO ${po.poNumber}`);

      let emailSent = false;
      if (this.config.autoSendEmail && po.supplier?.email) {
        emailSent = await this.sendContractNotificationEmail(contract.id, po, totalAmount);
      }

      return {
        success: true,
        poId: po.id,
        poNumber: po.poNumber,
        contractCreated: true,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        message: `Created contract ${contract.contractNumber} from PO ${po.poNumber}${emailSent ? ' and sent email' : ''}`,
        emailSent,
      };
    } catch (error) {
      this.logger.error(`Automation error for PO ${poId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendContractEmail(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        supplierOrg: true,
        purchaseOrders: {
          take: 1,
        },
      },
    });

    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    const po = contract.purchaseOrders?.[0];
    if (!po) {
      throw new Error('No PO linked to contract');
    }

    const emailSent = await this.sendContractNotificationEmail(
      contractId,
      po,
      Number(contract.value || 0)
    );

    return {
      success: emailSent,
      contractId,
      message: emailSent ? 'Email sent' : 'Failed to send email',
    };
  }

  private async generateContractNumber(orgId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.contract.count({ where: { orgId } });
    return `CTR-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async sendContractNotificationEmail(
    contractId: string,
    po: any,
    totalAmount: number,
  ): Promise<boolean> {
    try {
      const contract = await this.prisma.contract.findUnique({
        where: { id: contractId },
        include: { supplierOrg: true },
      });

      if (!contract?.supplierOrg?.email) {
        this.logger.warn('Cannot send email: missing supplier info');
        return false;
      }

      const { subject, body, html } = this.generateContractEmailContent(
        contract,
        po,
        totalAmount
      );

      await this.emailService.sendEmail(
        contract.supplierOrg.email,
        subject,
        body,
      );

      this.logger.log(`Sent contract email to ${contract.supplierOrg.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Email error: ${error.message}`, error.stack);
      return false;
    }
  }

  private generateContractEmailContent(contract: any, po: any, totalAmount: number) {
    const subject = `New Contract ${contract.contractNumber} - Value ${Number(contract.value || 0).toLocaleString('vi-VN')} VND`;

    const body = `
Dear ${contract.supplier.name || 'Supplier'},

A new contract has been created from PO ${po.poNumber}:

CONTRACT DETAILS:
- Number: ${contract.contractNumber}
- Title: ${contract.title}
- Value: ${Number(contract.value || 0).toLocaleString('vi-VN')} ${contract.currency}
- Start: ${contract.startDate?.toLocaleDateString('vi-VN')}
- End: ${contract.endDate?.toLocaleDateString('vi-VN')}
- Status: Pending signature

Please login to view and sign the contract.

Best regards,
Procurement System
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #3B82F6;">New Contract Notification</h2>
  <p>Dear <strong>${contract.supplier.name || 'Supplier'}</strong>,</p>
  <p>A new contract has been created from PO <strong>${po.poNumber}</strong>:</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #059669;">Contract Details</h3>
    <ul style="line-height: 1.8;">
      <li><strong>Number:</strong> ${contract.contractNumber}</li>
      <li><strong>Title:</strong> ${contract.title}</li>
      <li><strong>Value:</strong> ${Number(contract.value || 0).toLocaleString('vi-VN')} ${contract.currency}</li>
      <li><strong>Start:</strong> ${contract.startDate?.toLocaleDateString('vi-VN')}</li>
      <li><strong>End:</strong> ${contract.endDate?.toLocaleDateString('vi-VN')}</li>
    </ul>
  </div>

  <p style="margin-top: 30px;">
    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/contracts/${contract.id}" 
       style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      View Contract
    </a>
  </p>
</div>
    `;

    return { subject, body, html };
  }
}
