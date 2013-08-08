var ra_log = angular.module('ra_log', ['ui.bootstrap', 'ngResource', 'ngLocale', 'ra_log.services', 'highcharts-ng']).
    config(['$routeProvider', '$locationProvider', '$provide', '$httpProvider', function($routeProvider, $locationProvider, $provide, $httpProvider) {

        $routeProvider.
            when('/',{controller: 'ChartCtrl', templateUrl:'view/chart.html'}).
            when('/dashboard',{controller: 'DashboardCtrl', templateUrl:'view/chart.html'}).
            when('/profile',{controller: 'ProfileCtrl', templateUrl:'view/profile.html'}).
            when('/chart/:name',{controller: 'ChartCtrl', templateUrl:'view/chart.html', reloadOnSearch: false}).
            when('/chart/:name/:year',{controller: 'ChartCtrl', templateUrl:'view/chart.html', reloadOnSearch: false}).
            when('/chart/:name/:year/:month',{controller: 'ChartCtrl', templateUrl:'view/chart.html', reloadOnSearch: false}).
            when('/chart/:name/:year/:month/:day',{controller: 'ChartCtrl', templateUrl:'view/chart.html', reloadOnSearch: false}).
            otherwise({redirectTo:'/'});

        //$locationProvider.html5Mode(true);

        $httpProvider.responseInterceptors.push(function($timeout, $q, alertService) {
            return function(promise) {
                return promise.then(function(successResponse) {

                    if (successResponse.config.method.toUpperCase() != 'GET')
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
    }]);

ra_log.controller('NavCtrl', ['$scope', '$location', function ($scope, $location) {
    $scope.isActivePage = function (page) {
        var currentRoute = $location.path().substring(1) || 'home';
        return page === currentRoute;
    };
}]);

ra_log.controller('AppCtrl', ['$rootScope', '$location', 'alertService', '$locale', function($rootScope, $location, alertService, $locale) {
    $rootScope.changeView = function(view) {
        $location.path(view);
    };

    // root binding for alertService
    $rootScope.closeAlert = alertService.closeAlert;

    Highcharts.setOptions({
        lang: {
            contextButtonTitle: 'Chart context menu',
            downloadJPEG: 'Download JPEG image',
            downloadPDF: 'Download PDF document',
            downloadPNG: 'Download PNG image',
            downloadSVG: 'Download SVG vector image',
            loading: 'Loading...',
            printChart: 'Print chart',
            resetZoom: 'Reset zoom',
            resetZoomTitle: 'Reset zoom level 1:1',
            thousandsSep: $locale.NUMBER_FORMATS.GROUP_SEP,
            decimalPoint: $locale.NUMBER_FORMATS.DECIMAL_SEP,
            months: $locale.DATETIME_FORMATS.MONTH,
            //numericSymbols: null,
            shortMonths: $locale.DATETIME_FORMATS.SHORTMONTH,
            weekdays: $locale.DATETIME_FORMATS.DAY
        }
    });
}]);

ra_log.controller('ChartListCtrl', ['$scope', '$routeParams', 'Chart', function($scope, $routeParams, Chart) {
    var currentChartName = $routeParams.name || 'day';
    $scope.isActiveChart = function(chartName) {
        return currentChartName == chartName;
    };
    if(!$scope.charts)
        $scope.charts = Chart.query();
}]);

ra_log.controller('ChartCtrl', ['$scope', '$routeParams', '$location', 'ra_log.resource', 'Chart', '$route', '$filter',
    function($scope, $routeParams, $location, raLogResource, Chart, $route, $filter) {
    /*var Chart = rlResource('/charts');

    Chart.query(function(charts){
        // Make the first chart active
        charts[0].active = true;
        $scope.charts = charts;
    });*/


        var lastRoute = $route.current;
        var currentChartName = $routeParams.name || 'day';

        var _dateAdd =function (objDate, sInterval, iNum) {
            var objDate2 = new Date(objDate);
            if (!sInterval || iNum == 0) return objDate2;
            switch (sInterval.toLowerCase()) {
                case "day":
                    objDate2.setDate(objDate2.getDate() + iNum);
                    break;
                case "month":
                    objDate2.setMonth(objDate2.getMonth() + iNum);
                    break;
                case "year":
                    objDate2.setFullYear(objDate2.getFullYear() + iNum);
                    break;
            }
            return objDate2;
        };

        var _format = $filter('date');

        var _updateSeries = function() {

            var chartName = $route.current.params.name;
            var momentStr = $route.current.params.year + '/' + ($route.current.params.month || 1) + '/' + ($route.current.params.day || 1);
            var date = new Date($route.current.params.year, $route.current.params.month - 1 || 1, $route.current.params.day || 1);

            if(!angular.isDate(date) || isNaN( date.getTime() )) {
                date = new Date();
            }

            $scope.currentChart.subtitle = _format(date, 'longDate');

            angular.forEach($scope.currentChart.series, function(plot) {
                raLogResource(plot.url).query({date: _format(date, 'yyyyMMdd')}, function(rawSeries) {
                    plot.data = new Array();

                    angular.forEach(rawSeries, function(s) {
                        plot.data.push([parseInt(s.x), parseFloat(s.y)]);
                    });
                });
            });

            var idx = $.inArray(chartName, ["day", "month", "year"]);

            if (idx > -1) {
                $scope.next = _dateAdd(date, chartName, 1);
                $scope.prev = _dateAdd(date, chartName, -1);
                $scope.idx = idx;
                $scope.urlDate = ["yyyy/MM/dd", "yyyy/MM", "yyyy"];
            }


            if(currentChartName === chartName) {
                // prevent reloading view
                $route.current = lastRoute;
            }

        }



        $scope.$on('$locationChangeSuccess', _updateSeries);
        $scope.currentChart = Chart.get({name: currentChartName}, _updateSeries);




/*

 var currentChart;
 angular.forEach(charts, function(chart) {
 if(chart.name == $routeParams.name) {
 currentChart = chart;
 }
 });
 $scope.currentChart = currentChart;

        if (currentChart) {
            var momentStr = $routeParams.year + '/' + ($routeParams.month || 1) + '/' + ($routeParams.day || 1),
                date = moment(momentStr);
            date = date.isValid() ? date : moment();

            angular.forEach(currentChart.series, function(plot) {

                var ChartSeries = raLogResource(plot.url);
                ChartSeries.query({date: date.format('YYYYMMDD')}, function(rawSeries) {
                    plot.data = new Array();

                    angular.forEach(rawSeries, function(s) {
                        plot.data.push([parseInt(s.x), parseFloat(s.y)]);
                    });
                });
            });
            currentChart.subtitle = date.format('LL');
            console.log(currentChart);
            $scope.currentChart = currentChart;
        } else {
            $scope.currentChart = null;
        }*/
}]);

ra_log.controller('ProfileCtrl', ['$scope', function($scope) {

}]);

ra_log.controller('DashboardCtrl', ['$scope', function($scope) {

}]);

