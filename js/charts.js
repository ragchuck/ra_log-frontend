ra_log.charts.push({
    "name": "day",
    "title": "Daychart",
    "options": {
        "plotOptions": {
            "area": {
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
        "title": {
            "text": null
        },
        "subtitle": {
            "text": null
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
    "getSeries": function(date) {
        console.log('-> getSeries', date);
    }

});