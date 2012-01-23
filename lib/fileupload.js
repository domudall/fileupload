var
	async = require('async'),
	fs = require('fs'),
	path = require('path');

module.exports.createFileUpload = function(uploadDir, logger) {

	logger = logger || console;

	fs.stat(uploadDir, function(error, stats) {
		if (error && error.code === 'ENOENT') {
			logger.info('Creating upload directory: ', uploadDir);
			fs.mkdir(uploadDir, '0755', function(error) {
				if (error) {
					throw error;
				}
			});
		}
	});

	return function(req, res, next) {
		async.forEach(Object.keys(req.files), function(key, eachCallback) {
			var
				files = req.files[key],
				filesArray = [];

			if (!Array.isArray(files)) {
				files = [files];
			}

			async.forEach(files, function(file, callback) {
				filesArray = [];

				if (typeof file.path === 'undefined' || file.size === 0) {
					return callback();
				}

				var hash = path.basename(file.path);

				fs.mkdir(uploadDir + '/' + hash, '0755', function(error) {

					var
						destPath = path.normalize(uploadDir + '/' + hash + '/' + file.name),
						readFile = fs.createReadStream(file.path),
						writeFile = fs.createWriteStream(destPath, { flags: 'w' });

					logger.info('Copying %s to %s', file.path, destPath);

					readFile.pipe(writeFile);
					readFile.on('end', function() {
						 filesArray.push({
							size: file.size,
							type: file.type,
							path: hash + '/',
							basename: file.name
						});
						callback();
					});
				});
			}, function() {
				req.body[key] = filesArray;
				eachCallback();
			});

		}, function(error) {
			next();
		});
	};
};