angular.module('ra_log.resources', ['ngResource'])

    .factory('ra_log.db', ['couchService', function (couchService) {
        return couchService.use('ralog-sma-data-' + (new Date()).getFullYear())
    }])

    .factory('ra_log.charts', ['ra_log.db', '$filter', 'dateCalculator', function (db, $filter, _dateAdd) {
        var _time = function(y,m,d) {
            return new Date(parseInt(y),parseInt(m)-1,parseInt(d)).getTime();
        };
        var _format = $filter('date');
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
                    var key = "WRTL1EBA:2100122532:Pac";

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
                        "startkey": [ _format(date, 'yyyy') , _format(date, 'MM') ],
                        "endkey": [ _format(date, 'yyyy') , _format(date, 'MM') , {}],
                    }).then(function(response) {
                        var data = [];
                        angular.forEach(response.rows, function(r) {
                            data.push([
                                _time(r.key[0],r.key[1],r.key[2]),
                                r.value.max - r.value.min
                            ]);
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
                        "startkey": [ _format(date, 'yyyy') ],
                        "endkey": [ _format(date, 'yyyy') , {}],
                    }).then(function(response) {
                        var data = [];
                        angular.forEach(response.rows, function(r) {
                            data.push([
                                _time(r.key[0],r.key[1],1),
                                r.value.max - r.value.min
                            ]);
                        });
                        return {
                            "name": _format(date, 'yyyy'),
                            "data": data
                        };
                    });
                }
            },{
                "name": "E-Total (last year)",
                "type": "column",
                "query" : function(date) {
                    var last_year = _dateAdd(date, 'year', -1);
                    return db.query('MeanPublic/e_total',{
                        "group_level": 2,
                        "startkey": [ _format(last_year, 'yyyy') ],
                        "endkey": [ _format(last_year, 'yyyy') , {}],
                    }).then(function(response) {
                        var data = [];
                        angular.forEach(response.rows, function(r) {
                            data.push([
                                _time(date.getFullYear(),r.key[1],1),
                                r.value.max - r.value.min
                            ]);
                        });
                        return {
                            "name": _format(last_year, 'yyyy'),
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
                            data.push([
                                _time(date.getFullYear(),r.key, 1), 
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
                            data.push([
                                _time(r.key[0], 1, 1), 
                                r.value.max - r.value.min
                            ]);
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
                "query": function(date) {
                    return db.query('MeanPublic/e_total',{group: true})
                    .then(function(response) {
                        var data = [];
                        angular.forEach(response.rows, function(r) {
                            data.push([
                                _time(r.key[0],r.key[1],r.key[2]), 
                                r.value.max - r.value.min
                            ]);
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
                        text: 'YTD'
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
                        "startkey": [ _format(date, 'yyyy') ],
                        "endkey": [ _format(date, 'yyyy') , _format(date, 'MM'), _format(date, 'dd')],
                    })
                    .then(function(response) {
                        var data = [];
                        var start = null;
                        angular.forEach(response.rows, function(r) {
                            start = start == null ? r.value.max : start;
                            data.push([
                                _time(r.key[0],r.key[1],r.key[2]), 
                                r.value.max - start
                            ]);
                        });
                        return {
                            "name": _format(date, 'yyyy'),
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
                    var last_year = _dateAdd(date, 'year', -1);
                    return db.query('MeanPublic/e_total',{
                        group: true,
                        "startkey": [ _format(last_year, 'yyyy') ],
                        "endkey": [ _format(last_year, 'yyyy') , _format(date, 'MM'), _format(date, 'dd')],
                    })
                    .then(function(response) {
                        var data = [];
                        var start = null;
                        angular.forEach(response.rows, function(r) {
                            start = start == null ? r.value.max : start;
                            data.push([
                                _time(date.getFullYear(),r.key[1],r.key[2]), 
                                r.value.max - start
                            ]);
                        });
                        return {
                            "name": _format(last_year, 'yyyy'),
                            "data": data
                        };
                    });
                },
                "threshold": null
            },{
                "name": "current_year-2",
                "type": "line",
                //"color": "rgba(124,181,236,0.50)",
                "query": function(date) {
                    var last_year = _dateAdd(date, 'year', -2);
                    return db.query('MeanPublic/e_total',{
                        group: true,
                        "startkey": [ _format(last_year, 'yyyy') ],
                        "endkey": [ _format(last_year, 'yyyy') , _format(date, 'MM'), _format(date, 'dd')],
                    })
                    .then(function(response) {
                        var data = [];
                        var start = null;
                        angular.forEach(response.rows, function(r) {
                            start = start == null ? r.value.max : start;
                            data.push([
                                _time(date.getFullYear(),r.key[1],r.key[2]), 
                                r.value.max - start
                            ]);
                        });
                        return {
                            "name": _format(last_year, 'yyyy'),
                            "data": data
                        };
                    });
                },
                "threshold": null
            },{
                "name": "current_year-3",
                "type": "line",
                //"color": "rgba(124,181,236,0.25)",
                "query": function(date) {
                    var last_year = _dateAdd(date, 'year', -3);
                    return db.query('MeanPublic/e_total',{
                        group: true,
                        "startkey": [ _format(last_year, 'yyyy') ],
                        "endkey": [ _format(last_year, 'yyyy') , _format(date, 'MM'), _format(date, 'dd')],
                    })
                    .then(function(response) {
                        var data = [];
                        var start = null;
                        angular.forEach(response.rows, function(r) {
                            start = start == null ? r.value.max : start;
                            data.push([
                                _time(date.getFullYear(),r.key[1],r.key[2]), 
                                r.value.max - start
                            ]);
                        });
                        return {
                            "name": _format(last_year, 'yyyy'),
                            "data": data
                        };
                    });
                },
                "threshold": null
            }]
        }]
    }])
;

