/**
 * Adyen Terminal API & Nexo 3.0 / ISO 20022 Integration Service
 * 
 * Core Features:
 * 1. Strict Nexo 3.0 Schema Builders & Parser (SaleToPOI protocol).
 * 2. Secure Credential Proxy Routing (routes cloud requests through backend adyenCloudProxy).
 * 3. State Recovery & Idempotency Loop (queries unconfirmed transactions & fires TransactionStatusRequest).
 * 4. Asynchronous Webhook Dispatcher (delayed 3-5s authorization for QR/wallets).
 * 5. Store-and-Forward (SaF) Offline Risk Validation with Adyen HMAC digital signatures.
 * 6. Live Nexo Protocol Inspector Event Bus.
 */

import type {
  SaleToPOIRequest,
  SaleToPOIResponse,
  NexoMessageHeader,
  AdyenNotificationRequestItem,
  AdyenParsedAdditionalResponse,
  AdyenSaFConfig
} from '../types/adyenNexoTypes';
import type { PosTransactionRecord } from '../types/pos';
import { posDb } from '../db/db';
import { useAdyenConfigStore } from '../store/adyenConfigStore';

// Type definitions for Nexo Log Events
export interface NexoLogEntry {
  id: string;
  timestamp: string;
  category: string;
  direction: 'REQUEST' | 'RESPONSE' | 'NOTIFICATION';
  serviceId: string;
  payload: unknown;
  status?: string;
  latencyMs?: number;
}

// ==============================================================================
// Cryptographic Helper: FIPS 180-4 SHA-256 & RFC 2104 HMAC-SHA256 Implementation
// ==============================================================================

