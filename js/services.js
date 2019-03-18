/* services.js */

angular.module('ra_log.services', ['ra_log.config'])

    .factory('notify', ['$rootScope', function ($rootScope) {
        var bc = function (type, msg) {
            $rootScope.$broadcast('notify', {'type': type, 'msg': msg});
        };
        return {
            "error":   function(msg) { bc('danger' , msg)},
            "info":    function(msg) { bc('info'   , msg)},
            "warning": function(msg) { bc('warning', msg)},
            "success": function(msg) { bc('success', msg)}
        }            
    }])

    .factory('themeSelection', ['$rootScope', function ($rootScope) {
        return function(theme, type) {
        	$rootScope.$broadcast('themeSelection', theme, type);
        };
    }])

    .factory('localDB', function() {
        return new PouchDB('localDB');
    })

    .factory('couchService', ['$rootScope', 'COUCH_DB_URL', function($rootScope, COUCH_DB_URL) {
    	//window.Promise =$q()
        //PouchDB.debug.disable();
        return { 
            use: function(dbName) {
                return new PouchDB(COUCH_DB_URL + dbName);
            }
        };
    }])

    .factory('dateCalculator', function() {
        return function (objDate, sInterval, iNum) {
            var objDate2 = new Date(objDate);
            if (!sInterval || iNum == 0) return objDate2;
            switch (sInterval.toLowerCase()) {
                case "day": return objDate2.setDate(objDate2.getDate() + iNum);
                case "month": return objDate2.setMonth(objDate2.getMonth() + iNum);
                case "year": return objDate2.setFullYear(objDate2.getFullYear() + iNum);
            }
            return objDate2;
        };
    })

;