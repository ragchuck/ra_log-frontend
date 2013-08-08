ra_log.factory('ra_log.resource', ['$resource', 'alertService', function($resource, alertService) {
    return function (url, params)
    {

        function _retrieveData(response) {
            var data = angular.fromJson(response);

            if (data.status == 'OK') {
                return data.result;
            }

            //alertService.add('error', 'Status: ' + data.status + '<br>' + data.result);

            return null;
        }

        function _decorateData(data) {

            var modifiedData = {};
            modifiedData[resourceType] = data;
            return modifiedData;
        }

        return $resource(
            _RA_LOG_SERVER_URL + url,
            params,
            {
                'get':    {method:'GET', transformResponse: _retrieveData},
                'query':  {method:'GET', transformResponse: _retrieveData, isArray: true},
                'save':   {method:'POST', transformRequest: _decorateData, transformResponse: _retrieveData }
            }
        );
    };
}]);

ra_log.factory('Chart', ['ra_log.resource', function(raLogResource) {
    return raLogResource('/chart/:name');
}]);

