/* services.js */

// don't forget to declare this service module as a dependency in your main app constructor!
var ra_logServices = angular.module('ra_log.services', []);

ra_logServices.factory('alertService', ['$rootScope', function($rootScope) {
    var alertService = {};

    // create an array of alerts available globally
    $rootScope.alerts = [];

    alertService.add = function(type, msg) {
        $rootScope.alerts.push({'type': type, 'msg': msg});
    };

    alertService.closeAlert = function(index) {
        $rootScope.alerts.splice(index, 1);
    };

    return alertService;
}]);