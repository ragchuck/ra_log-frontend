'use strict';

angular.module('highcharts-ng', [])
    .directive('highchart', [ '$locale', '$translate', function ($locale, $translate) {
        var seriesId = 0;
        var ensureIds = function (series) {
            angular.forEach(series,function (s) {
                if (!angular.isDefined(s.id)) {
                    s.id = "series-" + seriesId++;
                };
            });
        };

        Highcharts.setOptions({
            global: {
                useUTC: false
            },
            lang: {
                contextButtonTitle: $translate('HC_CONTEXTBUTTONTITLE'),
                downloadJPEG: $translate('HC_DOWNLOADJPEG'),
                downloadPDF: $translate('HC_DOWNLOADPDF'),
                downloadPNG: $translate('HC_DOWNLOADPNG'),
                downloadSVG: $translate('HC_DOWNLOADSVG'),
                loading: $translate('HC_LOADING'),
                printChart: $translate('HC_PRINTCHART'),
                resetZoom: $translate('HC_RESETZOOM'),
                resetZoomTitle: $translate('HC_RESETZOOMTITLE'),
                thousandsSep: $locale.NUMBER_FORMATS.GROUP_SEP,
                decimalPoint: $locale.NUMBER_FORMATS.DECIMAL_SEP,
                months: $locale.DATETIME_FORMATS.MONTH,
                //numericSymbols: null,
                shortMonths: $locale.DATETIME_FORMATS.SHORTMONTH,
                weekdays: $locale.DATETIME_FORMATS.DAY
            }
        });


        return {
            restrict: 'EC',
            replace: false,
            scope: {
                ngModel: '=',
                loading: '='
            },
            require: 'ngModel',
            link: function ($scope, element, attrs) {


                var _getMergedOptions = function (options) {
                    var defaultOptions = {
                        title: {},
                        subtitle: {},
                        series: [],
                        chart: {
                            renderTo: element[0],
                            width: $(element[0]).parent().width(),
                            events: {
                                addSeries: function(event) {
                                    $scope.$emit('chart.addSeries', event, this);
                                },
                                click: function(event) {
                                    $scope.$emit('chart.click', event, this);
                                },
                                load: function(event) {
                                    $scope.$emit('chart.load', event, this);
                                },
                                redraw: function(event) {
                                    $scope.$emit('chart.redraw', event, this);
                                },
                                selection: function(event) {
                                    $scope.$emit('chart.selection', event, this);
                                }
                            }
                        },
                        plotOptions: {
                            series: {
                                events: {
                                    checkboxClick: function(event) {
                                        $scope.$emit('chart.series.checkboxClick', event, this);
                                    },
                                    click: function(event) {
                                        $scope.$emit('chart.series.click', event, this);
                                    },
                                    hide: function(event) {
                                        $scope.$emit('chart.series.hide', event, this);
                                    },
                                    legendItemClick: function(event) {
                                        $scope.$emit('chart.series.legendItemClick', event, this);
                                    },
                                    mouseOut: function(event) {
                                        $scope.$emit('chart.series.mouseOut', event, this);
                                    },
                                    mouseOver: function(event) {
                                        $scope.$emit('chart.series.mouseOver', event, this);
                                    },
                                    show: function(event) {
                                        $scope.$emit('chart.series.show', event, this);
                                    }
                                }
                            }
                        }
                    };
                    var mergedOptions = {};
                    if (options) {
                        mergedOptions = $.extend(true, {}, options, defaultOptions);
                    } else {
                        mergedOptions = defaultOptions;
                    }
                    return mergedOptions;
                };

                var _createChart = function (options) {
                    var mergedOptions = _getMergedOptions(options);
                    mergedOptions.title.text = $scope.ngModel.title || null;
                    mergedOptions.subtitle.text = $scope.ngModel.subtitle || null;
                    return new Highcharts.Chart(mergedOptions);
                };

                var chart;

                $scope.$watch("loading", function(showLoading) {
                    if (!chart) return;
                    if (showLoading)
                        chart.showLoading();
                    else
                        chart.hideLoading();
                }, true);

                $scope.$watch("ngModel.series", function (newSeries, oldSeries) {
                    if (!chart) return;

                    //do nothing when called on registration
                    if (newSeries === oldSeries) return;
                    if (newSeries) {
                        ensureIds(newSeries);
                        var ids = [];

                        //Find series to add or update
                        newSeries.forEach(function (s) {
                            ids.push(s.id)
                            var chartSeries = chart.get(s.id);
                            if (chartSeries) {
                                chartSeries.update(angular.copy(s), false);
                            } else {
                                chart.addSeries(angular.copy(s), false)
                            }
                        });
                        //Now remove any missing series
                        chart.series.forEach(function (s) {
                            if (ids.indexOf(s.options.id) < 0) {
                                s.remove(false);
                            }
                        });
                        chart.redraw();
                    }

                }, true);
                $scope.$watch("ngModel.title", function (newTitle) {
                    if (!chart) return;
                    chart.setTitle({text:newTitle});
                }, true);
                $scope.$watch("ngModel.subtitle", function (newTitle) {
                    if (!chart) return;
                    chart.setTitle(null, {text:newTitle});
                }, true);
                $scope.$watch("ngModel.options", function (newOptions, oldOptions, scope) {

                    //do nothing when called on registration
                    if (angular.isUndefined(newOptions) || newOptions === oldOptions) return;

                    if (chart)
                        chart.destroy();

                    chart = _createChart(newOptions);

                    ensureIds(newOptions.series);
                    angular.forEach(newOptions.series, function (s) {
                        chart.addSeries(angular.copy(s), false)
                    });
                    chart.redraw();

                }, true);

                if($scope.ngModel)
                    chart = _createChart($scope.ngModel.options);
            }
        }
    }]);