import { SerializableError } from '@cdellacqua/serializable-error';
import Knex, { Transaction } from 'knex';

export type TransactionCode<T> = (trx: Transaction) => Promise<T>;
export type NextTransactionCode<T = any> = (trx: Transaction, previousValue?: any) => Promise<T>;

export const config: { knexInstance?: Knex } = {};

export async function transact<T>(provider: TransactionCode<T>, trx?: Transaction): Promise<T>;
export async function transact<T>(provider: NextTransactionCode[], trx?: Transaction): Promise<T>;

export async function transact<T>(
	provider: TransactionCode<T> | NextTransactionCode[],
	trx?: Transaction,
): Promise<T> {
	if (!config.knexInstance) {
		throw new Error('missing knex instance in config object, try assigning your knex instance to the config.knexInstance property of this package');
	}

	const transaction = trx || await config.knexInstance.transaction();
	const ownTransaction = !trx;
	const providers = Array.isArray(provider) ? provider : [provider];

	try {
		let result = await providers[0](transaction);
		// eslint-disable-next-line
		for (const p of providers.slice(1)) {
			// eslint-disable-next-line
			result = await p(transaction, result);
		}

		if (ownTransaction) {
			await transaction.commit();
		}

		return result;
	} catch (err) {
		if (ownTransaction) {
			await transaction.rollback();
		}

		throw new SerializableError('an error occurred while executing the transaction' + (ownTransaction ? ', rolled back' : ''), err);
	}
}
