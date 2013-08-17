/* services.js */

// don't forget to declare this service module as a dependency in your main app constructor!
angular.module('ra_log.services', [])

    .factory('alertService', ['$rootScope', function ($rootScope) {
        return {
            add: function (type, msg) {
                $rootScope.$broadcast('alert', {'type': type, 'msg': msg});
            }
        };
    }])

    .factory('transformationService', [function () {
        return {
            transformResponse: function (response) {

                try {
                    var data = angular.fromJson(response);

                    if (data.status == 'OK') {
                        return data.result;
                    }
                } catch (error) {
                    return error;
                }

                return null;
            },

            transformRequest: function (data) {
                return data;
            }

        };
    }])

    .factory('importService', ['$rootScope', 'ra_log.http', function ($rootScope, raLogHttp) {
        var ImportService = function() {
            this._state = "initialized";
            this.filesQueue = [];
            this.filesProcessed = [];
            this.filesCount = 0;
            this.currentFile = null;
            this.last_response = null; // stores the last response if paused
        };

        ImportService.prototype.getState = function() {
            return this._state;
        };

        ImportService.prototype.setState = function(newState) {
            var oldState = this._state;
            this.triggerEvent('importService.statechanged', {state: newState, oldState: oldState});
            this._state = newState;
        };


        ImportService.prototype.triggerEvent = function(eventName, additionalData) {
            var processed = this.filesProcessed.length,
                count = this.filesCount,
                progress = processed / count * 100,
                data = {
                data: this.last_response,
                state: this.getState(),
                currentFile: this.currentFile,
                progress: progress,
                progressText: processed + '/' + count
            };
            data = angular.extend(data, additionalData);

            $rootScope.$broadcast(eventName, data);
        };

        ImportService.prototype.start = function () {

            if (this.getState() !== "initialized" && this.getState() !== "succeeded") {
                throw new Error("Cannot start importing while current state is '" + this.getState() + "'.");
            }

            this.filesProcessed = [];
            this.filesQueue = [];
            this.filesCount = 0;

            this.setState('running');

            var importService = this;

            raLogHttp('/import/files')
                .success(function (files) {
                    console.log('ImportService: ' + files.length + ' new files found.');
                    importService.filesQueue = files;
                    importService.filesCount = files.length;
                    if (files.length > 0) {
                        importService._loadNext();
                    }
                })
                .error(function() {
                    importService.fail();
                });
        };


        ImportService.prototype.pause = function() {
            this.setState('paused');
        };

        ImportService.prototype.resume = function() {
            if (this.getState() !== "paused")
                throw new Error("Cannot resume importing when import state is '" + this.getState() + "'")

            this.setState('running');
            this._loadNext(this.last_response);
        };

        ImportService.prototype.fail = function() {
            this.setState('failed');
        };

        ImportService.prototype.recover = function() {
            if (this.getState() !== "failed")
                throw new Error("Cannot resume importing when import state is '" + this.getState() + "'")

            this.setState('running');
            this._loadNext();
        };

        ImportService.prototype._loadNext = function (response) {

            this.last_response = response;
            this.currentFile = null;

            // Abort here if the import isn't running
            if (this.getState() !== "running") return;

            if (this.filesQueue.length > 0) {

                this.currentFile = this.filesQueue[0];
                this.filesProcessed.push(this.filesQueue.shift());

                var importService = this;

                raLogHttp('/import/file', {file: this.currentFile})
                    .success(function(response) {
                        importService._loadNext(response);

                        // Tell the listeners that we're progressing
                        importService.triggerEvent('importService.progress', {
                            data: response
                        });
                    })
                    .error(function () {
                        importService.fail();
                    });


            } else {
                // Tell the listeners that we've finished
                this.setState('succeeded');
            }
        };
        return new ImportService;
    }]);