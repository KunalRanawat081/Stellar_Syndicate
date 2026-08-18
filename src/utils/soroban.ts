import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';

// Resolve from env vars first, fall back to the deployed testnet address so
// the app still works without a .env file during local development.
export const CONTRACT_ID =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  'CDSPKUMNGZHZYTOO5ZRX2TFJQIP776DYM53ZCE4RHKJCQBPOWYEMW4MG';

export const RPC_URL =
  import.meta.env.VITE_SOROBAN_RPC_URL ||
  'https://soroban-testnet.stellar.org';

// The Stellar Asset Contract address for native XLM on Testnet.
// This is a canonical, well-known address for the XLM SAC.
export const NATIVE_XLM_SAC_TESTNET =
  'CDLZFC3SYJYDZT7K67VZ75HPJGW5ZTYF2MYTCH2W3ZPN77O3JJV26UCA';

// Stroops per XLM (7 decimal places).
export const STROOPS_PER_XLM = 10_000_000n;

export const rpcServer = new StellarSdk.rpc.Server(RPC_URL);

// Dummy address for read-only simulation queries — no real account needed.
const DUMMY_ADDRESS = 'GC26DFQL3O4ASQAQGTGCWDIYK5XXT6ZQANU4LRUVSBXS2KEK74EAPGPH';

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

export async function getGroupFromContract(groupId: string): Promise<any> {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const sourceAccount = new StellarSdk.Account(DUMMY_ADDRESS, '0');
    
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(contract.call('get_group', StellarSdk.nativeToScVal(groupId)))
      .setTimeout(30)
      .build();

    const simResult = await rpcServer.simulateTransaction(tx);
    
    if (StellarSdk.rpc.Api.isSimulationSuccess(simResult)) {
      const rawVal = simResult.result?.retval;
      if (!rawVal) return null;
      const nativeVal = StellarSdk.scValToNative(rawVal);
      
      const result: any = {};
      if (nativeVal instanceof Map) {
        nativeVal.forEach((value, key) => {
          result[key] = value;
        });
      } else if (typeof nativeVal === 'object' && nativeVal !== null) {
        Object.assign(result, nativeVal);
      }
      
      return {
        id: typeof result.id === 'string' ? result.id : String(result.id),
        title: result.title,
        description: result.description,
        leadBuyer: result.lead_buyer,
      };
    }
  } catch (e) {
    console.error('Failed to get group from contract:', e);
  }
  return null;
}

/**
 * Returns the list of on-chain member IDs for a group, or an empty array if
 * the group does not exist / no members yet.
 */
export async function getMemberIdsFromContract(groupId: string): Promise<string[]> {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const sourceAccount = new StellarSdk.Account(DUMMY_ADDRESS, '0');

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(contract.call('get_members', StellarSdk.nativeToScVal(groupId)))
      .setTimeout(30)
      .build();

    const simResult = await rpcServer.simulateTransaction(tx);

    if (StellarSdk.rpc.Api.isSimulationSuccess(simResult)) {
      const rawVal = simResult.result?.retval;
      if (!rawVal) return [];
      const nativeVal = StellarSdk.scValToNative(rawVal);
      if (Array.isArray(nativeVal)) {
        return nativeVal.map(String);
      }
    }
  } catch (e) {
    console.error('Failed to get member IDs from contract:', e);
  }
  return [];
}

/**
 * Returns on-chain state for a single member (address, order_amount, has_paid).
 * Returns null if the member is not found on-chain.
 */
export async function getMemberFromContract(
  groupId: string,
  memberId: string
): Promise<{ address: string; orderAmount: number; hasPaid: boolean } | null> {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const sourceAccount = new StellarSdk.Account(DUMMY_ADDRESS, '0');

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          'get_member',
          StellarSdk.nativeToScVal(groupId),
          StellarSdk.nativeToScVal(memberId)
        )
      )
      .setTimeout(30)
      .build();

    const simResult = await rpcServer.simulateTransaction(tx);

    if (StellarSdk.rpc.Api.isSimulationSuccess(simResult)) {
      const rawVal = simResult.result?.retval;
      if (!rawVal) return null;
      const nativeVal = StellarSdk.scValToNative(rawVal);

      const result: any = {};
      if (nativeVal instanceof Map) {
        nativeVal.forEach((value, key) => { result[key] = value; });
      } else if (typeof nativeVal === 'object' && nativeVal !== null) {
        Object.assign(result, nativeVal);
      }

      return {
        address: String(result.address),
        orderAmount: Number(result.order_amount),
        hasPaid: Boolean(result.has_paid),
      };
    }
  } catch (e) {
    console.error(`Failed to get member ${memberId} from contract:`, e);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

export async function createGroupOnChain(
  groupId: string,
  title: string,
  desc: string,
  userAddress: string
): Promise<string> {
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  const sourceAccount = await rpcServer.getAccount(userAddress);
  
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: '100',
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'create_group',
        StellarSdk.nativeToScVal(groupId),
        StellarSdk.nativeToScVal(title),
        StellarSdk.nativeToScVal(desc),
        StellarSdk.nativeToScVal(new StellarSdk.Address(userAddress))
      )
    )
    .setTimeout(30)
    .build();

  const preparedTx = await rpcServer.prepareTransaction(tx);
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(preparedTx.toXDR(), {
    networkPassphrase: StellarSdk.Networks.TESTNET,
    address: userAddress,
  });

  const txToSubmit = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, StellarSdk.Networks.TESTNET);
  const response = await rpcServer.sendTransaction(txToSubmit);
  
  if (response.status === 'ERROR') {
    throw new Error(response.errorResult?.toString() || 'Transaction simulation or submission failed');
  }

  return await pollTxStatus(response.hash);
}

