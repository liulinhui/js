import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { MaybeAccountInfoWithPublicKey } from "./AccountInfoWithPublicKey";
import { chunk, zipMap } from "@/utils";

export interface GmaBuilderOptions {
  chunkSize?: number;
}

export class GmaBuilder {
  protected readonly connection: Connection;
  protected readonly publicKeys: PublicKey[];
  protected chunkSize: number;

  constructor(connection: Connection, publicKeys: PublicKey[], options: GmaBuilderOptions = {}) {
    this.connection = connection;
    this.publicKeys = publicKeys;
    this.chunkSize = options.chunkSize ?? 100;
  }

  chunkBy(n: number) {
    this.chunkSize = n;

    return this;
  }

  addPublicKeys(publicKeys: PublicKey[]) {
    this.publicKeys.push(...publicKeys);

    return this;
  }

  getPublicKeys(): PublicKey[] {
    return this.publicKeys;
  }

  getUniquePublicKeys(): PublicKey[] {
    return [];
  }

  async getFirst(n?: number): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    return [];
  }

  async getLast(n?: number): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    return [];
  }

  async getBetween(start: number, end: number): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    return [];
  }

  async getPage(page: number, perPage: number): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    return [];
  }

  async get(): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    return [];
  }

  protected async fetchChunks(publicKeys: PublicKey[]): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    const chunks = chunk(publicKeys, this.chunkSize);
    const chunkPromises = chunks.map(chunk => this.fetchChunk(chunk));
    const resolvedChunks = await Promise.allSettled(chunkPromises);

    return resolvedChunks.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  }

  protected async fetchChunk(publicKeys: PublicKey[]): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    try {
      // TODO: Use lower level RPC call to add dataSlice support.
      const accounts = (await this.connection.getMultipleAccountsInfo(publicKeys)) as (AccountInfo<Buffer> | null)[];

      return zipMap(publicKeys, accounts, (publicKey, account) => {
        return !account
          ? { pubkey: publicKey, exists: false }
          : { pubkey: publicKey, exists: true, ...account };
      });
    } catch (error) {
      // TODO: Throw error instead?
      return publicKeys.map(publicKey => ({ pubkey: publicKey, exists: false }));
    }
  }
}