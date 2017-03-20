/**
 *
 * @param {Array} argList List of arguments for each itemCallback call
 * @param {Function} itemCallback - can optionally return Promise
 * @param {Function} allDoneCallback (optional)
 * @returns {Promise} Resolved when all itemCallbacks are finished
 */
const promisefy = function (argList, itemCallback, allDoneCallback) {
	return new Promise(function (resolve, reject) {
		if (argList.length === 0) {
			resolve();
			return;
		}

		let processItem = function (index, argList, itemCallback, allDoneCallback) {
			if (index === argList.length) {
				resolve();
				allDoneCallback && allDoneCallback();
				return;
			}

			let result = itemCallback(argList[index]);
			if (result instanceof Promise) {
				result.then(function () {
					processItem(index + 1, argList, itemCallback, allDoneCallback);
				});
			}
			else {
				processItem(index + 1, argList, itemCallback, allDoneCallback);
			}
		};

		processItem(0, argList, itemCallback, allDoneCallback);
	});
};

// Test - async
// promisefy([1, 2, 3, 4], function (i) {
// 	return new Promise(function (resolve, reject) {
// 		console.log(i);
// 		window.setTimeout(resolve, 500);
// 	});
// })
// .then(() => { console.log('aaaa'); });


// Test - sync
// promisefy([1, 2, 3, 4], function (i) {
// 		console.log(i);
// })
// .then(() => { console.log('aaaa'); });

module.exports = promisefy;