export async function addMemberOnChain(
  groupId: string,
  memberId: string,
  address: string,
  orderAmount: number,
  userAddress: string
): Promise<string> {
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  const sourceAccount = await rpcServer.getAccount(userAddress);
  
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: '100',
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'add_member',
        StellarSdk.nativeToScVal(groupId),
        StellarSdk.nativeToScVal(memberId),
        StellarSdk.nativeToScVal(new StellarSdk.Address(address)),
        StellarSdk.xdr.ScVal.scvU32(orderAmount)
      )
    )
    .setTimeout(30)
    .build();

  const preparedTx = await rpcServer.prepareTransaction(tx);
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(preparedTx.toXDR(), {
    networkPassphrase: StellarSdk.Networks.TESTNET,
    address: userAddress,
  });

  const txToSubmit = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, StellarSdk.Networks.TESTNET);
  const response = await rpcServer.sendTransaction(txToSubmit);
  
  if (response.status === 'ERROR') {
    throw new Error(response.errorResult?.toString() || 'Transaction failed');
  }

  return await pollTxStatus(response.hash);
}

/**
 * Invokes mark_paid on the Soroban contract.
 *
 * FIX: The `amountXlm` parameter is the financially correct settlement cost in
 * XLM (a decimal number from settlement.ts, e.g. 12.75). This function
 * converts it to integer stroops (×10^7) before encoding it into the contract
 * call as an i128, so the contract receives an exact, unambiguous monetary
 * value — completely replacing the old dual-step flow of (Horizon payment +
 * incorrect order_amount-based contract call).
 */
export async function markPaidOnChain(
  groupId: string,
  memberId: string,
  amountXlm: number,
  userAddress: string,
  tokenAddress: string = NATIVE_XLM_SAC_TESTNET
): Promise<string> {
  // Convert XLM decimal to integer stroops (safe integer arithmetic via BigInt).
  const amountStroops = BigInt(Math.round(amountXlm * 10_000_000));
  if (amountStroops <= 0n) {
    throw new Error('Settlement amount must be greater than zero.');
  }

  const contract = new StellarSdk.Contract(CONTRACT_ID);
  const sourceAccount = await rpcServer.getAccount(userAddress);
  
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: '100',
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'mark_paid',
        StellarSdk.nativeToScVal(new StellarSdk.Address(tokenAddress)),
        StellarSdk.nativeToScVal(groupId),
        StellarSdk.nativeToScVal(memberId),
        // Encode the settlement amount as i128 — required by the contract's
        // token::Client::transfer call.
        StellarSdk.nativeToScVal(amountStroops, { type: 'i128' })
      )
    )
    .setTimeout(30)
    .build();

  const preparedTx = await rpcServer.prepareTransaction(tx);
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(preparedTx.toXDR(), {
    networkPassphrase: StellarSdk.Networks.TESTNET,
    address: userAddress,
  });

  const txToSubmit = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, StellarSdk.Networks.TESTNET);
  const response = await rpcServer.sendTransaction(txToSubmit);
  
  if (response.status === 'ERROR') {
    throw new Error(response.errorResult?.toString() || 'Transaction failed');
  }

  return await pollTxStatus(response.hash);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export async function pollTxStatus(txHash: string): Promise<string> {
  let status = 'PENDING';
  let attempts = 0;
  while ((status === 'PENDING' || status === 'NOT_FOUND') && attempts < 30) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const response = await rpcServer.getTransaction(txHash);
    status = response.status;
    if (status === 'SUCCESS') {
      return txHash;
    } else if (status === 'FAILED') {
      const errorMsg = (response as any).resultXdr?.toXDR('base64') || 'Transaction failed on-chain';
      throw new Error(errorMsg);
    }
    attempts++;
  }
  throw new Error('Transaction polling timed out.');
}

export function listenToContractEvents(
  onEvent: (event: any) => void
): () => void {
  let active = true;
  let lastLedger: number | null = null;

  const poll = async () => {
    try {
      if (!lastLedger) {
        const latest = await rpcServer.getLatestLedger();
        lastLedger = latest.sequence;
      }
      
      const response = await rpcServer.getEvents({
        startLedger: lastLedger,
        filters: [
          {
            contractIds: [CONTRACT_ID],
            type: 'contract',
          },
        ],
        limit: 10,
      });

      if (!active) return;

      if (response.events && response.events.length > 0) {
        response.events.forEach((ev: any) => {
          onEvent(ev);
        });
        
        const maxLedger = Math.max(...response.events.map((ev: any) => ev.ledgerSeq));
        lastLedger = maxLedger + 1;
      }
    } catch (e) {
      console.error('Error fetching Soroban events:', e);
    }

    if (active) {
      setTimeout(poll, 5000);
    }
  };

  poll();

  return () => {
    active = false;
  };
}
