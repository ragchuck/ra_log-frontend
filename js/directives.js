'use strict';

angular.module('highcharts-ng', [])
    .directive('highchart', function () {
        var seriesId = 0;
        var ensureIds = function (series) {
            angular.forEach(series,function (s) {
                if (!angular.isDefined(s.id)) {
                    s.id = "series-" + seriesId++;
                };
            });
        };

        var getMergedOptions = function (element, options) {
            var defaultOptions = {
                chart: {
                    renderTo: element[0],
                    width: $(element[0]).parent().width()
                },
                title: {},
                subtitle: {},
                series: []
            };
            var mergedOptions = {};
            if (options) {
                mergedOptions = $.extend(true, {}, options, defaultOptions);
            } else {
                mergedOptions = defaultOptions;
            }
            return mergedOptions;
        };

        var createChart = function ($scope, element, options) {

            var mergedOptions = getMergedOptions(element, options);
            mergedOptions.title.text = $scope.ngModel.title;
            mergedOptions.subtitle.text = $scope.ngModel.subtitle || null;
            return new Highcharts.Chart(mergedOptions);
        };

        return {
            restrict: 'EC',
            replace: false,
            scope: {
                ngModel: '='
            },
            require: 'ngModel',
            link: function ($scope, element, attrs) {

                var chart;

                chart = $scope.ngModel.Highchart = createChart($scope, element, $scope.ngModel.options);


                $scope.$watch("ngModel.series", function (newSeries, oldSeries) {
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
                    chart.setTitle({text:newTitle});
                }, true);
                $scope.$watch("ngModel.subtitle", function (newTitle) {
                    chart.setTitle(null, {text:newTitle});
                }, true);
                $scope.$watch("ngModel.options", function (newOptions, oldOptions, scope) {
                    //console.log("watch->options", arguments);
                    //do nothing when called on registration
                    if (newOptions === oldOptions) return;

                    chart.destroy();

                    chart = $scope.ngModel.Highchart = createChart($scope, element, newOptions);

                    ensureIds(scope.ngModel.series);
                    angular.forEach(scope.ngModel.series, function (s) {
                        chart.addSeries(angular.copy(s), false)
                    });
                    chart.redraw();

                }, true);
            }
        }
    });