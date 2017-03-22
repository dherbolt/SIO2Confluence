/**
 * Call *itemCallback(item)* for each *argList*. When all itemCallbacks are
 * finished returned Promise is resolved.
 *
 * Item callbacks can return async results as their resolve parameters. These resutls
 * are collected and returned as promisefy:resolve argument.
 *
 * @param {Array} argList List of arguments for each itemCallback call
 * @param {Function} itemCallback - can optionally return Promise
 * @param {Object} customParams (optional) Custom params passed to itemCallback function
 * @returns {Promise} Resolved when all itemCallbacks are finished
 */
const promisefy = function (argList, itemCallback, customParams) {
	return new Promise(function (resolve, reject) {
		let returnValues = [];

		if (!argList || argList.length === 0) {
			resolve(returnValues);
			return;
		}

		let processItem = function (index, argList, itemCallback, customParams) {
			if (index === argList.length) {
				resolve(returnValues);
				return;
			}

			let result = itemCallback(argList[index], customParams);
			if (result instanceof Promise) {
				result.then(function (value) {
					returnValues[index] = value;
					processItem(index + 1, argList, itemCallback, customParams);
				});
			}
			else {
				processItem(index + 1, argList, itemCallback, customParams);
			}
		};

		processItem(0, argList, itemCallback, customParams);
	});
};


// --------------------------------------------------------------------------------------
//                                         <TESTS>
// --------------------------------------------------------------------------------------
var testResult;

// // Test - async
// testResult = [];
// promisefy([1, 2, 3, 4], function (i) {
// 	return new Promise(function (resolve, reject) {
// 		setTimeout(function() {
// 			testResult.push(i);
// 		}.bind(this, i), 500);
// 	});
// })
// .then(() => {
// 	console.assert(JSON.stringify([1, 2, 3, 4]) === JSON.stringify(testResult), 'Async promise test');
// });


// // Test - sync
// testResult = [];
// promisefy([1, 2, 3, 4], function (i) {
// 	testResult.push(i);
// })
// .then(() => {
// 	console.assert(JSON.stringify([1, 2, 3, 4]) === JSON.stringify(testResult), 'Sync promise test');
// });


// // Test - async with return value
// promisefy([1, 2, 3, 4], function (i) {
// 	return new Promise(function (resolve, reject) {
// 		setTimeout(function(i) {
// 			resolve(i + 10);
// 		}.bind(this, i), 500);
// 	});
// })
// .then((returnValues) => {
// 	console.assert(JSON.stringify([11, 12, 13, 14]) === JSON.stringify(returnValues), 'Async promise with return value test');
// });


// --------------------------------------------------------------------------------------
//                                         </TESTS>
// --------------------------------------------------------------------------------------



module.exports = promisefy;