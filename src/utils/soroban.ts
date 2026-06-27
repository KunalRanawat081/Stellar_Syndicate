import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';

export const CONTRACT_ID = 'CBFQ6FBVOSYZWSTXXPQVDNHR3H7LYOAQVHAHHJGMWSFUZNXZ4Z7L2GTY';
export const RPC_URL = 'https://soroban-testnet.stellar.org';
export const rpcServer = new StellarSdk.rpc.Server(RPC_URL);

// Dummy address for read-only queries
const DUMMY_ADDRESS = 'GC26DFQL3O4ASQAQGTGCWDIYK5XXT6ZQANU4LRUVSBXS2KEK74EAPGPH';

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
        leadBuyer: result.lead_buyer, // Address string
      };
    }
  } catch (e) {
    console.error('Failed to get group from contract:', e);
  }
  return null;
}

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

export async function markPaidOnChain(
  groupId: string,
  memberId: string,
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
        'mark_paid',
        StellarSdk.nativeToScVal(groupId),
        StellarSdk.nativeToScVal(memberId)
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

export async function pollTxStatus(txHash: string): Promise<string> {
  let status = 'PENDING';
  let attempts = 0;
  while (status === 'PENDING' && attempts < 30) {
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
