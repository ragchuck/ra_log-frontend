var ra_log = angular.module('ra_log',
        ['ui.bootstrap', 'ngLocale', 'ra_log.services', 'ra_log.resources', 'ra_log.controllers', 'highcharts-ng', 'pascalprecht.translate']).
    config(['$routeProvider', '$locationProvider', '$provide', '$httpProvider', '$translateProvider',
        function($routeProvider, $locationProvider, $provide, $httpProvider, $translateProvider) {

            var routes = {
                chart: {
                    controller: 'ChartCtrl',
                    templateUrl:'view/chart.html'
                },
                profile: {
                    controller: 'ProfileCtrl',
                    templateUrl:'view/profile.html'}
            };

            $routeProvider.
                when('/', routes['chart']).
            //    when('/dashboard', routes['dashboard']).
                when('/profile', routes['profile']).
                when('/chart/:name', routes['chart']).
                when('/chart/:name/:year', routes['chart']).
                when('/chart/:name/:year/:month', routes['chart']).
                when('/chart/:name/:year/:month/:day', routes['chart']).
                otherwise({redirectTo:'/'});

            //$locationProvider.html5Mode(true);

            $translateProvider.useStaticFilesLoader({
                prefix: 'i18n/lang-',
                suffix: '.json'
            });

            $translateProvider.preferredLanguage(RA_LOG_LOCALE);

            $httpProvider.responseInterceptors.push(function($timeout, $q, alertService) {
                return function(promise) {
                    return promise.then(function(successResponse) {

                        if (successResponse.config.url.substr(-12) != '/import/file' && successResponse.config.method.toUpperCase() != 'GET')
                            alertService.add('success', 'Request succeeded');

                        return successResponse;

                    }, function(errorResponse) {
                        console.error('Error:',errorResponse);
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
    }])

    .run(['importService', '$timeout', function(importService, $timeout) {
        $timeout(function() {
            importService.start();
        }, 1000);
    }]);