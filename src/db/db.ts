import Dexie, { type Table } from 'dexie';
import type { PosTransactionRecord, PosTerminalRecord } from '../types/pos';

export class NodePosDatabase extends Dexie {
  transactions!: Table<PosTransactionRecord, string>;
  terminals!: Table<PosTerminalRecord, string>;

  constructor() {
    super('NodePOS_Prototype');
    
    this.version(1).stores({
      transactions: 'id, clientUuid, terminalId, state, isOffline, createdAt, paymentMethod, amount',
      terminals: 'id, terminalCode, isOnline'
    });
  }
}

export const posDb = new NodePosDatabase();

// Seed or initialize default terminal config in Dexie
export async function initializePosDb(): Promise<PosTerminalRecord> {
  const existing = await posDb.terminals.get('TERM-MUM-001');
  if (existing) return existing;

  const defaultTerminal: PosTerminalRecord = {
    id: 'TERM-MUM-001',
    terminalCode: 'TERM-MUM-001',
    merchantName: 'Metro Specialty Coffee Roasters',
    merchantId: 'MERCHANT-MUM-01',
    isOnline: true,
    maxOfflineCapPerTxn: 500.00,
    maxOfflineCumulativeCap: 2000.00,
    currentOfflineCumulative: 0.00,
    firmwareVersion: '3.4.2-PRO',
    lastHeartbeat: new Date().toISOString()
  };

  await posDb.terminals.put(defaultTerminal);

  // Seed sample initial transactions if empty
  const count = await posDb.transactions.count();
  if (count === 0) {
    const initialSeed: PosTransactionRecord[] = [
      {
        id: 'TXN-90211',
        clientUuid: '550e8400-e29b-41d4-a716-446655440001',
        terminalId: 'TERM-MUM-001',
        merchantId: 'MERCHANT-MUM-01',
        amount: 320.00,
        currency: 'INR',
        paymentMethod: 'CARD_NFC',
        cardNetwork: 'RUPAY',
        cardLast4: '4189',
        state: 'SETTLED',
        isOffline: false,
        authCode: 'AUTH-829104',
        rrn: 'RRN-9920194821',
        createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
        settledAt: new Date(Date.now() - 30 * 60000).toISOString()
      },
      {
        id: 'TXN-90210',
        clientUuid: '550e8400-e29b-41d4-a716-446655440002',
        terminalId: 'TERM-MUM-001',
        merchantId: 'MERCHANT-MUM-01',
        amount: 150.00,
        currency: 'INR',
        paymentMethod: 'UPI_LITE',
        upiVpa: 'aarav@okaxis',
        state: 'OFFLINE_PENDING',
        isOffline: true,
        offlineSequenceNumber: 1,
        authCode: 'AUTH-OFF-1002',
        createdAt: new Date(Date.now() - 20 * 60000).toISOString()
      },
      {
        id: 'TXN-90209',
        clientUuid: '550e8400-e29b-41d4-a716-446655440003',
        terminalId: 'TERM-MUM-001',
        merchantId: 'MERCHANT-MUM-01',
        amount: 450.00,
        currency: 'INR',
        paymentMethod: 'CARD_CHIP',
        cardNetwork: 'VISA',
        cardLast4: '8831',
        state: 'SETTLED',
        isOffline: false,
        authCode: 'AUTH-773819',
        rrn: 'RRN-9920194819',
        createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
        settledAt: new Date(Date.now() - 8 * 60000).toISOString()
      }
    ];

    await posDb.transactions.bulkPut(initialSeed);
  }

  return defaultTerminal;
}
