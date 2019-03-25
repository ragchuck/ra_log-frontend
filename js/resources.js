angular.module('ra_log.resources', ['ngResource'])

    .factory('ra_log.db', ['couchService', function (couchService) {
        return couchService.use('ralog-sma-data-' + (moment().year()))
    }])

    .factory('ra_log.charts', ['ra_log.db', 'CONFIG', function (db, CONFIG) {
        // var _time = function(y,m,d) {
        //     return new Date(parseInt(y),parseInt(m)-1,parseInt(d)).getTime();
        // };
        // var _format = $filter('date');
        return [{
            "name": "day",
            "title": "Day",
            "type": "chart",
            "options": {
                "plotOptions": {
                    "area": {
                        "stacking": 'normal',
                        "marker": {
                            "symbol": "circle",
                            "radius": 0,
                            "states": {
                                "hover": {
                                    "enabled": true,
                                    "radius": 4
                                }
                            }
                        }
                    }
                },
                "tooltip": {
                    "shared": true,
                    "valueDecimals": 2,
                    "valueSuffix": " W"
                },
                "xAxis": {
                    "type": "datetime"
                },
                "yAxis": {
                    "min": 0,
                    "title": {
                        "text": null
                    }
                }
            },
            "series": [{
                "name": "Pac",
                "type": "area",
                "query": function(date) {
                    var key = CONFIG.WEBBOX_KEY + ":Pac";

                    return db.query('MeanPublic/by_key_and_time', {
                        "startkey": [key, date.format('YYYY-MM-DD') + 'T00:00:00'],
                        "endkey": [key, date.format('YYYY-MM-DD') + 'T23:59:59']
                    }).then(function(response) {
                        var data = [];
                        angular.forEach(response.rows, function(r) {
                            data.push([
                                +moment(r.key[1]), 
                                r.value
                            ]);
                        })
                        return {
                            "data": data
                        };
                    });
                }
            }/*,{
                "name": "A.Ms.Watt",
                "type": "area",
                "query": function(date) {
                    var key = "WRTL1EBA:2100122532:A.Ms.Watt";

                    return db.query('MeanPublic/by_key_and_time', {
                        "startkey": [key, _format(date, 'yyyy-MM-dd') + 'T00:00:00'],
                        "endkey": [key, _format(date, 'yyyy-MM-dd') + 'T23:59:59']
                    }).then(function(response) {
                        var data = [];
                        angular.forEach(response.rows, function(r) {
                            data.push([
                                new Date(r.key[1]).getTime(), 
                                r.value
                            ]);
                        })
                        return data;
                    });
                }
            },{
                "name": "B.Ms.Watt",
                "type": "area",
                "query": function(date) {
                    var key = "WRTL1EBA:2100122532:B.Ms.Watt";

                    return db.query('MeanPublic/by_key_and_time', {
                        "startkey": [key, _format(date, 'yyyy-MM-dd') + 'T00:00:00'],
                        "endkey": [key, _format(date, 'yyyy-MM-dd') + 'T23:59:59']
                    }).then(function(response) {
                        var data = [];
                        angular.forEach(response.rows, function(r) {
                            data.push([
                                new Date(r.key[1]).getTime(), 
                                r.value
                            ]);
                        })
                        return data;
                    });
                }
            }*/]
        },{
            "name": "month",
            "title": "Month",
            "type": "chart",
            "options": {
                "plotOptions": {
                    "column": {
                        padding: 0,
                        groupPadding: 0
                    }
                },
                "tooltip": {
                    "shared": true,
                    "valueDecimals": 2,
                    "valueSuffix": " kWh"
                },
                "xAxis": {
                    "type": "datetime"
                },
                "yAxis": {
                    "min": 0,
                    "title": {
                        "text": null
                    }
                }
            },
            "series": [{
                "name": "E-Total",
                "type": "column",
                "query": function(date) {
                    return db.query('MeanPublic/e_total',{
                        "group": true,
                        "startkey": [ date.format('YYYY') , date.format('MM') ],
                        "endkey": [ date.format('YYYY') , date.format('MM') , {}],
                    }).then(function(response) {
                        var data = [];
                        angular.forEach(response.rows, function(r) {
                            var time = moment([r.key[0],r.key[1]-1,r.key[2]]);
                            data.push({
                                x: +time,
                                y: r.value.max - r.value.min,
                                path: '/chart/day/' + time.format("YYYY/MM/DD")
                            });
                        });
                        return {
                            "data": data
                        };
                    });         
                }
            }]
        },{
            "name": "year",
            "title": "Year",
            "type": "chart",
            "options": {
                "xAxis": {
                    "type": "datetime"
                },
                "yAxis": {
                    "min": 0,
                    "title": {
                        "text": null
                    }
                },
                "tooltip": {
                    "shared": true,
                    "valueDecimals": 2,
                    "valueSuffix": " kWh"
                }
            },
            "series": [{
                "name": "E-Total",
                "type": "column",
                "query" : function(date) {
                    return db.query('MeanPublic/e_total',{
                        "group_level": 2,
                        "startkey": [ date.format('YYYY') ],
                        "endkey": [ date.format('YYYY') , {}],
                    }).then(function(response) {
                        var data = [];
                        angular.forEach(response.rows, function(r) {
                            var time = moment([r.key[0],r.key[1]-1]);
                            data.push({
                                x: +time,
                                y: r.value.max - r.value.min,
                                path: '/chart/month/' + time.format('YYYY/MM')
                            });
                        });
                        return {
                            "name": date.format('YYYY'),
                            "data": data
                        };
                    });
                }
            },{
                "name": "E-Total (last year)",
                "type": "column",
                "query" : function(date) {
                    var last_year = moment(date).subtract(1, 'years');
                    return db.query('MeanPublic/e_total',{
                        "group_level": 2,
                        "startkey": [ last_year.format('YYYY') ],
                        "endkey": [ last_year.format('YYYY'), {}],
                    }).then(function(response) {
                        var data = [];
                        angular.forEach(response.rows, function(r) {
                            var time = moment([r.key[0],r.key[1]-1]);
                            data.push({
                                x: +moment([date.year(),r.key[1]-1]),
                                y: r.value.max - r.value.min,
                                path: '/chart/month/' + time.format('YYYY/MM')
                            });
                        });
                        return {
                            "name": last_year.format('YYYY'),
                            "data": data
                        };
                    });
                }
            },{
                "name": "E-Total (avg)",
                "type": "spline",            
                "query" : function(date) {
                    return db.query('MeanPublic/e_total_by_month',{
                        "group": true
                    }).then(function(response) {
                        var data = [];
                        angular.forEach(response.rows,function(r) {
                            var time = moment([date.year(),r.key-1]);
                            data.push([
                                +time, 
                                r.value.sum / Math.round(r.value.count / 30)
                            ]);
                        });
                        return {
                            "data": data
                        };
                    });
                }
            }]
        },{
            "name": "overview",
            "title": "Overview",
            "type": "chart",
            "options": {
                "xAxis": {
                    "type": "datetime"
                },
                "yAxis": {
                    "min": 0,
                    "title": {
                        "text": null
                    }
                },
                "tooltip": {
                    "shared": true,
                    "valueDecimals": 2,
                    "valueSuffix": " kWh"
                }
            },
            "series": [{
                "name": "E-Totals",
                "type": "column",
                "query" : function(date) {
                    return db.query('MeanPublic/e_total',{
                        "group_level": 1
                    }).then(function(response) {
                        var data = [];
                        angular.forEach(response.rows, function(r) {
                            var time = moment([r.key[0]]);
                            data.push({
                                x: +time,
                                y: r.value.max - r.value.min,
                                path: '/chart/year/' + time.year()
                            });
                        });
                        return {
                            "data": data
                        };
                    });
                }
            }]
        },{
            "name": "total",
            "title": "E-Total",
            "type": "stockChart",
            "options": {
                "plotOptions": {
                    "area": {
                        "dataGrouping": {
                            "approximation": "average",
                            //forced: true,
                            "groupPixelWidth": 10,
                            "smoothed": true
                        }
                    }
                },
                "rangeSelector": {
                    "buttons": [{
                        "type": 'week',
                        "count": 1,
                        "text": '1w'
                    },{
                        "type": 'month',
                        "count": 1,
                        "text": '1m'
                    }, {
                        "type": 'month',
                        "count": 3,
                        "text": '3m'
                    }, {
                        "type": 'month',
                        "count": 6,
                        "text": '6m'
                    }, {
                        "type": 'ytd',
                        "text": 'YTD'
                    }, {
                        "type": 'year',
                        "count": 1,
                        "text": '1y'
                    }, {
                        "type": 'all',
                        "text": 'All'
                    }],
                    "selected": 2
                },
                "yAxis": {
                    "min": 0,
                    "title": {
                        "text": null
                    }
                },
                "tooltip": {
                    "shared": true,
                    "valueDecimals": 2,
                    "valueSuffix": " kWh"
                },
            },
            "series": [{
                "name": "E-Total",
                "type": "column",
                "turboThreshold": 0,  // disable error #12 https://www.highcharts.com/errors/12/
                "query": function(date) {
                    return db.query('MeanPublic/e_total',{group: true})
                    .then(function(response) {
                        var data = [];
                        angular.forEach(response.rows, function(r) {
                            var time = moment([r.key[0],r.key[1]-1,r.key[2]])
                            data.push({
                                x: +time, 
                                y: r.value.max - r.value.min,
                                path: r.key[0] == date.format('YYYY') ? '/chart/day/' + time.format('YYYY/MM/DD') : null
                            });
                        });
                        return {
                            "data": data
                        };
                    });
                },
                "threshold": null
            }]
        },{
            "name": "total_ytd",
            "title": "Year-to-Date",
            "type": "stockChart",
            "options": {
                "plotOptions": {
                    "line": {
                        "dataGrouping": {
                            "approximation": "average",
                            //forced: true,
                            "groupPixelWidth": 10,
                            "smoothed": true
                        }
                    }
                },
                "rangeSelector": {
                    "buttons": [{
                        "type": 'week',
                        "count": 1,
                        "text": '1w'
                    },{
                        "type": 'month',
                        "count": 1,
                        "text": '1m'
                    }, {
                        "type": 'month',
                        "count": 3,
                        "text": '3m'
                    }, {
                        "type": 'month',
                        "count": 6,
                        "text": '6m'
                    }, {
                        "type": 'ytd',
                        "text": 'YTD'
                    }, {
                        "type": 'year',
                        "count": 1,
                        "text": '1y'
                    }, {
                        "type": 'all',
                        "text": 'All'
                    }],
                    "selected": 4
                },
                "yAxis": {
                    "min": 0,
                    "title": {
                        "text": null
                    }
                },
                "tooltip": {
                    "valueDecimals": 2,
                    "valueSuffix": " kWh"
                },
            },
            "navigator": {
                "enabled": false
            },
            "series": [{
                "name": "current_year",
                "type": "line",
                //"color": "rgba(124,181,236,1)",
                "query": function(date) {
                    return db.query('MeanPublic/e_total',{
                        group: true,
                        "startkey": [ date.format('YYYY') ],
                        "endkey": [ 
                            date.format('YYYY') , 
                            date.format('MM'), 
                            date.format('DD')
                        ],
                    })
                    .then(function(response) {
                        var data = [];
                        var start = null;
                        angular.forEach(response.rows, function(r) {
                            start = start == null ? r.value.max : start;
                            data.push([
                                +moment([r.key[0],r.key[1]-1,r.key[2]]), 
                                r.value.max - start
                            ]);
                        });
                        return {
                            "name": date.format('YYYY'),
                            "data": data
                        };
                    });
                },
                "threshold": null
            },{
                "name": "current_year-1",
                "type": "line",
                //"color": "rgba(124,181,236,0.75)",
                "query": function(date) {
                    var last_year = moment(date).subtract(1, 'year');
                    return db.query('MeanPublic/e_total',{
                        group: true,
                        "startkey": [ last_year.format('YYYY') ],
                        "endkey": [ 
                            last_year.format('YYYY') , 
                            date.format('MM'), 
                            date.format('DD')
                        ],
                    })
                    .then(function(response) {
                        var data = [];
                        var start = null;
                        angular.forEach(response.rows, function(r) {
                            start = start == null ? r.value.max : start;
                            data.push([
                                +moment([date.year(),r.key[1]-1,r.key[2]]), 
                                r.value.max - start
                            ]);
                        });
                        return {
                            "name": last_year.format('YYYY'),
                            "data": data
                        };
                    });
                },
                "threshold": null
            },{
                "name": "current_year-best",
                "type": "line",
                //"color": "rgba(124,181,236,0.25)",
                "query": function(date) {
                    return db.query('MeanPublic/e_total',{
                        group: true,
                        "startkey": [ CONFIG.BEST_YEAR ],
                        "endkey": [
                            CONFIG.BEST_YEAR , 
                            date.format('MM'), 
                            date.format('DD')],
                    })
                    .then(function(response) {
                        var data = [];
                        var start = null;
                        angular.forEach(response.rows, function(r) {
                            start = start == null ? r.value.max : start;
                            data.push([
                                +moment([date.year(),r.key[1]-1,r.key[2]]), 
                                r.value.max - start
                            ]);
                        });
                        return {
                            "name": "Best year (" + CONFIG.BEST_YEAR + ")",
                            "data": data
                        };
                    });
                },
                "threshold": null
            },{
                "name": "current_year-worst",
                "type": "line",
                //"color": "rgba(124,181,236,0.50)",
                "query": function(date) {
                    return db.query('MeanPublic/e_total',{
                        group: true,
                        "startkey": [ CONFIG.WORST_YEAR ],
                        "endkey": [ 
                            CONFIG.WORST_YEAR , 
                            date.format('MM'), 
                            date.format('DD')
                        ],
                    })
                    .then(function(response) {
                        var data = [];
                        var start = null;
                        angular.forEach(response.rows, function(r) {
                            start = start == null ? r.value.max : start;
                            data.push([
                                +moment([date.year(),r.key[1]-1,r.key[2]]), 
                                r.value.max - start
                            ]);
                        });
                        return {
                            "name": "Worst year (" + CONFIG.WORST_YEAR + ")",
                            "data": data
                        };
                    });
                },
                "threshold": null
            }]
        }]
    }])
;

