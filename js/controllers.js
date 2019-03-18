angular.module('ra_log.controllers', ['ngSanitize', 'ra_log.config'])

.controller('AppCtrl',
    ['$rootScope', '$scope', 'notify', 'localDB', 'ra_log.charts' ,
    function($rootScope, $scope, notify, localDB, CHARTS) {

        const DEFAULT_CSS = "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css";
        const BOOTSTRAP_CDN = "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.7";

        var themes = [{name: "Default", url: DEFAULT_CSS},{}];
        angular.forEach([
            "cerulean",
            "cosmo",
            "cyborg",
            "darkly",
            "flatly",
            "journal",
            "lumen",
            "paper",
            "readable",
            "sandstone",
            "simplex",
            "slate",
            "solar",
            "spacelab",
            "superhero",
            "united",
            "yeti"
            ], function(t) { 
                themes.push({
                    name: t[0].toUpperCase() + t.substring(1), 
                    url: BOOTSTRAP_CDN +  "/" + t + "/bootstrap.min.css"
                });
            });

        $scope.themes = themes;
        $scope.currentTheme = themes[0];

            $scope.charts = CHARTS;

        // var highchartThemes = [{name: "Default", options: null},{}];
        // angular.forEach([
        //     'avocado',
        //     'dark-blue',
        //     'dark-green',
        //     'dark-unica',
        //     'gray',
        //     'grid',
        //     'grid-light',
        //     'sand-signika',
        //     'skies',
        //     'sunset'
        //     ], function(t) {
        //         highchartThemes.push({
        //             name: t, url: 'https://code.highcharts.com/stock/themes/' + t + '.js'
        //         });
        //     });

        // $scope.chartThemes = highchartThemes;
        // $scope.currentChartTheme = highchartThemes[0];

        //var chartThemes = [];
        //angular.forEach(["skies", "grid", "gray", "dark-green", "dark-blue"],
        //    function(t) { this.push({name: t, url: "vendor/highcharts/themes/" + t + ".js"});
        //}, chartThemes);

        //$scope.chartThemes = chartThemes;
        //$scope.currentChartTheme = chartThemes[2];


        localDB.get('_local/currentTheme').then(function(doc){
            $scope.currentTheme = doc.theme;
            $scope.currentThemeDoc = doc;
            console.log('Loaded theme', doc.theme.name);
        }).catch(function(err) {
            console.log('Local currentTheme not found, setting to default.');
            localDB.put({
                _id : '_local/currentTheme', 
                theme: themes[0]
            }).then(function(doc){
                $scope.currentThemeDoc = doc;
            }).catch(function(err) {
                console.log(err)
            });
        });



        $scope.$on('themeSelection', function(e, theme, type) {
            if (type === 0) {
                console.log('Loading Bootstrap theme "' + theme.name + '"');
                $scope.currentTheme = theme;
                $scope.currentThemeDoc.theme = theme;
                localDB.put($scope.currentThemeDoc).then(function(doc) {
                    $scope.currentThemeDoc._rev = doc.rev;
                    notify.success('Saved "' + theme.name + '" as your theme.');
                }).catch(function(err) {
                    notify.error(err.message)
                });
            } else {
                $scope.currentChartTheme = theme;
            }
        })
    }
    ])

    // .controller('StatusCtrl', 
    //     ['$scope',
    //         function($scope) {
        // [{
        //     "type": "View Group Indexer",
        //     "task": "ralog-sma-data-test _design/SMA_MeanPublic",
        //     "status": "Processed 5714 of 25151 changes (22%)",
        //     "pid": "<0.3788.16>"
        // }]   
    //         }
    //     ])

    .controller('NotificationCtrl',
        ['$scope',
        function($scope) {

            $scope.alerts = [];

                // root binding for notify
                $scope.closeAlert = function(index) {
                    $scope.alerts.splice(index, 1);
                };

                $scope.$on('notify', function(e, msg) {
                    var idx = $scope.alerts.push(msg);
                    $scope.$apply();

                    if (msg.type === 'success') {
                        setTimeout(function() {
                            $scope.alerts.splice(idx-1, 1);
                            $scope.$apply();
                        }, 3000)
                    }
                });
            }
            ])


    .controller('NavCtrl',
        ['$scope', '$location', 'themeSelection', 
        function ($scope, $location, themeSelection) {

            $scope.isActivePage = function (page, idx) {
                idx = idx === undefined ? 1 : idx;
                var currentRoute = $location.path().split('/')[idx];
                return page === currentRoute;
            };

            $scope.loadTheme = function(themeUrl, type) {
                themeSelection(themeUrl, type);
            };

        },
        ])

    .controller('ChartCtrl',
        ['$scope', '$routeParams', '$location', '$route', '$filter', 'notify', 'dateCalculator',
        function($scope, $routeParams, $location, $route, $filter, notify, _dateAdd) {

            var _format = $filter('date');
            var lastChartName;
            var _updateChart = function() {

                var chartName = $route.current.params.name || 'day';

                if (lastChartName === chartName) {
                    _updateSeries();
                    return;
                }

                console.log('_updateChart', chartName);

                var currentChart;
                angular.forEach($scope.charts, function(chart) {
                    if (chart.name === chartName)
                        currentChart = chart;
                });

                if (!currentChart) {
                    notify.error('Chart <b>' + chartName + '</b> not found!');
                    return;
                }

                $scope.currentChart = currentChart;

                _updateSeries();

                lastChartName = chartName;
            };

            var lastDate;
            var _updateSeries = function() {

                var chartName = $route.current.params.name || 'day';
                var date = new Date(Date.UTC(
                    ($route.current.params.year),
                    ($route.current.params.month || 1) - 1,
                    ($route.current.params.day || 1),
                    0, 0, 0
                    ));

                if(!angular.isDate(date) || isNaN( date.getTime() )) {
                    date = new Date();
                    date.setHours(0, 0, 0, 0);
                }

                if (lastDate === date && lastChartName === chartName) return;

                console.log('_updateSeries', chartName, date.toJSON());

                lastDate = date;

                //$route.title = _format(date, 'longDate');

                $scope.currentChart.showLoading = 'Loading...';

                var series = angular.copy($scope.currentChart.series);

                if (!angular.isArray(series))
                    series = [series];

                var seriesLoading = series.length;
                var dataExists = false;
                var s = 0;

                angular.forEach(series, function(plot) {
                    plot.data = null;
                    plot.query(date).then(function(data) {

                        $.extend(true, plot, data);
                        dataExists = dataExists || data.length;

                        //console.log(plot.data);

                        if(++s === seriesLoading) {
                            $scope.currentChart.showLoading = dataExists ? false : 'no data available';
                            $scope.$apply();
                        }
                    }).catch(function(err){
                        notify.error(err.message);
                        console.log(err);
                    });
                });
                //console.log(series);

                //$scope.currentChart.series = series;
                $scope.currentChart.options.series = series;

                var charts = ["day", "month", "year"],
                urlDates = ["yyyy/MM/dd", "yyyy/MM", "yyyy"],
                displayDates = ["d. MMMM y", "MMMM y", "y"],
                idx = $.inArray(chartName, charts);

                // cleanup former watches
                if ($scope.seriesUnbind)
                    $scope.seriesUnbind();

                if (idx < 0) {
                    $scope.pager = {show : false};
                    return;
                }

                var chart, 
                today = new Date(),
                    inbd = new Date(2009, 8, 1); // Inbetriebnahme

                $scope.dpOptions = {
                    //dateDisabled: disabled,
                    datepickerMode: charts[idx],
                    maxDate: today,
                    minDate: inbd,
                    minMode: charts[idx],
                    startingDay: 1,
                    showWeeks: false
                };

                $scope.currentChart.subtitle = _format(date, displayDates[idx]);


                $scope.pager = {
                    show : true,
                    next : _dateAdd(date, chartName, 1) < today ? _dateAdd(date, chartName, 1) : null,
                    prev : _dateAdd(date, chartName, -1) > inbd ?  _dateAdd(date, chartName, -1) : null,
                    idx : idx,
                    charts : charts,
                    date : date,
                    urlDates : urlDates,
                    displayDates : displayDates
                };

                $scope.dpDate = date;

                
                if (charts[idx-1]) {
                    $scope.seriesUnbind = $scope.$on('chart.series.click', function($event, chartEvent) {
                        $event.stopPropagation();

                        if (!chartEvent.point.x) return;

                        var _date = new Date(chartEvent.point.x),
                        path = '/chart/' + charts[idx-1] + '/' + _format(_date, urlDates[idx-1]);


                        $location.path(path);

                        // let angular know that something changed
                        $scope.$apply();
                    });
                }


                // Update table
                /*raLogResource('/table?year=:year&month=:month&day=:day',{
                        year: date.getFullYear(),
                        month: date.getMonth() + 1,
                        day: date.getDate()
                    }).query(function(rows){
                        $scope.rows = rows;
                    });*/

                };




                
                $scope.dpPopup = {
                    opened: false
                };
                $scope.dpOpen = function() {
                    $scope.dpPopup.opened = true;
                };


                _updateChart();

                var lastRoute = $route.current;

                $scope.$on('$locationChangeSuccess', function(evt) {
                    // First check if we're still in on the chart page
                    if ($route.current.$$route.controller === 'ChartCtrl') {

                        // now we can update the chart
                        _updateChart();

                        // prevent reloading the view
                        $route.current = lastRoute;
                    }
                });


                $scope.$watch('dpDate', function(newDate, oldDate) {

                    var pager = $scope.pager;

                    if (!pager || newDate === pager.date) return;

                    var path = '/chart/' + $scope.currentChart.name + '/' + _format(newDate, pager.urlDates[pager.idx]);
                    
                    $location.path(path);
                });

            }
            ])


