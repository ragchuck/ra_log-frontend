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

    .factory('couchService', ['$rootScope', 'CONFIG', function($rootScope, CONFIG) {
    	//window.Promise =$q()
        //PouchDB.debug.disable();
        return { 
            use: function(dbName) {
                return new PouchDB(CONFIG.COUCH_DB_URL + dbName);
            }
        };
    }])

;