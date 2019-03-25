var ra_log = angular.module('ra_log', [
		'ui.bootstrap', 
		'ngLocale', 	
        'ngRoute',
        'ngAnimate',
        'angularMoment',
        'ra_log.config',
		'ra_log.services', 
		'ra_log.resources', 
		'ra_log.controllers', 
		'highcharts-ng'
	])
    .config(['$routeProvider', 
        function($routeProvider) {

         var routes = {
            chart: {
                controller: 'ChartCtrl',
                templateUrl:'view/chart.html'
            },
            dashboard: {
                controller: 'DashboardCtrl',
                templateUrl:'view/dashboard.html'
            },
            profile: {
                controller: 'ProfileCtrl',
                templateUrl:'view/profile.html'
            }
        };

        $routeProvider.
            when('/', routes['dashboard']).
            when('/chart', routes['chart']).
            when('/chart/:name', routes['chart']).
            when('/chart/:name/:year', routes['chart']).
            when('/chart/:name/:year/:month', routes['chart']).
            when('/chart/:name/:year/:month/:day', routes['chart']).
            when('/dashboard', routes['dashboard']).
            when('/profile', routes['profile']).
            otherwise({redirectTo:'/'});

        //$locationProvider.html5Mode(true);
}]);