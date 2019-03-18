'use strict';

angular.module('highcharts-ng', [])

    .directive('highchart', [ '$window', '$locale', function ($window, $locale) {
        var seriesId = 0;
        var ensureIds = function (series) {
            angular.forEach(series,function (s) {
                if (!angular.isDefined(s.id)) {
                    s.id = "series-" + seriesId++;
                };
            });
        };

        var defaultOptions = Highcharts.setOptions({
            global: {
                useUTC: false
            },
            lang: {
                thousandsSep: $locale.NUMBER_FORMATS.GROUP_SEP,
                decimalPoint: $locale.NUMBER_FORMATS.DECIMAL_SEP,
                months: $locale.DATETIME_FORMATS.MONTH,
                //numericSymbols: null,
                shortMonths: $locale.DATETIME_FORMATS.SHORTMONTH,
                weekdays: $locale.DATETIME_FORMATS.DAY,
                loading: 'Loading...'
            }
        });

        defaultOptions = angular.copy(defaultOptions);

        return {
            restrict: 'EC',
            replace: false,
            scope: {
                ngModel: '='
            },
            require: 'ngModel',
            link: function ($scope, element, attrs) {

                var defaultChartOptions = {
                    title:  {"text": null},
                    subtitle: {"text": null},
                    series: [],
                    chart: {
                        renderTo: element[0],
                        width: $(element[0]).parent().width(),
                        height: $(element[0]).parent().width() * 0.4,
                        events: {
                            addSeries:  function(event) { $scope.$emit('chart.addSeries', event, this)},
                            click:      function(event) { $scope.$emit('chart.click', event, this)},
                            load:       function(event) { $scope.$emit('chart.load', event, this)},
                            redraw:     function(event) { $scope.$emit('chart.redraw', event, this)},
                            selection:  function(event) { $scope.$emit('chart.selection', event, this)}
                        }
                    },
                    credits: {},
                    plotOptions: {
                        series: {
                            events: { 
                                checkboxClick:      function(event) { $scope.$emit('chart.series.checkboxClick', event, this)},
                                click:              function(event) { $scope.$emit('chart.series.click', event, this);},
                                hide:               function(event) { $scope.$emit('chart.series.hide', event, this);},
                                legendItemClick:    function(event) { $scope.$emit('chart.series.legendItemClick', event, this);},
                                mouseOut:           function(event) { $scope.$emit('chart.series.mouseOut', event, this);},
                                mouseOver:          function(event) { $scope.$emit('chart.series.mouseOver', event, this);},
                                show:               function(event) { $scope.$emit('chart.series.show', event, this);}
                            }
                        }
                    },
                    responsive: {
                        rules: [{
                            condition: {
                                maxWidth: 500
                            },
                            chartOptions: {
                                legend: {
                                    enabled: false
                                },
                                yAxis: {
                                    labels: {
                                        align: 'left',
                                        x: 0,
                                        y: -5
                                    },
                                    title: {
                                        text: null
                                    }
                                },
                                xAxis: {
                                    title: {
                                        text: null
                                    }
                                },
                                credits: {
                                    enabled: false
                                }
                            }
                        }]
                    }
                };

                var chart;
                var _createChart = function (type, options) {

                    if (chart)
                        chart.destroy();

                    if (options.series)
                        ensureIds(options.series);

                    var mergedOptions = $.extend(true, {}, defaultChartOptions, options)

                    //mergedOptions.title.text = $scope.ngModel.title || null;
                    //mergedOptions.subtitle.text = $scope.ngModel.subtitle || null;

                    chart = Highcharts[type || 'chart'](mergedOptions);
                };

                var _createSeries = function (series) {

                    ensureIds(series);
                    var ids = [];

                    // Find series to add or update
                    series.forEach(function (plot) {
                        ids.push(plot.id)
                        var chartSeries = chart.get(plot.id);
                        if (chartSeries) {
                            chartSeries.update(angular.copy(plot), false);
                        } else {
                            chart.addSeries(angular.copy(plot), false)
                        }
                    });

                    // Now remove any missing series
                    chart.series.forEach(function (plot) {
                        if (ids.indexOf(plot.options.id) < 0) {
                            plot.remove(false);
                        }
                    });

                    chart.redraw();
                };

                $scope.$watch("ngModel.theme", function(theme) {
                    if (!chart || !theme) return;

                    Highcharts.setOptions(defaultOptions);

                    if (theme.options) // Defaults are already set
                        Highcharts.setOptions(theme.options);

                    _createChart($scope.ngModel.type, $scope.ngModel.options);
                    _createSeries($scope.ngModel.series);
                });


                $scope.$watch("ngModel.showLoading", function(showLoading) {
                    if (!chart) return;

                    if (showLoading)
                        chart.showLoading(showLoading);
                    else
                        chart.hideLoading();
                });

                $scope.$watch("ngModel.series", function (newSeries, oldSeries) {
                    if (!chart || !newSeries) return;

                    //do nothing when called on registration
                    if (newSeries === oldSeries) return;

                    _createSeries(newSeries);
                }, true);

                $scope.$watch("ngModel.title", function (newTitle) {
                    if (!chart) return;
                    //chart.setTitle({text:newTitle});
                }, true);

                $scope.$watch("ngModel.subtitle", function (newTitle) {
                    if (!chart) return;
                    //chart.setTitle(null, {text:newTitle});
                }, true);

                $scope.$watch("ngModel.options", function (newOptions, oldOptions, scope) {

                    // do nothing when called on registration
                    if (angular.isUndefined(newOptions) || angular.equals(newOptions, oldOptions)) return;

                    // do nothing until stockChart series are available
                    if ($scope.ngModel.type === 'stockChart' && !newOptions.series) return;

                    _createChart($scope.ngModel.type, newOptions);
                }, true);

                if($scope.ngModel) {
                    _createChart($scope.ngModel.type, $scope.ngModel.options);
                }

                var _resizeChart = function() {

                    var w = $(element[0]).parent().width(),
                        h = $(element[0]).parent().width() * 0.56;

                    defaultChartOptions.chart.width = w;
                    defaultChartOptions.chart.height = h;

                    if (!chart)
                        return;

                    chart.setSize(w, h);
                };

                $(angular.element($window)).bind('resize', _resizeChart);

                angular.element(document).ready(_resizeChart);
            }
        }
    }]);