# knex-transact

transact function that provides a simple mechanism to translate SQL transactions into code

## How to configure

To use this function you must first assign config.knex to your knex instance. For example:
```
	import { config } from '@cdellacqua/knex-transact';

	import knex from 'knex';
	
	const myKnexInstance = knex({
		// your database configuration
	});

	config.knexInstance = myKnexInstance;
```

## How to use

This package exposes a function called `transact`. It accepts two arguments: an array of functions (or a single function) that return a Promise, and an optional Transaction.

If a function needs to process data with and without having an already initialized transaction, one can easily end up writing some boilerplate code like this:
```
	
async function aFunctionThatReceivesAnOptionalTransaction(trx?: Transaction) {
	const db = trx || knex.transaction();
	try {
		const tempResult = await trx('table').where('property', 'value').select();
		await someOtherFunction(tempResult, trx);

		if (!trx) {
			db.commit();
		}
	} catch (err) {
		if (!trx) {
			db.rollback();
		}

		throw err;
	}
}
```

This library takes care of that boilerplate, thus reducing noise and allowing to write less and cleaner code:
```
function aFunctionThatReceivesAnOptionalTransaction(trx?: Transaction) {
	return transact([
		(db) => db('table').where('property', 'value').select(),
		(db, tempResult) => someOtherFunction(tempResult, db),
	], trx);
}
```