function sha256Bytes(ascii: string): Uint8Array {
  const lengthProperty = 'length';
  let i: number, j: number;
  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words[lengthProperty]; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);

    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const gamma0 = ((w[j - 15] >>> 7) | (w[j - 15] << 25)) ^
                       ((w[j - 15] >>> 18) | (w[j - 15] << 14)) ^
                       (w[j - 15] >>> 3);
        const gamma1 = ((w[j - 2] >>> 17) | (w[j - 2] << 15)) ^
                       ((w[j - 2] >>> 19) | (w[j - 2] << 13)) ^
                       (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0;
      }

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const sigma0 = ((hash[0] >>> 2) | (hash[0] << 30)) ^
                     ((hash[0] >>> 13) | (hash[0] << 19)) ^
                     ((hash[0] >>> 22) | (hash[0] << 10));
      const sigma1 = ((hash[4] >>> 6) | (hash[4] << 26)) ^
                     ((hash[4] >>> 11) | (hash[4] << 21)) ^
                     ((hash[4] >>> 25) | (hash[4] << 7));

      const temp1 = (hash[7] + sigma1 + ch + k[j] + w[j]) | 0;
      const temp2 = (sigma0 + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  const out = new Uint8Array(32);
  for (i = 0; i < 8; i++) {
    out[i * 4] = (hash[i] >>> 24) & 0xff;
    out[i * 4 + 1] = (hash[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (hash[i] >>> 8) & 0xff;
    out[i * 4 + 3] = hash[i] & 0xff;
  }
  return out;
}

export function computeHmacSha256(message: string, key: string = 'ADYEN_SAF_HMAC_MASTER_KEY_2026'): string {
  const blockSize = 64;
  let keyBytes: Uint8Array;

  if (key.length > blockSize) {
    keyBytes = sha256Bytes(key);
  } else {
    keyBytes = new Uint8Array(blockSize);
    for (let i = 0; i < key.length; i++) {
      keyBytes[i] = key.charCodeAt(i);
    }
  }

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);

  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = (keyBytes[i] || 0) ^ 0x5c;
    iKeyPad[i] = (keyBytes[i] || 0) ^ 0x36;
  }

  const innerMsg = String.fromCharCode(...iKeyPad) + message;
  const innerHash = sha256Bytes(innerMsg);
  const outerMsg = String.fromCharCode(...oKeyPad) + String.fromCharCode(...innerHash);
  const outerHash = sha256Bytes(outerMsg);

  return Array.from(outerHash).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

class AdyenTerminalService {
  private logListeners: ((log: NexoLogEntry) => void)[] = [];
  private webhookListeners: ((notification: AdyenNotificationRequestItem) => void)[] = [];
  private isRecoveryRunning = false;

  // ============================================================================
  // PROTOCOL UTILITIES & BUILDERS
  // ============================================================================

  /**
   * Helper: Generates unique 1-10 character alphanumeric Nexo ServiceID
   */
  public generateServiceId(): string {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  }

  /**
   * Helper: Generates authentic 16-character alphanumeric Adyen PSP Reference
   */
  public generatePspReference(): string {
    const timestamp = Date.now().toString().slice(-8);
    const randomHex = Math.random().toString(36).substring(2, 10).padEnd(8, '0').toUpperCase();
    return `${timestamp}${randomHex}`;
  }

  /**
   * Helper: Builds standard Nexo 3.0 MessageHeader
   */
  public createMessageHeader(
    category: NexoMessageHeader['MessageCategory'],
    serviceId: string,
    saleId: string = 'NodePOS-Register-01',
    poiId: string = 'S1F2-000154829102'
  ): NexoMessageHeader {
    return {
      ProtocolVersion: '3.0',
      MessageClass: 'Service',
      MessageCategory: category,
      MessageType: 'Request',
      ServiceID: serviceId,
      SaleID: saleId,
      POIID: poiId
    };
  }

  /**
   * Helper: Parses Adyen form-encoded or JSON AdditionalResponse field
   */
  public parseAdditionalResponse(additionalResponseStr?: string): AdyenParsedAdditionalResponse {
    if (!additionalResponseStr) {
      return { pspReference: '' };
    }

    // Try parsing as JSON first
    if (additionalResponseStr.trim().startsWith('{')) {
      try {
        return JSON.parse(additionalResponseStr) as AdyenParsedAdditionalResponse;
      } catch {
        // Fallback to query-string format
      }
    }

    // Parse standard Adyen key=value&key2=value2 format
    const params = new URLSearchParams(additionalResponseStr);
    return {
      pspReference: params.get('pspReference') || '',
      authCode: params.get('authCode') || undefined,
      merchantReference: params.get('merchantReference') || undefined,
      paymentMethod: params.get('paymentMethod') || undefined,
      paymentMethodVariant: params.get('paymentMethodVariant') || undefined,
      cardSummary: params.get('cardSummary') || undefined,
      cardBin: params.get('cardBin') || undefined,
      cardHolderName: params.get('cardHolderName') || undefined,
      issuerCountry: params.get('issuerCountry') || undefined,
      refusalReason: params.get('refusalReason') || undefined,
      refusalReasonRaw: params.get('refusalReasonRaw') || undefined,
      offline: params.get('offline') === 'true',
      offlineSignature: params.get('offlineSignature') || undefined,
      tenderReference: params.get('tenderReference') || undefined,
      store: params.get('store') || undefined,
      terminalId: params.get('terminalId') || undefined
    };
  }

  // ============================================================================
  // 1. STATE RECOVERY & IDEMPOTENCY RECONCILIATION LOOP
  // ============================================================================

  /**
   * Scans local database for in-flight / interrupted transactions and fires
   * standard Nexo TransactionStatusRequest to reconcile with Adyen Terminal API.
   */
  public async recoverUnresolvedTransactions(
    onReconciled?: (reconciled: PosTransactionRecord[]) => void
  ): Promise<PosTransactionRecord[]> {
    if (this.isRecoveryRunning) return [];
    this.isRecoveryRunning = true;

    const reconciledRecords: PosTransactionRecord[] = [];

    try {
      // Find all in-flight or interrupted transactions
      const pending = await posDb.transactions
        .filter((t) => t.state === 'IN_FLIGHT' || t.state === 'PROCESSING' || t.state === 'SYNCING')
        .toArray();

      if (pending.length === 0) {
        this.isRecoveryRunning = false;
        return [];
      }

      console.log(`[AdyenStateRecovery] Found ${pending.length} unresolved in-flight transaction(s). Initiating Nexo TransactionStatus reconciliation...`);

      for (const txn of pending) {
        try {
          const serviceId = txn.serviceId || this.generateServiceId();
          const targetServiceId = txn.serviceId || serviceId;

          // Build Nexo TransactionStatusRequest
          const statusRequest: SaleToPOIRequest = {
            SaleToPOIRequest: {
              MessageHeader: this.createMessageHeader('TransactionStatus', serviceId, 'NodePOS-Register-01', txn.terminalId),
              TransactionStatusRequest: {
                MessageReference: {
                  MessageCategory: 'Payment',
                  ServiceID: targetServiceId,
                  SaleID: 'NodePOS-Register-01',
                  POIID: txn.terminalId
                },
                ReceiptRepReqFlag: true
              }
            }
          };

          // Dispatch status query
          const response = await this.sendSaleToPOIRequest(statusRequest);
          const statusResp = response.SaleToPOIResponse.TransactionStatusResponse;

          if (statusResp && statusResp.Response.Result === 'Success') {
            const repeatedPayment = statusResp.RepeatedMessageResponse?.PaymentResponse;
            const isApproved = repeatedPayment?.Response?.Result === 'Success';
            const now = new Date().toISOString();

            const pspReference = repeatedPayment?.POIData?.POITransactionID?.TransactionID || txn.pspReference || undefined;
            const authCode = repeatedPayment?.PaymentResult?.PaymentAcquirerData?.ApprovalCode || undefined;

            let finalState: PosTransactionRecord['state'];
            let declineReason: string | undefined;

            if (isApproved) {
              if (pspReference && authCode) {
                finalState = 'SETTLED';
              } else {
                finalState = 'REQUIRES_REVIEW';
                declineReason = 'Recovery reconciliation missing required PSP reference or Authorization Code from Adyen.';
              }
            } else {
              finalState = 'DECLINED';
              declineReason = repeatedPayment?.Response?.ErrorCondition || 'Transaction declined on terminal';
            }

            const updatedTxn: PosTransactionRecord = {
              ...txn,
              state: finalState,
              pspReference,
              authCode,
              syncedAt: now,
              settledAt: finalState === 'SETTLED' ? now : undefined,
              declineReason,
              nexoResponse: JSON.stringify(response)
            };

            await posDb.transactions.put(updatedTxn);
            reconciledRecords.push(updatedTxn);
          } else {
            // If terminal has no record, mark as REQUIRES_REVIEW
            const updatedTxn: PosTransactionRecord = {
              ...txn,
              state: 'REQUIRES_REVIEW',
              declineReason: 'No terminal record found during recovery reconciliation.'
            };
            await posDb.transactions.put(updatedTxn);
            reconciledRecords.push(updatedTxn);
          }
        } catch (itemErr) {
          console.error(`[AdyenStateRecovery] Failed to reconcile transaction ${txn.id}:`, itemErr);
        }
      }

      if (reconciledRecords.length > 0 && onReconciled) {
        onReconciled(reconciledRecords);
      }
    } catch (err) {
      console.error('[AdyenStateRecovery] Critical error in state recovery loop:', err);
    } finally {
      this.isRecoveryRunning = false;
    }

    return reconciledRecords;
  }

  // ============================================================================
  // 2. ASYNCHRONOUS WEBHOOK DISPATCHER (Payment Workflows)
  // ============================================================================

  /**
   * Simulates an asynchronous webhook payload arriving from Adyen acquiring network
   * 3-5 seconds after an async QR code (Alipay / WeChat Pay / PayByBank) scan.
   */
  public async triggerMockAsyncWebhook(params: {
    merchantReference: string;
    pspReference?: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    delayMs?: number;
    shouldSucceed?: boolean;
  }): Promise<AdyenNotificationRequestItem> {
    const delay = params.delayMs || 3500;
    const isSuccess = params.shouldSucceed !== undefined ? params.shouldSucceed : true;

    // Simulate webhook dispatch network latency
    await new Promise((resolve) => setTimeout(resolve, delay));

    const notificationItem: AdyenNotificationRequestItem = {
      additionalData: {
        shopperReference: `shopper-${Math.random().toString(36).substring(2, 8)}`,
        authCode: isSuccess ? `AUTH-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
        paymentMethod: params.paymentMethod,
        offline: 'false'
      },
      amount: {
        currency: params.currency,
        value: Math.round(params.amount * 100) // In minor units
      },
      eventCode: 'AUTHORISATION',
      eventDate: new Date().toISOString(),
      merchantAccountCode: 'MetroCoffeePOS_Store_01',
      merchantReference: params.merchantReference,
      paymentMethod: params.paymentMethod,
      pspReference: params.pspReference || this.generatePspReference(),
      success: isSuccess ? 'true' : 'false',
      reason: isSuccess ? undefined : 'Refused by issuer / Insufficient funds'
    };

    // Broadcast event to active listeners
    this.broadcastWebhook(notificationItem);

    // Log Notification to Nexo Inspector
    this.broadcastLog({
      id: `webhook-${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'Notification',
      direction: 'NOTIFICATION',
      serviceId: params.merchantReference,
      payload: notificationItem,
      status: isSuccess ? 'Success' : 'Refusal'
    });

    return notificationItem;
  }

  // ============================================================================
  // 3. CORE ADYEN TERMINAL API DISPATCH BRIDGE
  // ============================================================================

  /**
   * Main Dispatcher for all SaleToPOI Requests.
   * Directs traffic based on configured connectionMode:
   * - CLOUD_PROXY: Routes through secure backend adyenCloudProxy
   * - LOCAL_IP: Direct local LAN websocket / HTTP connection
   * - SIMULATOR: High-fidelity realistic Nexo response simulator
   */
  public async sendSaleToPOIRequest(request: SaleToPOIRequest): Promise<SaleToPOIResponse> {
    const startTime = performance.now();
    const header = request.SaleToPOIRequest.MessageHeader;

    // Log Outgoing Request to Nexo Inspector
    this.broadcastLog({
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      category: header.MessageCategory,
      direction: 'REQUEST',
      serviceId: header.ServiceID,
      payload: request
    });

    const config = useAdyenConfigStore.getState();
    let response: SaleToPOIResponse;

    const controller = new AbortController();
    const timeoutMs = 65000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      if (config.connectionMode === 'CLOUD_PROXY') {
        // Route through secure backend proxy HTTP endpoint (no client-side API keys exposed)
        const res = await fetch(config.proxyEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Proxy Error [HTTP ${res.status}]: ${errorText}`);
        }
        response = (await res.json()) as SaleToPOIResponse;
      } else if (config.connectionMode === 'LOCAL_IP') {
        // Direct Local IP / WebSocket terminal connection with AbortController timeout
        response = await this.dispatchDirectLocalTerminal(
          request,
          config.localTerminalIp,
          config.localTerminalPort,
          controller.signal
        );
      } else {
        // High-Fidelity Terminal Simulator
        response = await this.simulateAdyenTerminalNexoResponse(request);
      }
    } catch (err: unknown) {
      if (config.connectionMode === 'SIMULATOR') {
        console.warn('[AdyenTerminalService] Simulator dispatch error. Re-running simulator:', err);
        response = await this.simulateAdyenTerminalNexoResponse(request);
      } else {
        console.error(`[AdyenTerminalService] ${config.connectionMode} dispatch failed:`, err);
        throw err;
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const latencyMs = Math.round(performance.now() - startTime);

    // Log Response to Nexo Inspector
    this.broadcastLog({
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      category: header.MessageCategory,
      direction: 'RESPONSE',
      serviceId: header.ServiceID,
      payload: response,
      status: response.SaleToPOIResponse.PaymentResponse?.Response?.Result || 
              response.SaleToPOIResponse.DiagnosisResponse?.Response?.Result || 
              response.SaleToPOIResponse.ReversalResponse?.Response?.Result || 'Success',
      latencyMs
    });

    return response;
  }

  /**
   * Direct Local IP connection (e.g. for Castles / Verifone terminals on local LAN)
   */
  private async dispatchDirectLocalTerminal(
    request: SaleToPOIRequest,
    ip: string,
    port: number,
    signal?: AbortSignal
  ): Promise<SaleToPOIResponse> {
    const url = `https://${ip}:${port}/nexo`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal
    });
    if (!res.ok) {
      throw new Error(`Local Terminal responded with HTTP ${res.status}`);
    }
    return (await res.json()) as SaleToPOIResponse;
  }

  // ============================================================================
  // 4. HIGH-FIDELITY ADYEN NEXO TERMINAL SIMULATOR
  // ============================================================================

  /**
   * High-Fidelity Nexo 3.0 / ISO 20022 Terminal Simulator.
   * Generates exact Adyen SaleToPOIResponse envelopes with authentic PSP references,
   * AdditionalResponse strings, ISO approval codes, and EMV tokenization.
   */
  private async simulateAdyenTerminalNexoResponse(request: SaleToPOIRequest): Promise<SaleToPOIResponse> {
    // Artificial terminal latency simulation
    await new Promise((resolve) => setTimeout(resolve, 600));

    const reqEnvelope = request.SaleToPOIRequest;
    const header = reqEnvelope.MessageHeader;
    const pspReference = this.generatePspReference();
    const now = new Date().toISOString();

    // --- PAYMENT REQUEST ---
    if (reqEnvelope.PaymentRequest) {
      const payReq = reqEnvelope.PaymentRequest;
      const amount = payReq.PaymentTransaction.AmountsReq.RequestedAmount;
      const currency = payReq.PaymentTransaction.AmountsReq.Currency;
      const tipAmount = payReq.PaymentTransaction.AmountsReq.TipAmount || 0;
      const totalAmount = amount + tipAmount;

      const cardLast4 = `${Math.floor(1000 + Math.random() * 9000)}`;
      const approvalCode = `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
      const cardBrand = payReq.PaymentTransaction.TransactionConditions?.AllowedPaymentBrand?.[0] || 'visa';

      const additionalResponseData: AdyenParsedAdditionalResponse = {
        pspReference,
        authCode: approvalCode,
        merchantReference: payReq.SaleData.SaleTransactionID.TransactionID,
        paymentMethod: cardBrand,
        cardSummary: cardLast4,
        cardBin: '411111',
        cardHolderName: 'VALUED SHOPPER',
        issuerCountry: 'NL',
        offline: false,
        store: 'MetroCoffee_Store_01',
        terminalId: header.POIID
      };

      const additionalResponseStr = Object.entries(additionalResponseData)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&');

      return {
        SaleToPOIResponse: {
          MessageHeader: {
            ...header,
            MessageType: 'Response'
          },
          PaymentResponse: {
            Response: {
              Result: 'Success',
              AdditionalResponse: additionalResponseStr
            },
            SaleData: {
              SaleTransactionID: payReq.SaleData.SaleTransactionID
            },
            POIData: {
              POITransactionID: {
                TransactionID: pspReference,
                TimeStamp: now
              },
              POIReconciliationID: `REC-${Date.now()}`
            },
            PaymentResult: {
              PaymentType: 'Normal',
              PaymentInstrumentData: {
                PaymentInstrumentType: 'Card'
              },
              AmountsResp: {
                Currency: currency,
                AuthorizedAmount: totalAmount,
                TipAmount: tipAmount
              },
              PaymentAcquirerData: {
                AcquirerPOIID: header.POIID,
                ApprovalCode: approvalCode,
                MerchantID: 'MetroCoffeePOS_Store_01'
              }
            }
          }
        }
      };
    }

    // --- REVERSAL REQUEST ---
    if (reqEnvelope.ReversalRequest) {
      const revReq = reqEnvelope.ReversalRequest;
      return {
        SaleToPOIResponse: {
          MessageHeader: {
            ...header,
            MessageType: 'Response'
          },
          ReversalResponse: {
            Response: {
              Result: 'Success',
              AdditionalResponse: `Reversal of ${revReq.OriginalPOITransaction.POITransactionID.TransactionID} confirmed.`
            },
            POIData: {
              POITransactionID: {
                TransactionID: pspReference,
                TimeStamp: now
              }
            },
            ReversedAmount: revReq.ReversedAmount
          }
        }
      };
    }

    // --- DIAGNOSIS REQUEST ---
    if (reqEnvelope.DiagnosisRequest) {
      return {
        SaleToPOIResponse: {
          MessageHeader: {
            ...header,
            MessageType: 'Response'
          },
          DiagnosisResponse: {
            Response: {
              Result: 'Success',
              AdditionalResponse: 'Diagnostic completed with 0 errors.'
            },
            POIStatus: {
              GlobalStatus: 'OK',
              SecurityStatus: 'NoTamper',
              PEDOKFlag: true,
              CardReaderOKFlag: true,
              PrinterStatus: 'OK',
              CommunicationOKFlag: true,
              BatteryLevelPercent: 96,
              FirmwareVersion: 'AdyenOS v4.18.2-pci5'
            },
            HostStatus: [
              { AcquirerID: 'ADYEN_CLOUD_EU', IsReachable: true },
              { AcquirerID: 'ADYEN_BACKUP_US', IsReachable: true }
            ]
          }
        }
      };
    }

    // --- TRANSACTION STATUS REQUEST ---
    if (reqEnvelope.TransactionStatusRequest) {
      const statusReq = reqEnvelope.TransactionStatusRequest;
      return {
        SaleToPOIResponse: {
          MessageHeader: {
            ...header,
            MessageType: 'Response'
          },
          TransactionStatusResponse: {
            Response: {
              Result: 'Success'
            },
            MessageReference: statusReq.MessageReference,
            RepeatedMessageResponse: {
              MessageHeader: {
                ...header,
                MessageType: 'Response'
              },
              PaymentResponse: {
                Response: {
                  Result: 'Success',
                  AdditionalResponse: `pspReference=${pspReference}&authCode=AUTH-REC-99`
                },
                SaleData: {
                  SaleTransactionID: {
                    TransactionID: statusReq.MessageReference?.ServiceID || 'TXN-RECOVERED',
                    TimeStamp: now
                  }
                },
                POIData: {
                  POITransactionID: {
                    TransactionID: pspReference,
                    TimeStamp: now
                  }
                },
                PaymentResult: {
                  PaymentType: 'Normal',
                  AmountsResp: {
                    Currency: 'EUR',
                    AuthorizedAmount: 25.00
                  },
                  PaymentAcquirerData: {
                    AcquirerPOIID: header.POIID,
                    ApprovalCode: 'AUTH-REC-99',
                    MerchantID: 'MetroCoffeePOS_Store_01'
                  }
                }
              }
            }
          }
        }
      };
    }

    // Generic Fallback
    return {
      SaleToPOIResponse: {
        MessageHeader: {
          ...header,
          MessageType: 'Response'
        }
      }
    };
  }

  // ============================================================================
  // 5. STORE-AND-FORWARD (SaF) OFFLINE RULE ENGINE
  // ============================================================================

  /**
   * Evaluates offline transaction against dynamically synced Customer Area SaF config.
   */
  public evaluateAdyenOfflineTransaction(params: {
    amount: number;
    currency: string;
    safConfig: AdyenSaFConfig | null;
    currentCumulativeOffline: number;
    currentOfflineCount: number;
  }): { allowed: boolean; reason?: string; authCode?: string; offlineSignature?: string } {
    const { amount, currency, safConfig, currentCumulativeOffline, currentOfflineCount } = params;

    if (!safConfig || !safConfig.safEnabled) {
      return {
        allowed: false,
        reason: 'Store-and-Forward (Offline) is disabled or not synced with Adyen Customer Area.'
      };
    }

    // Validate currency against supported currencies
    if (safConfig.supportedCurrencies && !safConfig.supportedCurrencies.includes(currency)) {
      return {
        allowed: false,
        reason: `Currency '${currency}' is not supported for Adyen Store-and-Forward (SaF) offline transactions.`
      };
    }

    // Use nullish check so an explicitly configured 0 limit is not treated as absent
    const singleLimit = safConfig.maxSingleTransactionAmount?.[currency];
    if (singleLimit === undefined || singleLimit === null) {
      return {
        allowed: false,
        reason: `No single transaction SaF limit configured for currency '${currency}'.`
      };
    }

    const cumulativeLimit = safConfig.maxCumulativeOfflineAmount?.[currency];
    if (cumulativeLimit === undefined || cumulativeLimit === null) {
      return {
        allowed: false,
        reason: `No cumulative SaF limit configured for currency '${currency}'.`
      };
    }

    if (amount > singleLimit) {
      return {
        allowed: false,
        reason: `Transaction amount (${currency} ${amount.toFixed(2)}) exceeds Adyen SaF single ceiling of ${currency} ${singleLimit.toFixed(2)}`
      };
    }

    if (currentCumulativeOffline + amount > cumulativeLimit) {
      return {
        allowed: false,
        reason: `Cumulative offline volume (${currency} ${(currentCumulativeOffline + amount).toFixed(2)}) exceeds Adyen SaF ceiling of ${currency} ${cumulativeLimit.toFixed(2)}. Connect to online to reconcile.`
      };
    }

    if (currentOfflineCount >= safConfig.maxOfflineTransactionCount) {
      return {
        allowed: false,
        reason: `Offline transaction count (${currentOfflineCount}) reached Adyen maximum batch capacity of ${safConfig.maxOfflineTransactionCount}. Reconnect to sync.`
      };
    }

    const authCode = `ADYEN-SAF-${Math.floor(1000 + Math.random() * 9000)}`;

    // Compute cryptographic HMAC-SHA256 over canonical transaction fields
    const canonicalPayload = `${safConfig.merchantAccount}|${safConfig.poiId}|${currency}|${amount.toFixed(2)}|${currentOfflineCount + 1}|${safConfig.configVersion || 'v1'}`;
    const hmacHex = computeHmacSha256(canonicalPayload, 'ADYEN_SAF_HMAC_MASTER_KEY_2026');
    const offlineSignature = `HMAC-SHA256:${hmacHex}`;

    return {
      allowed: true,
      authCode,
      offlineSignature
    };
  }

  // ============================================================================
  // 6. EVENT BUS (Nexo Inspector & Webhooks)
  // ============================================================================

  public subscribeToNexoLogs(callback: (log: NexoLogEntry) => void): () => void {
    this.logListeners.push(callback);
    return () => {
      this.logListeners = this.logListeners.filter((l) => l !== callback);
    };
  }

  public subscribeToAdyenWebhooks(callback: (notification: AdyenNotificationRequestItem) => void): () => void {
    this.webhookListeners.push(callback);
    return () => {
      this.webhookListeners = this.webhookListeners.filter((l) => l !== callback);
    };
  }

  private broadcastLog(log: NexoLogEntry) {
    for (const listener of this.logListeners) {
      listener(log);
    }
  }

  private broadcastWebhook(notification: AdyenNotificationRequestItem) {
    for (const listener of this.webhookListeners) {
      listener(notification);
    }
  }
}

export const adyenTerminalService = new AdyenTerminalService();
