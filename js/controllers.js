/**
 * Created with JetBrains PhpStorm.
 * User: Martin
 * Date: 10.08.13
 * Time: 13:55
 * To change this template use File | Settings | File Templates.
 */


angular.module('ra_log.controllers', [])

    .controller('AppCtrl',
        ['$scope',
            function($scope) {

            }
        ])

    .controller('AlertCtrl',
        ['$scope',
            function($scope) {

                $scope.alerts = [];

                // root binding for alertService
                $scope.closeAlert = function(index) {
                    $scope.alerts.splice(index, 1);
                };

                $scope.$on('alert', function(e, alert) {
                    $scope.alerts.push(alert);
                });
            }
        ])


    .controller('NavCtrl',
        ['$scope', '$location',
            function ($scope, $location) {
                $scope.isActivePage = function (page) {
                    var currentRoute = $location.path().split('/')[1] || 'home';
                    return page === currentRoute;
                };
            }
        ])

    .controller('InfoCtrl',
        ['$scope',
            function ($scope) {

            }
        ])

    .controller('ChartCtrl',
        ['$scope', '$routeParams', '$location', 'ra_log.resource', 'Chart', '$route', '$filter',
            function($scope, $routeParams, $location, raLogResource, Chart, $route, $filter) {

                var _dateAdd = function (objDate, sInterval, iNum) {
                    var objDate2 = new Date(objDate);
                    if (!sInterval || iNum == 0) return objDate2;
                    switch (sInterval.toLowerCase()) {
                        case "day": return objDate2.setDate(objDate2.getDate() + iNum);
                        case "month": return objDate2.setMonth(objDate2.getMonth() + iNum);
                        case "year": return objDate2.setFullYear(objDate2.getFullYear() + iNum);
                    }
                    return objDate2;
                };

                var _format = $filter('date');

                var lastChartName;
                var _updateChart = function() {

                    var chartName = $route.current.params.name || 'day';

                    console.log('_updateChart', chartName);

                    if (lastChartName === chartName) {
                        _updateSeries();
                        return;
                    }

                    var currentChart;
                    angular.forEach($scope.charts, function(chart) {
                        if (chart.name === chartName)
                            currentChart = chart;
                    });

                    $scope.currentChart = currentChart;

                    _updateSeries();

                    lastChartName = chartName;
                };

                var lastDate;
                var _updateSeries = function() {

                    var chartName = $route.current.params.name || 'day';
                    var date = new Date(
                        $route.current.params.year,
                        $route.current.params.month - 1 || 1,
                        $route.current.params.day || 1
                    );

                    if(!angular.isDate(date) || isNaN( date.getTime() )) {
                        date = new Date();
                    }

                    console.log('_updateSeries', chartName, date);

                    if (lastDate === date && lastChartName === chartName) return;

                    //$route.title = _format(date, 'longDate');

                    $scope.showLoading = true;

                    var series = angular.copy($scope.currentChart.series);

                    if (!angular.isArray(series))
                        series = [series];

                    var availableParams = {
                            date_yyyymmdd: _format(date, 'yyyyMMdd'),
                            date_yyyymm: _format(date, 'yyyyMM'),
                            date_yyyy: _format(date, 'yyyy')
                        };

                    var seriesLoading = series.length;
                    var s = 0;

                    angular.forEach(series, function(plot) {
                        var queryParams = {};
                        plot.data = [];

                        angular.forEach(plot.params, function(param) {
                            if(availableParams[param])
                                queryParams[param] = availableParams[param];
                        });

                        raLogResource(plot.url).query(queryParams, function(rawSeries) {

                            angular.forEach(rawSeries, function(s) {
                                plot.data.push([parseInt(s.x), parseFloat(s.y)]);
                            });

                            if(++s === seriesLoading)
                                $scope.showLoading = false;
                        });
                    });

                    $scope.currentChart.series = series;

                    var charts = ["day", "month", "year"];
                    var urlDates = ["yyyy/MM/dd", "yyyy/MM", "yyyy"];
                    var displayDates = ["d. MMMM y", "MMMM y", "y"];
                    var idx = $.inArray(chartName, charts);


                    $scope.currentChart.subtitle = _format(date, displayDates[idx]);

                    if (idx > -1) {
                        $scope.pager = {
                            next : _dateAdd(date, chartName, 1),
                            prev : _dateAdd(date, chartName, -1),
                            idx : idx,
                            charts : charts,
                            date : date,
                            urlDates : urlDates,
                            displayDates : displayDates
                        };

                        if (charts[idx-1]) {
                            $scope.$on('chart.series.click', function($event, chartEvent) {
                                $event.stopPropagation();
                                var _date = new Date(chartEvent.point.x),
                                    path = '/chart/' + charts[idx-1] + '/' + _format(_date, urlDates[idx-1]);
                                $location.path(path);

                                // let angular know that something changed
                                $scope.$apply();
                            });
                        }
                    }

                    // Update table
                    raLogResource('/table?year=:year&month=:month&day=:day',{
                            year: date.getFullYear(),
                            month: date.getMonth() + 1,
                            day: date.getDate()
                        }).query(function(rows){
                            $scope.rows = rows;
                        });

                    lastDate = date;
                };

                $scope.showLoading = true;
                $scope.charts = Chart.query(_updateChart);

                var lastRoute = $route.current;

                $scope.$on('$locationChangeSuccess', function() {
                    _updateChart();

                    // prevent reloading view
                    $route.current = lastRoute;
                });
            }
        ])

    .controller('ImportCtrl',
        ['$scope', 'importService', '$timeout',
            function($scope, importService, $timeout) {
                if (!RA_LOG_SHOW_IMPORT_PROGRESS) return;

                $scope.show = false;

                var stateMap = {
                    running: 'progress-success progress-striped active',
                    failed: 'progress-striped progress-danger',
                    paused: 'progress-striped progress-info',
                    succeeded: 'progress-success'
                };

                $scope.$on('importService.statechanged', function($event, event) {
                    console.log('importService.statechanged',event.state);
                    if (event.state === 'running') {
                        $scope.show = true;
                    } else if (event.state === 'succeeded') {
                        var hide = $timeout(function() {
                            $scope.show = false;
                        }, 1500);
                    }
                    $scope.progress = event.progress;
                    $scope.progressClass = stateMap[event.state];
                });

                $scope.$on('importService.progress', function($event, event) {
                    $scope.info = event.currentFile || event.state;
                    $scope.progress = event.progress;
                    $scope.progressClass = stateMap[event.state];
                    $scope.progressText = event.progressText + ' files - ' + event.progress + '%'
                });

                $scope.start = function() {
                    if (importService.getState() === 'paused')
                        importService.resume();
                    else
                        importService.start();
                };
                $scope.pause = function() {
                    importService.pause();
                };
                $scope.recover = function() {
                    importService.recover();
                };
            }
        ])

    .controller('ProfileCtrl',
        ['$scope',
            function($scope) {

            }
        ])

    .controller('DashboardCtrl',
        ['$scope',
            function($scope) {

            }
        ]);

