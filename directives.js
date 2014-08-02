var directives = angular.module('planner.directives', []);


directives.directive('menu', function ($window) {
	var link = function (scope, element, attrs) {
		var windowHeight = $window.innerHeight;
		console.log('Setting menu height to %spx', windowHeight)
		element.css('height', windowHeight + 'px');
		console.log(element, element.css('height'));
	};

	return {link: link};
});
