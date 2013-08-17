angular.module('ra_log.resources', ['ngResource'])

    .factory('ra_log.http', ['$http', 'transformationService', function ($http, transformationService) {
        return function (url, postData) {
            var method = postData ? 'POST' : 'GET';
            return $http({
                method: method,
                url: RA_LOG_SERVER_URL + url,
                data: postData,
                transformResponse: transformationService.transformResponse
            })
        };
    }])

    .factory('ra_log.resource', ['$resource', 'alertService', 'transformationService',
        function ($resource, alertService, transformationService) {

            var defaultActions = {
                'get': {
                    method: 'GET'
                },
                'query': {
                    method: 'GET',
                    isArray: true
                },
                'save': {
                    method: 'POST'
                }
            };


            return function (url, defaultParams, actions) {

                actions = actions ? actions : defaultActions;

                angular.forEach(actions, function(action) {
                    action.transformResponse = action.transformResponse
                        ? action.transformResponse
                        : transformationService.transformResponse;

                    if (action.method !== 'GET')
                        action.transformRequest = action.transformRequest
                            ? action.transformRequest
                            : transformationService.transformRequest;
                });

                return $resource(
                    RA_LOG_SERVER_URL + url,
                    defaultParams,
                    actions
                );
            };
        }])

    .factory('Chart', ['ra_log.resource', function (raLogResource) {
        return raLogResource('/chart/:name');
    }])

    .factory('ImportResource', ['ra_log.resource', function (raLogResource) {
        return raLogResource('/import/file', {}, {import: {method: 'POST'}})
    }]);

