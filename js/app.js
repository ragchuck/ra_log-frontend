var ra_logApp = angular.module('ra_log', ['ui.bootstrap', 'ngResource', 'ra_log.services']).
    config(function($routeProvider, $locationProvider, $provide, $httpProvider) {
        $routeProvider.
            when('/', {controller: SingleChartCtrl, templateUrl:'view/chart.html'}).
            when('/dashboard', {controller: DashboardCtrl, templateUrl:'view/chart.html'}).
            when('/profile', {controller: ProfileCtrl, templateUrl:'view/profile.html'}).
            when('/chart/:year', {controller: SingleChartCtrl, templateUrl:'view/chart.html'}).
            otherwise({redirectTo:'/'});

        //$locationProvider.html5Mode(true);

        $httpProvider.responseInterceptors.push(function($timeout, $q, alertService) {
            return function(promise) {
                return promise.then(function(successResponse) {

                    if (successResponse.config.method.toUpperCase() != 'GET')
                        alertService.add('success', 'Request succeeded');

                    if (successResponse.data.status) {
                        console.log("It's a SLIM resource:", successResponse);
                    }

                    return successResponse;

                }, function(errorResponse) {
                    switch (errorResponse.status) {
                        case 401:
                            alertService.add('error', 'Wrong usename or password!');
                            break;
                        case 403:
                            alertService.add('error', 'You don\'t have the right to do this!');
                            break;
                        case 404:
                            alertService.add('error', 'The requested URL '+errorResponse.config.url+' was not found on the server.');
                            break;
                        case 500:
                            alertService.add('error', 'Server internal error!' + errorResponse.data);
                            break;
                        default:
                            alertService.add('error', 'Error ' + errorResponse.status + ': ' + errorResponse.data);
                    }
                    return $q.reject(errorResponse);
                });
            };
        });
    });

ra_logApp.controller('NavCtrl', ['$scope', '$location', function ($scope, $location) {
    $scope.navClass = function (page) {
        var currentRoute = $location.path().substring(1) || 'home';
        return page === currentRoute ? 'active' : '';
    };
}]);

ra_logApp.controller('AppCtrl', ['$rootScope', '$location', 'alertService', function($rootScope, $location, alertService) {
    $rootScope.changeView = function(view) {
        $location.path(view);
    }

    // root binding for alertService
    $rootScope.closeAlert = alertService.closeAlert;
}]);



function SingleChartCtrl($scope, $routeParams, ra_logResource) {
    var Chart = ra_logResource('/chartsd');

    Chart.query(function(charts){
        $scope.charts = charts;
    });
};

function ProfileCtrl($scope) {

}
function DashboardCtrl($scope) {

}


ra_logApp.factory('ra_logResource', ['$resource', 'alertService', function($resource, alertService) {
    return function (url, params)
    {
        url = _RA_LOG_SERVER_URL + url;

        function _retrieveData(response) {
            var data = angular.fromJson(response);

            if (data.status == 'OK')
                return data.result;

            //alertService.add('error', 'Status: ' + data.status + '<br>' + data.result);

            return null;
        }
        function _decorateData(data) {

            var modifiedData = {}
            modifiedData[resourceType] = data
            return modifiedData;
        }


        return $resource(
            url,
            params,
            {
                'get':    {method:'GET', transformResponse: _retrieveData},
                'query':  {method:'GET', isArray:true, transformResponse: _retrieveData},
                'save':   {method:'POST', transformRequest: _decorateData, transformResponse: _retrieveData }
            }
        );
    };
}])