.controller('ProfileCtrl',
    ['$scope', function($scope) {

    }])

.controller('DashboardCtrl',
    ['$scope', 'ra_log.db', '$filter', 'notify', function($scope, db, $filter, notify) {

        var f = $filter('date');
        var date = new Date();

        var displays = [
            {
                caption: "Today",
                unit: "kwH",
                query: function() {
                    return db.query('MeanPublic/e_total',{
                        "group": true,
                        "startkey": [ f(date, 'yyyy') , f(date, 'MM') , f(date, 'DD') ],
                        "endkey": [ f(date, 'yyyy') , f(date, 'MM') , f(date, 'DD'), {}],
                    }).then(function(response) {
                        return JSON.stringify(response);
                    });
                }
            },
            {
                caption: "Month",
                unit: "kwH",
                query: function() {
                    return db.query('MeanPublic/e_total',{
                        "group_level": 1,
                        "startkey": [ f(date, 'yyyy') , f(date, 'MM') ],
                        "endkey": [ f(date, 'yyyy') , f(date, 'MM') , {}],
                    }).then(function(response) {
                        return JSON.stringify(response);
                    });
                }
            },
            {
                caption: "Year",
                unit: "kwH",
                query: function() {
                    return db.query('MeanPublic/e_total',{
                        "group_level": 2,
                        "startkey": [ f(date, 'yyyy') ],
                        "endkey": [ f(date, 'yyyy') , {}],
                    }).then(function(response) {
                        return JSON.stringify(response);
                    });

                }
            },
            {
                caption: "Total",
                unit: "kwH",
                query: function() {
                    var key = "WRTL1EBA:2100122532:E-Total";
                    return db.query('MeanPublic/by_key_and_time', {
                        "startkey": [ key, {}] ,
                        "endkey": [ key ],
                        "limit": 1,
                        "descending": true
                    }).then(function(response) {
                        return JSON.stringify(response);
                    });
                }
            }
        ];

        angular.forEach(displays, function(display) {
            display.query().then(function(data) {

                display.value = data;
                $scope.$apply();

            }).catch(function(err){
                notify.error(err.message);
                console.log(err);
            });
        });

        $scope.displays = displays;
    }]);

